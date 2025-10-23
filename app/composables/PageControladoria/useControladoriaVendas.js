import { ref, computed } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useControladoriaVendas = () => {
  const { fetchData, fetchAllData } = useAPIsupabase()
  const { error: logError } = useSecureLogger()
  
  // Estados reativos
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
  
  // Função para classificar bandeiras
  const classificarBandeira = (bandeira, modalidade) => {
    const bandeiraNorm = normalizeString(bandeira)
    const modalidadeNorm = normalizeString(modalidade)
    
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
    
    // BANESCARD DÉBITO
    if (bandeiraNorm.includes('banescard') && 
        (modalidadeNorm.includes('debito') || modalidadeNorm.includes('debitoprepago'))) {
      return 'BANESCARD DÉBITO'
    }
    
    // AMEX (sempre crédito)
    if (bandeiraNorm.includes('amex') || bandeiraNorm.includes('american')) {
      return 'AMEX'
    }
    
    // HIPERCARD (sempre crédito)
    if (bandeiraNorm.includes('hipercard') || bandeiraNorm.includes('hiper')) {
      return 'HIPERCARD'
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
  
  // Função para buscar dados da tabela vendas_norte_atacado_unica
  const buscarVendasUnica = async (filtros = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const colunas = 'bandeira, adquirente, valor_bruto, valor_liquido, despesa_mdr, numero_parcelas, modalidade'
      
      console.log('🔍 Buscando dados com filtros:', filtros)
      
      // Primeiro, verificar se a tabela existe e tem dados
      const totalRegistros = await fetchData('vendas_norte_atacado_unica', 'count(*)', {}, 1)
      console.log('📈 Total de registros na tabela:', totalRegistros)
      
      // Buscar TODOS os dados usando paginação (sem limite de 1000)
      console.log('🚀 Buscando TODOS os registros da tabela (sem limite)...')
      const dados = await fetchAllData('vendas_norte_atacado_unica', colunas, filtros)
      
      console.log('📊 Dados retornados:', dados?.length || 0, 'registros')
      
      if (dados && dados.length > 4000) {
        console.log('✅ Sucesso! Carregados mais de 4.000 registros:', dados.length)
      } else if (dados && dados.length > 0) {
        console.log('✅ Registros carregados:', dados.length)
      }
      console.log('📋 Primeiros 3 registros:', dados?.slice(0, 3))
      
      // Verificar especificamente VISA + débito
      if (dados && dados.length > 0) {
        const visaDebito = dados.filter(item => 
          item.bandeira?.toLowerCase().includes('visa') && 
          item.modalidade?.toLowerCase().includes('debito')
        )
        console.log('💳 VISA Débito encontrados:', visaDebito.length, 'registros')
        
        const somaValorLiquido = visaDebito.reduce((sum, item) => sum + (parseFloat(item.valor_liquido) || 0), 0)
        const somaValorBruto = visaDebito.reduce((sum, item) => sum + (parseFloat(item.valor_bruto) || 0), 0)
        
        console.log('💰 Soma VISA Débito (Valor Líquido):', somaValorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
        console.log('💰 Soma VISA Débito (Valor Bruto):', somaValorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
        
        // Mostrar alguns exemplos
        console.log('📋 Primeiros 5 registros VISA Débito:', visaDebito.slice(0, 5).map(item => ({
          bandeira: item.bandeira,
          modalidade: item.modalidade,
          valor_bruto: item.valor_bruto,
          valor_liquido: item.valor_liquido
        })))
      }
      
      if (dados && dados.length > 0) {
        vendasData.value = dados
        return dados
      } else {
        console.warn('⚠️ Nenhum dado encontrado na tabela vendas_norte_atacado_unica')
        vendasData.value = []
        return []
      }
      
    } catch (err) {
      console.error('❌ Erro detalhado ao buscar dados:', err)
      
      if (err.message?.includes('relation') || err.message?.includes('table')) {
        console.error('🚫 Tabela "vendas_norte_atacado_unica" não encontrada!')
        error.value = 'Tabela vendas_norte_atacado_unica não encontrada no banco de dados'
      } else {
        error.value = err.message
      }
      
      logError('Erro ao buscar vendas única', { error: err.message, stack: err.stack })
      
      // Retornar dados de exemplo para teste
      console.warn('⚠️ Retornando dados de exemplo para teste...')
      const dadosExemplo = [
        {
          bandeira: 'VISA',
          modalidade: 'DEBITO',
          valor_liquido: 50000.00,
          valor_bruto: 52000.00,
          despesa_mdr: 2000.00,
          numero_parcelas: 1,
          adquirente: 'STONE'
        },
        {
          bandeira: 'VISA ELECTRON',
          modalidade: 'DEBITO PREPAGO',
          valor_liquido: 84670.31,
          valor_bruto: 86000.00,
          despesa_mdr: 1329.69,
          numero_parcelas: 1,
          adquirente: 'CIELO'
        }
      ]
      
      vendasData.value = dadosExemplo
      return dadosExemplo
    } finally {
      loading.value = false
    }
  }
  
  // Computed para agrupar dados por bandeira classificada
  const vendasAgrupadas = computed(() => {
    const grupos = {}
    
    console.log('🔄 Processando', vendasData.value.length, 'registros para agrupamento')
    
    vendasData.value.forEach((venda, index) => {
      const bandeiraClassificada = classificarBandeira(venda.bandeira, venda.modalidade)
      const modalidadePagamento = determinarModalidade(venda.modalidade, venda.numero_parcelas)
      
      // Log detalhado para VISA
      if (venda.bandeira?.toLowerCase().includes('visa')) {
        console.log(`📝 VISA ${index + 1}:`, {
          bandeira_original: venda.bandeira,
          modalidade_original: venda.modalidade,
          bandeira_classificada: bandeiraClassificada,
          modalidade_pagamento: modalidadePagamento,
          valor_liquido: venda.valor_liquido
        })
      }
      
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
      
      // Log específico para VISA ELECTRON
      if (bandeiraClassificada === 'VISA ELECTRON') {
        console.log(`💳 Somando VISA ELECTRON:`, {
          modalidade: modalidadePagamento,
          valor_bruto: valorBruto,
          valor_liquido: valorLiquido,
          valor_anterior: grupo[modalidadePagamento],
          valor_novo: grupo[modalidadePagamento] + valorBruto
        })
      }
      
      // Somar valores por modalidade - USAR VALOR_BRUTO para as modalidades
      grupo[modalidadePagamento] += valorBruto
      grupo.valor_bruto_total += valorBruto
      grupo.valor_liquido_total += valorLiquido
      grupo.despesa_mdr_total += despesaMdr
    })
    
    const resultado = Object.values(grupos)
    console.log('📊 Resultado final do agrupamento:', resultado)
    
    // Log específico para VISA ELECTRON
    const visaElectron = resultado.find(g => g.adquirente === 'VISA ELECTRON')
    if (visaElectron) {
      console.log('💳 VISA ELECTRON final na tabela:', visaElectron)
      console.log('💰 VISA ELECTRON Débito (valor que aparece na tabela):', 
        visaElectron.debito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
      console.log('💰 VISA ELECTRON Total Bruto:', 
        visaElectron.valor_bruto_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
    } else {
      console.log('⚠️ VISA ELECTRON não encontrado no resultado final')
    }
    
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
  
  return {
    // Estados
    vendasData,
    loading,
    error,
    
    // Computed
    vendasAgrupadas,
    totaisGerais,
    
    // Métodos
    buscarVendasUnica,
    classificarBandeira,
    determinarModalidade,
    normalizeString
  }
}