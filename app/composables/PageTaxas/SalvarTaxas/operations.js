import { toStr, toInt, resolveIdLinhas } from './utils.js'
import { mapTaxa, validateBeforeSend } from './mappers.js'

/**
 * Operações CRUD para taxas no Supabase
 */

export const createUpsertOperations = (supabase, state) => {
  const { loading, error, success, resumo } = state

  const upsertTaxas = async (
    taxas,
    {
      chunkSize = 200,
      returning = 'minimal',
      limparAntes = true  // Nova opção para controlar a limpeza
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

      // 2) NOVA ETAPA: Limpar taxas existentes da empresa antes de inserir
      if (limparAntes) {
        // Pegar todas as empresas únicas dos registros válidos
        const empresasParaLimpar = [...new Set(validos.map(item => item.empresa))]
        
        for (const empresa of empresasParaLimpar) {
          console.log(`🧹 Limpando taxas existentes da empresa: ${empresa}`)
          
          const { error: deleteError, count } = await supabase
            .from('cadastro_taxas')
            .delete()
            .eq('empresa', empresa)
          
          if (deleteError) {
            console.error('❌ Erro ao limpar taxas da empresa:', empresa, deleteError)
            resumo.value.erros.push(`Falha ao limpar empresa ${empresa}: ${deleteError.message}`)
          } else {
            console.log(`✅ Limpeza concluída para empresa ${empresa}. Registros removidos: ${count || 'N/A'}`)
          }
        }
      }
  
      // 3) Inserir todas as novas taxas (agora sem conflitos)
      for (let i = 0; i < validos.length; i += chunkSize) {
        const chunk = validos.slice(i, i + chunkSize)
        
        const { error: insertError } = await supabase
          .from('cadastro_taxas')
          .insert(chunk)
        
        if (insertError) {
          console.error('❌ Erro no insert do chunk:', insertError)
          resumo.value.erros.push(`Insert falhou no chunk ${i / chunkSize + 1}: ${insertError.message}`)
          resumo.value.falha += chunk.length
        } else {
          console.log(`✅ Inserido chunk ${i / chunkSize + 1}:`, chunk.length, 'registros')
          resumo.value.sucesso += chunk.length
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