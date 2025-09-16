import { ref } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase' // caminho relativo a partir de PageTaxas

// Composable para inserir/atualizar taxas na tabela 'cadastro_taxas' sem duplicar
export const useTaxasSupabase = () => {
  const { supabase, error: apiError } = useAPIsupabase()

  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)
  const resumo = ref({ processadas: 0, sucesso: 0, falha: 0, erros: [] })

  // Util: normaliza strings
  const toStr = (v) => String(v ?? '').trim()

  // Util: converte string numérica pt-BR para número JS
  const toNumber = (valor) => {
    if (valor === null || valor === undefined || valor === '') return null
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
    if (typeof valor !== 'string') return null
    const limpo = valor.replace(/[^\d,.-]/g, '')
    if (!limpo) return null
    // Se tem vírgula, assume vírgula como decimal
    if (limpo.includes(',')) {
      const s = limpo.replace(/\./g, '').replace(',', '.')
      const n = parseFloat(s)
      return Number.isFinite(n) ? n : null
    }
    const n = parseFloat(limpo)
    return Number.isFinite(n) ? n : null
  }

  // Util: inteiro (parcelas normalmente é inteiro)
  const toInt = (valor) => {
    const n = toNumber(valor)
    if (n === null) return null
    const i = parseInt(String(n), 10)
    return Number.isFinite(i) ? i : null
  }

  // Gera/normaliza id_linhas. Se não vier, usa chave composta (empresa+adquirente+bandeira+modalidade+parcelas)
  const resolveIdLinhas = (t) => {
    // Se já tem um ID numérico válido, usa ele
    if (t?.id_linhas && typeof t.id_linhas === 'number') {
      return t.id_linhas
    }
    
    // Se tem um ID que pode ser convertido para número
    if (t?.id_linhas && !isNaN(Number(t.id_linhas))) {
      return Number(t.id_linhas)
    }
    
    // Se tem um ID do frontend
    if (t?.id && !isNaN(Number(t.id))) {
      return Number(t.id)
    }
    
    // Gerar um ID numérico único baseado em timestamp + hash simples
    const timestamp = Date.now()
    const hashString = `${toStr(t?.empresa)}${toStr(t?.adquirente)}${toStr(t?.bandeira)}${toStr(t?.modalidade)}${toStr(t?.parcelas)}`
    
    // Criar um hash numérico simples da string
    let hash = 0
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Converter para 32bit integer
    }
    
    // Combinar timestamp com hash para garantir unicidade
    return Math.abs(timestamp + Math.abs(hash))
  }

  // Mapeia a taxa do front para as colunas de cadastro_taxas
  const mapTaxa = (taxa) => {
    const parcelas = toInt(taxa?.parcelas)
    const taxaNumero = toNumber(taxa?.percentualTaxa ?? taxa?.taxa)
    // Corrigido: buscar data_corte de várias fontes possíveis
    const dataCorte = toInt(taxa?.data_corte ?? taxa?.dataCorte ?? taxa?.diasCorte ?? taxa?.data_de_corte)

    const payload = {
      id_linhas: resolveIdLinhas(taxa),
      empresa: toStr(taxa?.empresa),
      adquirente: toStr(taxa?.adquirente),
      bandeira: toStr(taxa?.bandeira),
      modalidade: toStr(taxa?.modalidade),
      parcelas: parcelas,
      taxa: taxaNumero,
      data_corte: dataCorte  // Este campo vai para a coluna data_corte no Supabase
    }

    console.log('📋 Mapeando taxa:', {
      original: {
        data_corte: taxa?.data_corte,
        dataCorte: taxa?.dataCorte,
        diasCorte: taxa?.diasCorte,
        data_de_corte: taxa?.data_de_corte
      },
      mapeado: {
        data_corte: dataCorte
      }
    })

    return payload
  }

  // Validação mínima antes do envio
  const validateBeforeSend = (item) => {
    const problemas = []
    
    // Validar campos obrigatórios
    ;['empresa', 'adquirente', 'bandeira', 'modalidade'].forEach((c) => {
      if (!item?.[c]) problemas.push(`${c} ausente`)
    })
    
    // Validar campos numéricos
    if (item?.parcelas !== null && item?.parcelas !== undefined && !Number.isFinite(item.parcelas)) {
      problemas.push('parcelas inválido (não numérico)')
    }
    if (item?.taxa !== null && item?.taxa !== undefined && !Number.isFinite(item.taxa)) {
      problemas.push('taxa inválida (não numérico)')
    }
    if (item?.data_corte !== null && item?.data_corte !== undefined && !Number.isFinite(item.data_corte)) {
      problemas.push('data_corte inválido (não numérico)')
    }
    return problemas
  }

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

  // === Aliases de compatibilidade (mantêm nomes antigos usados nos componentes) ===
  const salvarTaxasNoSupabase = async (taxas, options = {}) => {
    // retorna o mesmo objeto do upsert para você ver resumo/erros se quiser
    return await upsertTaxas(taxas, options)
  }

  const enviarTaxa = async (taxa, options = {}) => {
    return await upsertTaxa(taxa, options)
  }

  const enviarTaxasLote = async (taxas, options = {}) => {
    return await upsertTaxas(taxas, options)
  }

  // Nova função para remover taxas específicas do Supabase
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
              
              if (removidos === 0) {
                console.warn('⚠️ Nenhum registro foi removido (pode não existir no banco)')
                resumo.value.erros.push('Taxa não encontrada no banco para remoção')
              }
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
      
      console.log(`📊 Resumo da remoção:`, {
        processadas: resumo.value.processadas,
        sucesso: resumo.value.sucesso,
        falha: resumo.value.falha,
        criterio
      })
      
      return { ok: success.value, ...resumo.value }
      
    } catch (e) {
      error.value = e?.message || 'Erro inesperado na remoção'
      console.error('❌ Erro geral na remoção:', e)
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

  // Função para sincronizar taxas (remove as que não estão mais na lista)
  const sincronizarTaxas = async (
    taxasAtuais,
    empresa,
    {
      chunkSize = 200,
      limparAntes = true
    } = {}
  ) => {
    console.log(`🔄 Sincronizando taxas da empresa: ${empresa}`)
    
    // Primeiro, limpa todas as taxas da empresa
    if (limparAntes) {
      const { error: deleteError } = await supabase
        .from('cadastro_taxas')
        .delete()
        .eq('empresa', empresa)
        
      if (deleteError) {
        console.error('❌ Erro ao limpar taxas da empresa:', deleteError)
        throw new Error(`Falha ao limpar empresa ${empresa}: ${deleteError.message}`)
      }
      
      console.log(`✅ Taxas da empresa ${empresa} limpas com sucesso`)
    }
    
    // Depois, insere as taxas atuais
    if (taxasAtuais && taxasAtuais.length > 0) {
      return await upsertTaxas(taxasAtuais, { chunkSize, limparAntes: false })
    }
    
    return { ok: true, processadas: 0, sucesso: 0, falha: 0, erros: [] }
  }

  // Nova função para atualizar taxas específicas (edição)
  const atualizarTaxas = async (
    taxasParaAtualizar,
    {
      chunkSize = 200,
      criterio = 'id_linhas' // 'id_linhas' ou 'chave_composta'
    } = {}
  ) => {
    loading.value = true
    error.value = null
    success.value = false
    resumo.value = { processadas: 0, sucesso: 0, falha: 0, erros: [] }

    try {
      if (!Array.isArray(taxasParaAtualizar) || taxasParaAtualizar.length === 0) {
        throw new Error('Nenhuma taxa para atualizar')
      }

      const mapped = taxasParaAtualizar.map(mapTaxa)
      resumo.value.processadas = mapped.length
      
      console.log(`✏️ Iniciando atualização de ${mapped.length} taxas usando critério: ${criterio}`)

      // Validação local ANTES do envio
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

      // Processar em chunks
      for (let i = 0; i < validos.length; i += chunkSize) {
        const chunk = validos.slice(i, i + chunkSize)
        
        for (const taxa of chunk) {
          try {
            let query = supabase.from('cadastro_taxas')
            let whereClause = {}
            
            // Preparar dados para atualização (excluindo campos de identificação)
            const { id_linhas, empresa, adquirente, bandeira, modalidade, parcelas, ...dadosParaAtualizar } = taxa
            
            // Aplicar critério de identificação
            switch (criterio) {
              case 'id_linhas':
                if (!id_linhas) {
                  throw new Error('ID da linha não encontrado para atualização')
                }
                whereClause = { id_linhas }
                query = query.update(dadosParaAtualizar).eq('id_linhas', id_linhas)
                console.log(`✏️ Atualizando por id_linhas: ${id_linhas}`, dadosParaAtualizar)
                break
                
              case 'chave_composta':
                // Atualiza por combinação única
                whereClause = { empresa, adquirente, bandeira, modalidade, parcelas }
                query = query
                  .update(dadosParaAtualizar)
                  .eq('empresa', empresa)
                  .eq('adquirente', adquirente)
                  .eq('bandeira', bandeira)
                  .eq('modalidade', modalidade)
                  .eq('parcelas', parcelas)
                console.log(`✏️ Atualizando por chave composta:`, whereClause, dadosParaAtualizar)
                break
                
              default:
                throw new Error(`Critério de atualização inválido: ${criterio}`)
            }
            
            const { error: updateError, count } = await query
            
            if (updateError) {
              console.error('❌ Erro ao atualizar taxa:', updateError)
              resumo.value.falha += 1
              resumo.value.erros.push(`Falha ao atualizar: ${updateError.message}`)
            } else {
              const atualizados = count || 0
              
              if (atualizados === 0) {
                // Se não encontrou para atualizar, tenta inserir como novo registro
                console.warn('⚠️ Taxa não encontrada para atualização, inserindo como nova...')
                
                const { error: insertError } = await supabase
                  .from('cadastro_taxas')
                  .insert([taxa])
                
                if (insertError) {
                  console.error('❌ Erro ao inserir nova taxa:', insertError)
                  resumo.value.falha += 1
                  resumo.value.erros.push(`Falha ao inserir nova taxa: ${insertError.message}`)
                } else {
                  console.log('✅ Nova taxa inserida com sucesso')
                  resumo.value.sucesso += 1
                }
              } else {
                console.log(`✅ Taxa atualizada com sucesso. Registros afetados: ${atualizados}`)
                resumo.value.sucesso += 1
              }
            }
            
          } catch (taxaError) {
            console.error('❌ Erro ao processar atualização da taxa:', taxaError)
            resumo.value.falha += 1
            resumo.value.erros.push(`Erro na taxa: ${taxaError.message}`)
          }
        }
      }
      
      success.value = resumo.value.falha === 0
      if (!success.value) {
        const amostraErros = resumo.value.erros.slice(0, 3).join('; ')
        error.value = `Algumas atualizações falharam. Ex.: ${amostraErros}`
        console.warn('⚠️ Resumo de erros na atualização:', resumo.value.erros.slice(0, 10))
      }
      
      console.log(`📊 Resumo da atualização:`, {
        processadas: resumo.value.processadas,
        sucesso: resumo.value.sucesso,
        falha: resumo.value.falha,
        criterio
      })
      
      return { ok: success.value, ...resumo.value }
      
    } catch (e) {
      error.value = e?.message || 'Erro inesperado na atualização'
      console.error('❌ Erro geral na atualização:', e)
      return { ok: false, ...resumo.value }
    } finally {
      loading.value = false
    }
  }

  // Função auxiliar para atualizar uma única taxa
  const atualizarTaxa = async (taxa, options = {}) => {
    const r = await atualizarTaxas([taxa], options)
    return r?.ok
  }

  // Função inteligente que decide se deve inserir, atualizar ou remover
  const sincronizarTaxasInteligente = async (
    taxasAtuais,
    empresa,
    {
      chunkSize = 200,
      manterExistentes = false // se true, não remove taxas que não estão na lista atual
    } = {}
  ) => {
    loading.value = true
    error.value = null
    success.value = false
    resumo.value = { processadas: 0, sucesso: 0, falha: 0, erros: [] }

    try {
      console.log(`🧠 Sincronização inteligente para empresa: ${empresa}`)
      
      // 1. Buscar taxas existentes no Supabase para esta empresa
      const { data: taxasExistentes, error: fetchError } = await supabase
        .from('cadastro_taxas')
        .select('*')
        .eq('empresa', empresa)
      
      if (fetchError) {
        throw new Error(`Erro ao buscar taxas existentes: ${fetchError.message}`)
      }
      
      console.log(`📋 Encontradas ${taxasExistentes?.length || 0} taxas existentes no banco`)
      
      // 2. Mapear taxas atuais
      const taxasMapeadas = (taxasAtuais || []).map(mapTaxa)
      console.log(`📋 Processando ${taxasMapeadas.length} taxas atuais`)
      
      // 3. Identificar operações necessárias
      const paraInserir = []
      const paraAtualizar = []
      const idsParaManter = new Set()
      
      for (const taxaAtual of taxasMapeadas) {
        const existente = taxasExistentes?.find(te => 
          te.id_linhas === taxaAtual.id_linhas ||
          (te.empresa === taxaAtual.empresa &&
           te.adquirente === taxaAtual.adquirente &&
           te.bandeira === taxaAtual.bandeira &&
           te.modalidade === taxaAtual.modalidade &&
           te.parcelas === taxaAtual.parcelas)
        )
        
        if (existente) {
          // Verificar se precisa atualizar
          const precisaAtualizar = 
            existente.taxa !== taxaAtual.taxa ||
            existente.data_corte !== taxaAtual.data_corte
          
          if (precisaAtualizar) {
            paraAtualizar.push(taxaAtual)
            console.log(`✏️ Taxa será atualizada:`, taxaAtual.id_linhas)
          }
          
          idsParaManter.add(existente.id_linhas)
        } else {
          paraInserir.push(taxaAtual)
          console.log(`➕ Taxa será inserida:`, taxaAtual.id_linhas)
        }
      }
      
      // 4. Identificar taxas para remover (se não estão na lista atual)
      const paraRemover = manterExistentes ? [] : 
        (taxasExistentes || []).filter(te => !idsParaManter.has(te.id_linhas))
      
      console.log(`📊 Operações identificadas:`, {
        inserir: paraInserir.length,
        atualizar: paraAtualizar.length,
        remover: paraRemover.length
      })
      
      // 5. Executar operações
      let totalSucesso = 0
      let totalFalha = 0
      const todosErros = []
      
      // Inserir novas
      if (paraInserir.length > 0) {
        const resultadoInsert = await upsertTaxas(paraInserir, { chunkSize, limparAntes: false })
        totalSucesso += resultadoInsert.sucesso
        totalFalha += resultadoInsert.falha
        todosErros.push(...resultadoInsert.erros)
      }
      
      // Atualizar existentes
      if (paraAtualizar.length > 0) {
        const resultadoUpdate = await atualizarTaxas(paraAtualizar, { chunkSize })
        totalSucesso += resultadoUpdate.sucesso
        totalFalha += resultadoUpdate.falha
        todosErros.push(...resultadoUpdate.erros)
      }
      
      // Remover obsoletas
      if (paraRemover.length > 0) {
        const resultadoRemove = await removerTaxas(paraRemover, { chunkSize, criterio: 'id_linhas' })
        totalSucesso += resultadoRemove.sucesso
        totalFalha += resultadoRemove.falha
        todosErros.push(...resultadoRemove.erros)
      }
      
      // 6. Consolidar resultado
      resumo.value = {
        processadas: taxasMapeadas.length,
        sucesso: totalSucesso,
        falha: totalFalha,
        erros: todosErros
      }
      
      success.value = totalFalha === 0
      if (!success.value) {
        const amostraErros = todosErros.slice(0, 3).join('; ')
        error.value = `Algumas operações falharam. Ex.: ${amostraErros}`
      }
      
      console.log(`🎯 Sincronização inteligente concluída:`, resumo.value)
      
      return { ok: success.value, ...resumo.value }
      
    } catch (e) {
      error.value = e?.message || 'Erro inesperado na sincronização inteligente'
      console.error('❌ Erro geral na sincronização:', e)
      return { ok: false, ...resumo.value }
    } finally {
      loading.value = false
    }
  }

  return {
    // estados
    loading,
    error,
    success,
    resumo,
    // utilitários
    mapTaxa,
    // ações novas
    upsertTaxas,
    upsertTaxa,
    removerTaxas,      // Nova função
    removerTaxa,       // Nova função
    sincronizarTaxas,  // Nova função
    // ações antigas (compat)
    salvarTaxasNoSupabase,
    enviarTaxa,
    enviarTaxasLote
  }
}