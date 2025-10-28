import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'
import { createQueryOperations } from '~/composables/PageTaxas/SalvarTaxas/queries.js'

export const usePrevisaoPagamento = () => {
  const { supabase, insertData } = useAPIsupabase()
  const { buscarTaxasDoSupabase } = createQueryOperations(supabase)
  
  // Estados reativos
  const taxas = ref([])

  // Função para criar data de forma segura
  const criarDataSegura = (dataString) => {
    if (!dataString) return null
    
    // Se já é um objeto Date válido
    if (dataString instanceof Date && !isNaN(dataString.getTime())) {
      return new Date(dataString.getFullYear(), dataString.getMonth(), dataString.getDate())
    }
    
    const str = String(dataString).trim()
    
    // Formato YYYY-MM-DD (mais comum vindo do banco)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [ano, mes, dia] = str.split('-').map(Number)
      return new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [dia, mes, ano] = str.split('/').map(Number)
      return new Date(ano, mes - 1, dia)
    }
    
    return null
  }

  // Função para normalizar strings
  const normalizarParaComparacao = (str) => {
    if (str === null || str === undefined) return ''
    let resultado = String(str).trim().toLowerCase()

    const mapaAcentos = {
      'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c', 'ñ': 'n'
    }
    for (const [a, b] of Object.entries(mapaAcentos)) {
      resultado = resultado.replace(new RegExp(a, 'g'), b)
    }

    // remove tudo que não for letra ou número
    resultado = resultado.replace(/[^a-z0-9]/g, '')
    return resultado
  }

  // Função para encontrar taxa
  const encontrarTaxa = (venda) => {
    if (!taxas.value || taxas.value.length === 0) {
      console.warn('🔍 Nenhuma taxa carregada para busca')
      return null
    }

    const vModal = normalizarParaComparacao(venda.modalidade ?? venda.modalidade_descricao ?? '')
    console.log('🔍 Buscando taxa para modalidade normalizada:', vModal)

    const taxaEncontrada = taxas.value.find(taxa => {
      const tModal = normalizarParaComparacao(taxa.modalidade ?? '')
      const match = tModal && (tModal === vModal)
      if (match) {
        console.log('✅ Taxa encontrada:', {
          modalidade_original: venda.modalidade,
          modalidade_normalizada: vModal,
          taxa_modalidade: taxa.modalidade,
          taxa_data_corte: taxa.data_corte
        })
      }
      return match
    })

    if (!taxaEncontrada) {
      console.warn('❌ Taxa não encontrada para modalidade:', {
        modalidade_original: venda.modalidade,
        modalidade_normalizada: vModal,
        taxas_disponiveis: taxas.value.map(t => ({
          modalidade: t.modalidade,
          normalizada: normalizarParaComparacao(t.modalidade ?? '')
        }))
      })
    }

    return taxaEncontrada || null
  }

  // Função para calcular data de pagamento
  const calcularDataPagamento = (dataVenda, dataCorte) => {
    if (!dataVenda || dataCorte === null || dataCorte === undefined) {
      console.warn('⚠️ Dados insuficientes para calcular data:', { dataVenda, dataCorte })
      return null
    }

    // Converter dataVenda para objeto Date de forma segura
    let data = criarDataSegura(dataVenda)
    if (!data || isNaN(data.getTime())) {
      console.warn('❌ Data inválida recebida:', dataVenda)
      return null
    }

    console.log('📅 Calculando data pagamento:', {
      data_venda: dataVenda,
      data_corte: dataCorte,
      data_objeto: data
    })

    // Lógica baseada na data_corte
    if (dataCorte === 1) {
      // Se data_corte for 1, adicionar 1 dia à data de venda
      data.setDate(data.getDate() + 1)
      
      // Pular fins de semana se necessário
      while (data.getDay() === 0 || data.getDay() === 6) {
        data.setDate(data.getDate() + 1)
      }
    } else {
      // Para outros valores de data_corte, adicionar o número de dias
      data.setDate(data.getDate() + parseInt(dataCorte))
    }

    console.log('✅ Data pagamento calculada:', data)
    return data
  }

  // Função para verificar se é modalidade pré-pago
  const isPrePago = (modalidade) => {
    if (!modalidade) return false
    
    // Normalizar: remover acentos, espaços e caracteres especiais
    const modalidadeNormalizada = modalidade
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z]/g, '') // Remove espaços e caracteres especiais
    
    console.log('🔍 [PREPAGO] Normalizando:', {
      original: modalidade,
      normalizada: modalidadeNormalizada
    })
    
    // Deve conter "prepago" para ser considerado pré-pago
    const ehPrePago = modalidadeNormalizada.includes('prepago')
    
    console.log('🔍 [PREPAGO] Resultado:', {
      modalidade: modalidade,
      normalizada: modalidadeNormalizada,
      eh_prepago: ehPrePago
    })
    
    return ehPrePago
  }

  // Função para determinar tipo de pré-pago
  const getTipoPrePago = (modalidade) => {
    if (!modalidade) return null
    const modalidadeNormalizada = modalidade.toLowerCase().replace(/[^a-z]/g, '')
    
    if (modalidadeNormalizada.includes('debito') || modalidadeNormalizada.includes('débito')) {
      return 'debito'
    }
    if (modalidadeNormalizada.includes('credito') || modalidadeNormalizada.includes('crédito')) {
      return 'credito'
    }
    return null
  }

  // Função para calcular previsão de venda
  const calcularPrevisaoVenda = (venda) => {
    try {
      console.log('🔄 Iniciando cálculo de previsão para:', {
        modalidade: venda.modalidade,
        data_venda: venda.data_venda
      })

      // 🔍 DEBUG: Verificar detecção de pré-pago
      const ehPrePago = isPrePago(venda.modalidade)
      console.log('🔍 [DEBUG] Verificação pré-pago:', {
        modalidade_original: venda.modalidade,
        modalidade_normalizada: venda.modalidade ? venda.modalidade.toLowerCase().replace(/[^a-z]/g, '') : null,
        eh_prepago: ehPrePago
      })

      // ✅ REGRA ESPECIAL: Pré-pago débito e crédito
      if (ehPrePago) {
        const tipoPrePago = getTipoPrePago(venda.modalidade)
        const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
        
        if (!dataVenda) {
          console.warn('❌ Data de venda não encontrada para pré-pago')
          return null
        }

        // Converter data de venda para formato de previsão
        const dataVendaDate = criarDataSegura(dataVenda)
        if (!dataVendaDate) {
          console.warn('❌ Data de venda inválida para pré-pago:', dataVenda)
          return null
        }

        let dataPrevisao
        
        if (tipoPrePago === 'debito') {
          // 1- pré-pago débito = débito (mesmo dia)
          dataPrevisao = new Date(dataVendaDate)
          console.log('💳 [PRÉ-PAGO DÉBITO] Previsão = mesmo dia da venda')
        } else if (tipoPrePago === 'credito') {
          // 2- pré-pago crédito = crédito (2 dias úteis)
          dataPrevisao = new Date(dataVendaDate)
          
          // Adicionar 2 dias úteis
          let diasAdicionados = 0
          while (diasAdicionados < 2) {
            dataPrevisao.setDate(dataPrevisao.getDate() + 1)
            
            // Verificar se é dia útil (segunda a sexta: 1-5)
            const diaSemana = dataPrevisao.getDay()
            if (diaSemana >= 1 && diaSemana <= 5) {
              diasAdicionados++
            }
          }
          
          console.log('💳 [PRÉ-PAGO CRÉDITO] Previsão = 2 dias úteis após a venda')
        } else {
          // Pré-pago genérico (mesmo dia)
          dataPrevisao = new Date(dataVendaDate)
          console.log('💳 [PRÉ-PAGO GENÉRICO] Previsão = mesmo dia da venda')
        }

        // Formatar data para o banco (YYYY-MM-DD)
        const ano = dataPrevisao.getFullYear()
        const mes = String(dataPrevisao.getMonth() + 1).padStart(2, '0')
        const dia = String(dataPrevisao.getDate()).padStart(2, '0')
        const dataFormatada = `${ano}-${mes}-${dia}`
        
        console.log('✅ [PRÉ-PAGO] Previsão calculada:', {
          modalidade: venda.modalidade,
          tipo: tipoPrePago,
          data_venda: dataVenda,
          previsao_pgto: dataFormatada
        })
        
        return dataFormatada
      }

      // ✅ LÓGICA NORMAL: Para outras modalidades
      const taxa = encontrarTaxa(venda)
      if (!taxa) {
        console.warn('❌ Taxa não encontrada para modalidade:', venda.modalidade)
        return null // Retorna null em vez de string para não salvar no banco
      }

      const dataCorte = taxa.data_corte
      const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data

      const dataPrevisaoDate = calcularDataPagamento(dataVenda, dataCorte)
      if (!dataPrevisaoDate) {
        console.warn('❌ Não foi possível calcular data de pagamento')
        return null
      }

      // Formatar data para o banco (YYYY-MM-DD)
      const ano = dataPrevisaoDate.getFullYear()
      const mes = String(dataPrevisaoDate.getMonth() + 1).padStart(2, '0')
      const dia = String(dataPrevisaoDate.getDate()).padStart(2, '0')
      const dataFormatada = `${ano}-${mes}-${dia}`
      
      console.log('✅ Previsão calculada com sucesso:', {
        modalidade: venda.modalidade,
        data_venda: dataVenda,
        data_corte: dataCorte,
        previsao_pgto: dataFormatada
      })
      
      return dataFormatada
    } catch (err) {
      console.error('❌ Erro ao calcular previsão:', err)
      return null
    }
  }

  // Função para carregar taxas
  const carregarTaxas = async () => {
    try {
      console.log('🔄 Carregando taxas do Supabase para importação...')
      const taxasDoSupabase = await buscarTaxasDoSupabase()
      taxas.value = taxasDoSupabase
      console.log('✅ Taxas carregadas:', {
        total: taxas.value.length,
        modalidades: taxas.value.map(t => t.modalidade)
      })
    } catch (err) {
      console.error('❌ Erro ao carregar taxas:', err)
      taxas.value = []
    }
  }

  // Função para criar previsões de pagamento
  const criarPrevisoesPagamento = async (vendasInseridas) => {
    try {
      console.log('🔄 Criando previsões de pagamento para:', vendasInseridas.length, 'vendas')
      
      const previsoes = vendasInseridas.map(venda => {
        // Usar a função de cálculo de previsão
        const dataPrevisaoFormatada = calcularPrevisaoVenda(venda)
        
        if (!dataPrevisaoFormatada) {
          console.warn('⚠️ Não foi possível calcular previsão para venda:', venda.id)
          return null
        }
        
        return {
          venda_id: venda.id,
          data_venda: venda.data_venda,
          data_previsao_pagamento: dataPrevisaoFormatada,
          valor_bruto: venda.valor_bruto,
          valor_liquido: venda.valor_liquido,
          empresa: venda.empresa,
          adquirente: venda.adquirente,
          bandeira: venda.bandeira,
          modalidade: venda.modalidade,
          nsu: venda.nsu,
          status_pagamento: 'pendente',
          created_at: new Date().toISOString()
        }
      }).filter(Boolean) // Remove itens null
      
      if (previsoes.length === 0) {
        console.warn('⚠️ Nenhuma previsão válida para inserir')
        return
      }
      
      console.log('📊 Inserindo', previsoes.length, 'previsões na tabela previsao_pgto')
      
      // Inserir previsões na tabela previsao_pgto
      const resultadoPrevisoes = await insertData('previsao_pgto', previsoes)
      
      if (!resultadoPrevisoes) {
        console.warn('❌ Falha ao inserir previsões de pagamento')
      } else {
        console.log('✅ Previsões de pagamento criadas:', previsoes.length)
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar previsões de pagamento:', error)
      // Não falhar o processo principal se as previsões falharem
    }
  }

  return {
    // Estados
    taxas,
    
    // Métodos
    calcularPrevisaoVenda,
    criarPrevisoesPagamento,
    carregarTaxas,
    calcularDataPagamento,
    encontrarTaxa,
    
    // Métodos auxiliares para pré-pago
    isPrePago,
    getTipoPrePago
  }
}