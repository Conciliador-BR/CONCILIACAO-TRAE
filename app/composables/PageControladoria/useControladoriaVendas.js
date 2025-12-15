import { ref, computed, watch } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useSecureLogger } from '~/composables/useSecureLogger'

export const useControladoriaVendas = () => {
  const { error: logError } = useSecureLogger()
  
  // Usar dados compartilhados da página vendas
  const { vendas, vendasOriginais, loading: vendasLoading, error: vendasError } = useVendas()
  
  // Estados reativos locais
  const vendasData = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Função para normalizar strings (remover acentos, espaços, etc.)
  const normalizeString = (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.\-_\s]/g, '')
  }
  
  // Ordem específica para exibição das bandeiras
  const ordemBandeiras = [
    'VISA',
    'VISA ELECTRON', 
    'MASTERCARD',
    'MAESTRO',
    'ELO CRÉDITO',
    'ELO DÉBITO',
    'PIX',
    'CABAL',
    'AMEX',
    'HIPERCARD',
    'DINERS',
    'BRADESCO DÉBITO',
    'TRICARD',
    'SORO'
  ]
  
  // Lista de vouchers conhecidos e utilitário
  const voucherBrands = [
    'alelo','ticket','vr','sodexo','pluxe','pluxee','comprocard','lecard','upbrasil','ecxcard','fncard','benvisa','credshop','rccard','goodcard','bigcard','bkcard','greencard','brasilcard','boltcard','cabal','verocard','facecard','valecard','naip'
  ]
  const isVoucherBrand = (name='') => {
    const n = normalizeString(name)
    return voucherBrands.includes(n)
  }
  
  // Função para classificar bandeiras
  const classificarBandeira = (bandeira, modalidade) => {
    const bandeiraNorm = normalizeString(bandeira)
    const modalidadeNorm = normalizeString(modalidade)
    
    // Detectar vouchers por bandeira
    if (isVoucherBrand(bandeira)) {
      return normalizeString(bandeira).toUpperCase()
    }
    
    // VISA ELECTRON (Débito) - Captura todas as variações de débito
    if (bandeiraNorm.includes('visa') && 
        (modalidadeNorm.includes('debito') || 
         modalidadeNorm.includes('debitoprepago') || 
         modalidadeNorm.includes('prepagodebito') ||
         modalidadeNorm.includes('prepagodbto') ||
         modalidadeNorm.includes('dbto') ||
         modalidadeNorm.includes('deb'))) {
      return 'VISA ELECTRON'
    }
    
    // VISA (Crédito) - Apenas quando não for débito
    if (bandeiraNorm.includes('visa') && 
        !(modalidadeNorm.includes('debito') || 
          modalidadeNorm.includes('debitoprepago') || 
          modalidadeNorm.includes('prepagodebito') ||
          modalidadeNorm.includes('prepagodbto') ||
          modalidadeNorm.includes('dbto') ||
          modalidadeNorm.includes('deb'))) {
      return 'VISA'
    }
    
    // MAESTRO (Débito)
    if ((bandeiraNorm.includes('maestro') || bandeiraNorm.includes('mastercard') || bandeiraNorm.includes('master')) &&
        (modalidadeNorm.includes('debito') || modalidadeNorm.includes('debitoprepago'))) {
      return 'MAESTRO'
    }
    
    // MASTERCARD (Crédito)
    if ((bandeiraNorm.includes('mastercard') || bandeiraNorm.includes('master')) && !modalidadeNorm.includes('debito')) {
      return 'MASTERCARD'
    }
    
    // ELO DÉBITO
    if (bandeiraNorm.includes('elo') && 
        (modalidadeNorm.includes('debito') || modalidadeNorm.includes('debitoprepago'))) {
      return 'ELO DÉBITO'
    }
    
    // ELO CRÉDITO
    if (bandeiraNorm.includes('elo') && !modalidadeNorm.includes('debito')) {
      return 'ELO CRÉDITO'
    }

    // PIX
    if (bandeiraNorm.includes('pix') || modalidadeNorm.includes('pix') || bandeiraNorm.includes('pixqr') || bandeiraNorm.includes('pixqrcode') || bandeiraNorm.includes('qrcode')) {
      return 'PIX'
    }
    
    // BANESCARD DÉBITO
    if (bandeiraNorm.includes('banescard') && 
        (modalidadeNorm.includes('debito') || modalidadeNorm.includes('debitoprepago'))) {
      return 'BANESCARD DÉBITO'
    }
    
    // BRADESCO DÉBITO
    if (bandeiraNorm.includes('bradesco') && 
        (modalidadeNorm.includes('debito') || modalidadeNorm.includes('debitoprepago'))) {
      return 'BRADESCO DÉBITO'
    }
    
    // AMEX (sempre crédito)
    if (bandeiraNorm.includes('amex') || bandeiraNorm.includes('american') || bandeiraNorm.includes('americanexpress') || bandeiraNorm.includes('express')) {
      return 'AMEX'
    }
    
    // HIPERCARD (sempre crédito)
    if (bandeiraNorm.includes('hipercard') || bandeiraNorm.includes('hiper')) {
      return 'HIPERCARD'
    }
    
    // DINERS (sempre crédito)
    if (bandeiraNorm.includes('diners')) {
      return 'DINERS'
    }
    
    // CABAL (sempre crédito)
    if (bandeiraNorm.includes('cabal')) {
      return 'CABAL'
    }
    
    // SORO (sempre crédito)
    if (bandeiraNorm.includes('soro')) {
      return 'SORO'
    }
    
    // TRICARD (sempre crédito)
    if (bandeiraNorm.includes('tricard') || bandeiraNorm.includes('tri')) {
      return 'TRICARD'
    }
    
    return 'OUTROS'
  }
  
  // Função para determinar a modalidade de pagamento
  const determinarModalidade = (modalidade, numeroParcelas) => {
    const modalidadeNorm = normalizeString(modalidade)
    const parcelas = parseInt(numeroParcelas) || 1
    
    if (modalidadeNorm.includes('pix') || modalidadeNorm.includes('pixqr') || modalidadeNorm.includes('pixqrcode') || modalidadeNorm.includes('qrcode')) {
      return 'debito'
    }

    // Detecta todas as variações de débito
    if (modalidadeNorm.includes('debito') || 
        modalidadeNorm.includes('debitoprepago') || 
        modalidadeNorm.includes('prepagodebito') ||
        modalidadeNorm.includes('prepagodbto') ||
        modalidadeNorm.includes('dbto') ||
        modalidadeNorm.includes('deb')) {
      return 'debito'
    }
    
    if (modalidadeNorm.includes('voucher') || modalidadeNorm.includes('alimentacao') || modalidadeNorm.includes('refeicao')) {
      return 'voucher'
    }
    
    // Crédito baseado no número de parcelas
    if (parcelas === 1) return 'credito'
    if (parcelas === 2) return 'credito2x'
    if (parcelas === 3) return 'credito3x'
    if (parcelas >= 4 && parcelas <= 6) return 'credito4x5x6x'
    
    return 'outros'
  }
  
  // Função para processar dados de vendas (substituindo busca do Supabase)
  const processarDadosVendas = () => {
    const dadosVendas = vendas.value || vendasOriginais.value || []
    if (dadosVendas.length === 0) {
      vendasData.value = []
      return []
    }
    
    // Mapear dados de vendas para formato esperado pela controladoria
    const dadosMapeados = dadosVendas.map(venda => {
      // Mapear campos da estrutura de vendas para estrutura da controladoria
      return {
        bandeira: venda.bandeira || '',
        modalidade: venda.modalidade || venda.tipoTransacao || '',
        numero_parcelas: venda.numeroParcelas || venda.parcelas || 1,
        valor_bruto: parseFloat(venda.vendaBruta || venda.valor_bruto || 0),
        valor_liquido: parseFloat(venda.vendaLiquida || venda.valor_liquido || 0),
        despesa_mdr: parseFloat(venda.despesaMdr || venda.mdr || 0),
        data_venda: venda.dataVenda || venda.data_venda || venda.data,
        empresa: venda.empresa || '',
        matriz: venda.matriz || '',
        adquirente: venda.adquirente || ''
      }
    })
    
    // Verificar se há registros VISA Débito
    const visaDebito = dadosMapeados.filter(item => 
      item.bandeira?.toLowerCase().includes('visa') && 
      item.modalidade?.toLowerCase().includes('debito')
    )
    
    
    vendasData.value = dadosMapeados
    return dadosMapeados
  }
  
  // Função para buscar dados (mantendo compatibilidade com código existente)
  const buscarVendasUnica = async (filtros = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Processar dados de vendas já carregados
      const dados = processarDadosVendas()
      return dados
      
    } catch (err) {
      error.value = `Erro ao processar dados: ${err.message}`
      logError('useControladoriaVendas', 'buscarVendasUnica', err)
      vendasData.value = []
      return []
      
    } finally {
      loading.value = false
    }
  }
  
  // Computed para agrupar dados por bandeira classificada
  const vendasAgrupadas = computed(() => {
    const grupos = {}
    
    vendasData.value.forEach((venda, index) => {
      const bandeiraClassificada = isVoucherBrand(venda.adquirente)
        ? String(venda.adquirente || '').trim().toUpperCase()
        : classificarBandeira(venda.bandeira, venda.modalidade)
      const modalidadePagamento = determinarModalidade(venda.modalidade, venda.numero_parcelas)
      
      if (!grupos[bandeiraClassificada]) {
        grupos[bandeiraClassificada] = {
          adquirente: bandeiraClassificada,
          debito: 0,
          credito: 0,
          credito2x: 0,
          credito3x: 0,
          credito4x5x6x: 0,
          voucher: 0,
          outros: 0,
          valor_bruto_total: 0,
          valor_liquido_total: 0,
          despesa_mdr_total: 0
        }
      }
      
      const grupo = grupos[bandeiraClassificada]
      const valorLiquido = parseFloat(venda.valor_liquido) || 0
      const valorBruto = parseFloat(venda.valor_bruto) || 0
      const despesaMdr = parseFloat(venda.despesa_mdr) || 0
      
      // Somar valores por modalidade - USAR VALOR_BRUTO para as modalidades
      grupo[modalidadePagamento] += valorBruto
      grupo.valor_bruto_total += valorBruto
      grupo.valor_liquido_total += valorLiquido
      grupo.despesa_mdr_total += despesaMdr
    })
    
    const resultado = Object.values(grupos)
    
    // Ordenar resultado conforme a sequência especificada
    const resultadoOrdenado = resultado.sort((a, b) => {
      const indexA = ordemBandeiras.indexOf(a.adquirente)
      const indexB = ordemBandeiras.indexOf(b.adquirente)
      
      // Se ambos estão na lista de ordem, usar a ordem especificada
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      
      // Se apenas A está na lista, A vem primeiro
      if (indexA !== -1 && indexB === -1) {
        return -1
      }
      
      // Se apenas B está na lista, B vem primeiro
      if (indexA === -1 && indexB !== -1) {
        return 1
      }
      
      // Se nenhum está na lista, manter ordem alfabética
      return a.adquirente.localeCompare(b.adquirente)
    })
    
    return resultadoOrdenado
  })

  const gruposPorAdquirente = computed(() => {
    const grupos = {}
    vendasData.value.forEach(venda => {
      const adquirenteKey = isVoucherBrand(venda.adquirente) ? 'Vouchers' : (venda.adquirente || '')
      if (!grupos[adquirenteKey]) {
        grupos[adquirenteKey] = {
          adquirente: adquirenteKey,
          linhas: {},
          totais: {
            vendaLiquida: 0,
            vendaBruta: 0,
            despesaMdr: 0,
            debito: 0,
            credito: 0,
            credito2x: 0,
            credito3x: 0,
            credito4x5x6x: 0,
            voucher: 0,
            outros: 0
          }
        }
      }
      const grupo = grupos[adquirenteKey]
      const bandeiraClassificada = isVoucherBrand(venda.adquirente)
        ? String(venda.adquirente || '').trim().toUpperCase()
        : classificarBandeira(venda.bandeira, venda.modalidade)
      const modalidadePagamento = determinarModalidade(venda.modalidade, venda.numero_parcelas)
      if (!grupo.linhas[bandeiraClassificada]) {
        grupo.linhas[bandeiraClassificada] = {
          adquirente: bandeiraClassificada,
          debito: 0,
          credito: 0,
          credito2x: 0,
          credito3x: 0,
          credito4x5x6x: 0,
          voucher: 0,
          outros: 0,
          valor_bruto_total: 0,
          valor_liquido_total: 0,
          despesa_mdr_total: 0
        }
      }
      const linha = grupo.linhas[bandeiraClassificada]
      const valorLiquido = parseFloat(venda.valor_liquido) || 0
      const valorBruto = parseFloat(venda.valor_bruto) || 0
      const despesaMdr = parseFloat(venda.despesa_mdr) || 0
      linha[modalidadePagamento] += valorBruto
      linha.valor_bruto_total += valorBruto
      linha.valor_liquido_total += valorLiquido
      linha.despesa_mdr_total += despesaMdr
      grupo.totais.vendaBruta += valorBruto
      grupo.totais.vendaLiquida += valorLiquido
      grupo.totais.despesaMdr += despesaMdr
      grupo.totais[modalidadePagamento] += valorBruto
    })
    const resultado = Object.values(grupos).map(g => ({
      adquirente: g.adquirente,
      vendasData: Object.values(g.linhas).sort((a, b) => {
        const indexA = ordemBandeiras.indexOf(a.adquirente)
        const indexB = ordemBandeiras.indexOf(b.adquirente)
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1 && indexB === -1) return -1
        if (indexA === -1 && indexB !== -1) return 1
        return a.adquirente.localeCompare(b.adquirente)
      }),
      totais: g.totais
    }))
    return resultado
  })
  
  // Computed para totais gerais
  const totaisGerais = computed(() => {
    return vendasAgrupadas.value.reduce((acc, grupo) => {
      acc.vendaLiquida += grupo.valor_liquido_total
      acc.vendaBruta += grupo.valor_bruto_total
      acc.despesaMdr += grupo.despesa_mdr_total
      acc.debito += grupo.debito
      acc.credito += grupo.credito
      acc.credito2x += grupo.credito2x
      acc.credito3x += grupo.credito3x
      acc.credito4x5x6x += grupo.credito4x5x6x
      acc.voucher += grupo.voucher
      acc.outros += grupo.outros
      return acc
    }, {
      vendaLiquida: 0,
      vendaBruta: 0,
      despesaMdr: 0,
      debito: 0,
      credito: 0,
      credito2x: 0,
      credito3x: 0,
      credito4x5x6x: 0,
      voucher: 0,
      outros: 0
    })
  })
  
  // Watchers para sincronização automática
  watch([vendas, vendasOriginais], () => {
    processarDadosVendas()
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
    vendasData,
    loading,
    error,
    
    // Computed
    vendasAgrupadas,
    totaisGerais,
    gruposPorAdquirente,
    
    // Métodos
    buscarVendasUnica,
    processarDadosVendas,
    classificarBandeira,
    determinarModalidade,
    normalizeString
  }
}
