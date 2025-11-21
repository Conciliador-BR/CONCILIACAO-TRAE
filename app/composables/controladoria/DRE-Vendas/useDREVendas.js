import { ref, computed, watch } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useSecureLogger } from '~/composables/useSecureLogger'
import { useDateUtils } from '~/composables/importacao/Envio_vendas/calculo_previsao_pgto/useDateUtils'

export const useDREVendas = () => {
  const { error: logError } = useSecureLogger()
  const { criarDataSegura } = useDateUtils()
  
  // Usar dados compartilhados da página vendas (mesma lógica da controladoria)
  const { vendas, vendasOriginais, loading: vendasLoading, error: vendasError } = useVendas()
  
  // Estados reativos locais
  const dreData = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Configurações para análise de cartões
  const taxasPadrao = {
    visa: { debito: 0.0199, credito: 0.0479, credito2x: 0.0499, credito3x: 0.0599, credito4x5x6x: 0.0699 },
    mastercard: { debito: 0.0199, credito: 0.0479, credito2x: 0.0499, credito3x: 0.0599, credito4x5x6x: 0.0699 },
    elo: { debito: 0.0199, credito: 0.0479, credito2x: 0.0499, credito3x: 0.0599, credito4x5x6x: 0.0699 },
    amex: { debito: 0.0, credito: 0.0499, credito2x: 0.0599, credito3x: 0.0699, credito4x5x6x: 0.0799 },
    hipercard: { debito: 0.0, credito: 0.0499, credito2x: 0.0599, credito3x: 0.0699, credito4x5x6x: 0.0799 },
    pix: { debito: 0.0, credito: 0.0, credito2x: 0.0, credito3x: 0.0, credito4x5x6x: 0.0 }
  }
  
  // Função para normalizar strings (reutilizada da controladoria)
  const normalizeString = (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.\-_\s]/g, '')
  }
  
  // Função para classificar bandeiras (reutilizada da controladoria)
  const classificarBandeira = (bandeira, modalidade) => {
    const bandeiraNorm = normalizeString(bandeira)
    const modalidadeNorm = normalizeString(modalidade)
    
    // Lógica de classificação existente da controladoria
    if (bandeiraNorm.includes('visa') && modalidadeNorm.includes('debito')) return 'VISA ELECTRON'
    if (bandeiraNorm.includes('visa')) return 'VISA'
    if (bandeiraNorm.includes('mastercard') || bandeiraNorm.includes('master')) return 'MASTERCARD'
    if (bandeiraNorm.includes('elo') && modalidadeNorm.includes('debito')) return 'ELO DÉBITO'
    if (bandeiraNorm.includes('elo')) return 'ELO CRÉDITO'
    if (bandeiraNorm.includes('pix')) return 'PIX'
    if (bandeiraNorm.includes('amex')) return 'AMEX'
    if (bandeiraNorm.includes('hipercard')) return 'HIPERCARD'
    if (bandeiraNorm.includes('diners')) return 'DINERS'
    if (bandeiraNorm.includes('cabal')) return 'CABAL'
    
    return 'OUTROS'
  }
  
  // Função para determinar modalidade de pagamento (reutilizada)
  const determinarModalidade = (modalidade, numeroParcelas) => {
    const modalidadeNorm = normalizeString(modalidade)
    const parcelas = parseInt(numeroParcelas) || 1
    
    if (modalidadeNorm.includes('pix')) return 'debito'
    if (modalidadeNorm.includes('debito')) return 'debito'
    if (modalidadeNorm.includes('voucher')) return 'voucher'
    
    // Crédito baseado no número de parcelas
    if (parcelas === 1) return 'credito'
    if (parcelas === 2) return 'credito2x'
    if (parcelas === 3) return 'credito3x'
    if (parcelas >= 4 && parcelas <= 6) return 'credito4x5x6x'
    
    return 'outros'
  }
  
  // Função para mapear bandeira para taxa
  const getTaxaPorBandeira = (bandeiraClassificada, modalidade) => {
    const bandeiraNorm = normalizeString(bandeiraClassificada)
    
    if (bandeiraNorm.includes('visa')) return taxasPadrao.visa[modalidade] || 0
    if (bandeiraNorm.includes('mastercard')) return taxasPadrao.mastercard[modalidade] || 0
    if (bandeiraNorm.includes('elo')) return taxasPadrao.elo[modalidade] || 0
    if (bandeiraNorm.includes('amex')) return taxasPadrao.amex[modalidade] || 0
    if (bandeiraNorm.includes('hipercard')) return taxasPadrao.hipercard[modalidade] || 0
    if (bandeiraNorm.includes('pix')) return taxasPadrao.pix[modalidade] || 0
    
    return 0.05 // Taxa padrão para bandeiras não mapeadas
  }
  
  // Função para processar dados para DRE
  const processarDadosDRE = () => {
    const dadosVendas = vendas.value || vendasOriginais.value || []
    if (dadosVendas.length === 0) {
      dreData.value = []
      return []
    }
    
    // Mapear dados de vendas para formato DRE
    const dadosMapeados = dadosVendas.map(venda => {
      const bandeiraClassificada = classificarBandeira(venda.bandeira || '', venda.modalidade || '')
      const modalidadePagamento = determinarModalidade(venda.modalidade || '', venda.numeroParcelas || venda.parcelas || 1)
      const valorBruto = parseFloat(venda.vendaBruta || venda.valor_bruto || 0)
      const valorLiquido = parseFloat(venda.vendaLiquida || venda.valor_liquido || 0)
      const despesaMdr = parseFloat(venda.despesaMdr || venda.mdr || 0)
      const taxaAplicada = getTaxaPorBandeira(bandeiraClassificada, modalidadePagamento)
      const taxaCalculada = valorBruto * taxaAplicada
      const rawData = venda.dataVenda || venda.data_venda || venda.data
      const dataObj = criarDataSegura(rawData)
      const dataVendaNormalizada = dataObj ? `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}` : null
      
      return {
        id: venda.id || `${venda.dataVenda}-${Math.random()}`,
        dataVenda: dataVendaNormalizada,
        empresa: venda.empresa || '',
        matriz: venda.matriz || '',
        adquirente: venda.adquirente || '',
        bandeira: bandeiraClassificada,
        modalidade: modalidadePagamento,
        valorBruto,
        valorLiquido,
        despesaMdr,
        taxaAplicada,
        taxaCalculada,
        numeroParcelas: venda.numeroParcelas || venda.parcelas || 1,
        // Campos adicionais para DRE
        receitaBruta: valorBruto,
        custoTaxa: despesaMdr || taxaCalculada,
        receitaLiquida: valorLiquido || (valorBruto - (despesaMdr || taxaCalculada)),
        margemBruta: ((valorLiquido || (valorBruto - (despesaMdr || taxaCalculada))) / valorBruto) * 100 || 0
      }
    })
    
    dreData.value = dadosMapeados
    return dadosMapeados
  }
  
  // Computed para análise por bandeira
  const analisePorBandeira = computed(() => {
    const grupos = {}
    
    dreData.value.forEach(venda => {
      const bandeira = venda.bandeira
      
      if (!grupos[bandeira]) {
        grupos[bandeira] = {
          bandeira,
          quantidade: 0,
          receitaBruta: 0,
          custoTaxa: 0,
          receitaLiquida: 0,
          margemBruta: 0,
          modalidades: {}
        }
      }
      
      const grupo = grupos[bandeira]
      grupo.quantidade += 1
      grupo.receitaBruta += venda.receitaBruta
      grupo.custoTaxa += venda.custoTaxa
      grupo.receitaLiquida += venda.receitaLiquida
      
      // Agrupar por modalidade
      const modalidade = venda.modalidade
      if (!grupo.modalidades[modalidade]) {
        grupo.modalidades[modalidade] = {
          modalidade,
          quantidade: 0,
          receitaBruta: 0,
          custoTaxa: 0,
          receitaLiquida: 0
        }
      }
      
      const modal = grupo.modalidades[modalidade]
      modal.quantidade += 1
      modal.receitaBruta += venda.receitaBruta
      modal.custoTaxa += venda.custoTaxa
      modal.receitaLiquida += venda.receitaLiquida
    })
    
    // Calcular margens e médias
    Object.values(grupos).forEach(grupo => {
      grupo.margemBruta = grupo.receitaBruta > 0 ? ((grupo.receitaLiquida / grupo.receitaBruta) * 100) : 0
      
      Object.values(grupo.modalidades).forEach(modal => {
        modal.taxaEfetiva = modal.receitaBruta > 0 ? ((modal.custoTaxa / modal.receitaBruta) * 100) : 0
      })
    })
    
    return Object.values(grupos).sort((a, b) => b.receitaBruta - a.receitaBruta)
  })
  
  // Computed para DRE consolidada
  const dreConsolidada = computed(() => {
    const total = dreData.value.reduce((acc, venda) => {
      acc.receitaBruta += venda.receitaBruta
      acc.custoTaxa += venda.custoTaxa
      acc.receitaLiquida += venda.receitaLiquida
      acc.quantidade += 1
      return acc
    }, {
      receitaBruta: 0,
      custoTaxa: 0,
      receitaLiquida: 0,
      quantidade: 0
    })
    
    total.margemBruta = total.receitaBruta > 0 ? ((total.receitaLiquida / total.receitaBruta) * 100) : 0
    total.taxaEfetiva = total.receitaBruta > 0 ? ((total.custoTaxa / total.receitaBruta) * 100) : 0
    
    return total
  })
  
  // Computed para análise temporal
  const analiseTemporal = computed(() => {
    const grupos = {}
    
    dreData.value.forEach(venda => {
      const dataStr = venda.dataVenda || ''
      const dataObj = criarDataSegura(dataStr)
      const mesAno = dataObj 
        ? `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`
        : ''
      
      if (!grupos[mesAno] && mesAno) {
        grupos[mesAno] = {
          periodo: mesAno,
          quantidade: 0,
          receitaBruta: 0,
          custoTaxa: 0,
          receitaLiquida: 0
        }
      }
      
      if (grupos[mesAno]) {
        grupos[mesAno].quantidade += 1
        grupos[mesAno].receitaBruta += venda.receitaBruta
        grupos[mesAno].custoTaxa += venda.custoTaxa
        grupos[mesAno].receitaLiquida += venda.receitaLiquida
      }
    })
    
    // Calcular margens
    Object.values(grupos).forEach(grupo => {
      grupo.margemBruta = grupo.receitaBruta > 0 ? ((grupo.receitaLiquida / grupo.receitaBruta) * 100) : 0
      grupo.taxaEfetiva = grupo.receitaBruta > 0 ? ((grupo.custoTaxa / grupo.receitaBruta) * 100) : 0
    })
    
    return Object.values(grupos).sort((a, b) => a.periodo.localeCompare(b.periodo))
  })
  
  // Função para buscar dados (mantendo compatibilidade)
  const buscarDadosDRE = async (filtros = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const dados = processarDadosDRE()
      return dados
      
    } catch (err) {
      error.value = `Erro ao processar dados DRE: ${err.message}`
      logError('useDREVendas', 'buscarDadosDRE', err)
      dreData.value = []
      return []
      
    } finally {
      loading.value = false
    }
  }
  
  // Watchers para sincronização automática com vendas
  watch([vendas, vendasOriginais], () => {
    processarDadosDRE()
  }, { immediate: true })
  
  // Sincronizar loading e error states
  watch(vendasLoading, (newLoading) => {
    loading.value = newLoading
  })
  
  watch(vendasError, (newError) => {
    error.value = newError
  })
  
  return {
    // Estados
    dreData,
    loading,
    error,
    
    // Computed
    analisePorBandeira,
    dreConsolidada,
    analiseTemporal,
    
    // Métodos
    buscarDadosDRE,
    processarDadosDRE,
    classificarBandeira,
    determinarModalidade,
    getTaxaPorBandeira,
    
    // Constantes úteis
    taxasPadrao
  }
}