import { toStr, toInt, resolveIdLinhas } from './utils.js'
import { mapTaxa, validateBeforeSend } from './mappers.js'

/**
 * Operações CRUD para taxas no Supabase
 */

export const createUpsertOperations = (supabase, state) => {
  const { loading, error, success, resumo } = state
  const buildCompositeKey = (item) => [
    toStr(item?.empresa).toLowerCase(),
    String(toInt(item?.EC ?? item?.ec) ?? ''),
    toStr(item?.adquirente).toLowerCase(),
    toStr(item?.bandeira).toLowerCase(),
    toStr(item?.modalidade).toLowerCase(),
    String(toInt(item?.parcelas) ?? '')
  ].join('|')
  const buildScopeKey = (item) => [
    toStr(item?.empresa).toLowerCase(),
    String(toInt(item?.EC ?? item?.ec) ?? '')
  ].join('|')

  const upsertTaxas = async (
    taxas,
    {
      chunkSize = 200,
      returning = 'minimal'
    } = {}
  ) => {
    loading.value = true
    error.value = null
    success.value = false
    resumo.value = { processadas: 0, sucesso: 0, falha: 0, erros: [] }
  
    try {
      if (!Array.isArray(taxas) || taxas.length === 0) {
        throw new Error('Nenhuma taxa para enviar')
      }
  
      const mapped = taxas.map(mapTaxa)
      resumo.value.processadas = mapped.length
  
      // 1) Validação local ANTES do envio
      const validos = []
      mapped.forEach((item, idx) => {
        const problemas = validateBeforeSend(item)
        if (problemas.length > 0) {
          resumo.value.falha += 1
          resumo.value.erros.push(`Registro ${idx + 1}: ${problemas.join(', ')}`)
        } else {
          validos.push(item)
        }
      })
  
      if (validos.length === 0) {
        error.value = 'Todos os registros falharam na validação local. Verifique resumo.erros para detalhes.'
        console.error('❌ Validação local falhou para todos:', resumo.value.erros)
        return { ok: false, ...resumo.value }
      }

      const empresasSincronizadas = [...new Set(validos.map(item => item.empresa).filter(Boolean))]
      const { data: existentes, error: fetchError } = await supabase
        .from('cadastro_taxas')
        .select('id_linhas, empresa, EC, adquirente, bandeira, modalidade, parcelas')
        .in('empresa', empresasSincronizadas)

      if (fetchError) {
        throw new Error(`Falha ao carregar taxas atuais: ${fetchError.message}`)
      }

      const atuais = Array.isArray(existentes) ? existentes : []
      const atuaisPorId = new Map(atuais.map(item => [resolveIdLinhas(item), item]))
      const atuaisPorChave = new Map(atuais.map(item => [buildCompositeKey(item), item]))
      const idsMantidos = new Set()
      const scopesSincronizados = new Set(validos.map(item => buildScopeKey(item)))

      for (let i = 0; i < validos.length; i += chunkSize) {
        const chunk = validos.slice(i, i + chunkSize)

        for (const item of chunk) {
          const itemId = resolveIdLinhas(item)
          const chave = buildCompositeKey(item)
          const atual = atuaisPorId.get(itemId) || atuaisPorChave.get(chave)

          if (atual?.id_linhas !== undefined && atual?.id_linhas !== null) {
            const { error: updateError } = await supabase
              .from('cadastro_taxas')
              .update(item)
              .eq('id_linhas', atual.id_linhas)

            if (updateError) {
              console.error('❌ Erro ao atualizar taxa:', updateError)
              resumo.value.erros.push(`Falha ao atualizar ${item.empresa}/${item.adquirente}/${item.bandeira}: ${updateError.message}`)
              resumo.value.falha += 1
              continue
            }

            idsMantidos.add(Number(atual.id_linhas))
            resumo.value.sucesso += 1
            continue
          }

          const { data: inserted, error: insertError } = await supabase
            .from('cadastro_taxas')
            .insert(item)
            .select('id_linhas')
            .single()

          if (insertError) {
            console.error('❌ Erro ao inserir taxa:', insertError)
            resumo.value.erros.push(`Falha ao inserir ${item.empresa}/${item.adquirente}/${item.bandeira}: ${insertError.message}`)
            resumo.value.falha += 1
            continue
          }

          if (inserted?.id_linhas !== undefined && inserted?.id_linhas !== null) {
            idsMantidos.add(Number(inserted.id_linhas))
            atuaisPorId.set(Number(inserted.id_linhas), inserted)
          }

          resumo.value.sucesso += 1
        }
      }

      const idsRemover = atuais
        .filter(item => scopesSincronizados.has(buildScopeKey(item)))
        .map(item => Number(item.id_linhas))
        .filter(id => Number.isFinite(id) && !idsMantidos.has(id))

      if (idsRemover.length > 0) {
        const { error: deleteError } = await supabase
          .from('cadastro_taxas')
          .delete()
          .in('id_linhas', idsRemover)

        if (deleteError) {
          console.error('❌ Erro ao remover taxas obsoletas:', deleteError)
          resumo.value.erros.push(`Falha ao remover taxas antigas: ${deleteError.message}`)
        }
      }
  
      success.value = resumo.value.falha === 0
      if (!success.value) {
        const amostraErros = resumo.value.erros.slice(0, 3).join('; ')
        error.value = `Alguns registros falharam. Ex.: ${amostraErros}`
        console.warn('⚠️ Resumo de erros (amostra):', resumo.value.erros.slice(0, 10))
      }
  
      return { ok: success.value, ...resumo.value }
    } catch (e) {
      error.value = e?.message || 'Erro inesperado no upsert'
      return { ok: false, ...resumo.value }
    } finally {
      loading.value = false
    }
  }

  // UPSERT de uma única taxa
  const upsertTaxa = async (taxa, options = {}) => {
    const r = await upsertTaxas([taxa], options)
    return r?.ok
  }

  const removerTaxas = async (
    taxasParaRemover,
    {
      chunkSize = 200,
      criterio = 'id_linhas' // 'id_linhas', 'chave_composta' ou 'empresa'
    } = {}
  ) => {
    loading.value = true
    error.value = null
    success.value = false
    resumo.value = { processadas: 0, sucesso: 0, falha: 0, erros: [] }

    try {
      if (!Array.isArray(taxasParaRemover) || taxasParaRemover.length === 0) {
        throw new Error('Nenhuma taxa para remover')
      }

      resumo.value.processadas = taxasParaRemover.length
      console.log(`🗑️ Iniciando remoção de ${taxasParaRemover.length} taxas usando critério: ${criterio}`)

      // Processar em chunks para evitar sobrecarga
      for (let i = 0; i < taxasParaRemover.length; i += chunkSize) {
        const chunk = taxasParaRemover.slice(i, i + chunkSize)
        
        for (const taxa of chunk) {
          try {
            let query = supabase.from('cadastro_taxas').delete()
            
            // Aplicar critério de remoção
            switch (criterio) {
              case 'id_linhas':
                const idLinhas = resolveIdLinhas(taxa)
                if (!idLinhas) {
                  throw new Error('ID da linha não encontrado')
                }
                query = query.eq('id_linhas', idLinhas)
                console.log(`🎯 Removendo por id_linhas: ${idLinhas}`)
                break
                
              case 'chave_composta':
                // Remove por combinação única de empresa+adquirente+bandeira+modalidade+parcelas
                query = query
                  .eq('empresa', toStr(taxa?.empresa))
                  .eq('adquirente', toStr(taxa?.adquirente))
                  .eq('bandeira', toStr(taxa?.bandeira))
                  .eq('modalidade', toStr(taxa?.modalidade))
                  .eq('parcelas', toInt(taxa?.parcelas))
                console.log(`🎯 Removendo por chave composta:`, {
                  empresa: toStr(taxa?.empresa),
                  adquirente: toStr(taxa?.adquirente),
                  bandeira: toStr(taxa?.bandeira),
                  modalidade: toStr(taxa?.modalidade),
                  parcelas: toInt(taxa?.parcelas)
                })
                break
                
              case 'empresa':
                // Remove todas as taxas da empresa
                query = query.eq('empresa', toStr(taxa?.empresa))
                console.log(`🎯 Removendo todas as taxas da empresa: ${toStr(taxa?.empresa)}`)
                break
                
              default:
                throw new Error(`Critério de remoção inválido: ${criterio}`)
            }
            
            const { error: deleteError, count } = await query
            
            if (deleteError) {
              console.error('❌ Erro ao remover taxa:', deleteError)
              resumo.value.falha += 1
              resumo.value.erros.push(`Falha ao remover: ${deleteError.message}`)
            } else {
              const removidos = count || 0
              console.log(`✅ Taxa removida com sucesso. Registros afetados: ${removidos}`)
              resumo.value.sucesso += 1
            }
            
          } catch (taxaError) {
            console.error('❌ Erro ao processar remoção da taxa:', taxaError)
            resumo.value.falha += 1
            resumo.value.erros.push(`Erro na taxa: ${taxaError.message}`)
          }
        }
      }
      
      success.value = resumo.value.falha === 0
      if (!success.value) {
        const amostraErros = resumo.value.erros.slice(0, 3).join('; ')
        error.value = `Algumas remoções falharam. Ex.: ${amostraErros}`
        console.warn('⚠️ Resumo de erros na remoção:', resumo.value.erros.slice(0, 10))
      }
      
      return { ok: success.value, ...resumo.value }
      
    } catch (e) {
      error.value = e?.message || 'Erro inesperado na remoção'
      return { ok: false, ...resumo.value }
    } finally {
      loading.value = false
    }
  }

  // Função auxiliar para remover uma única taxa
  const removerTaxa = async (taxa, options = {}) => {
    const r = await removerTaxas([taxa], options)
    return r?.ok
  }

  return {
    upsertTaxas,
    upsertTaxa,
    removerTaxas,
    removerTaxa
  }
}
