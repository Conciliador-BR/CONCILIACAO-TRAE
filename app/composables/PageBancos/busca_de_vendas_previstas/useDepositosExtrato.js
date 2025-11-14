import { computed } from 'vue'
import { useExtratoDetalhado } from '../useExtratoDetalhado'
import { useFormatacaoDados } from './useFormatacaoDados'

export const useDepositosExtrato = () => {
  const { transacoes, buscarTransacoesBancarias } = useExtratoDetalhado()
  const { formatarData } = useFormatacaoDados()

  // Função para buscar depósitos por data e adquirente
  const buscarDepositosPorDataAdquirente = (data, adquirente) => {
    if (!transacoes.value || transacoes.value.length === 0) {
      return 0
    }

    // Normalizar a data para comparação
    const dataFormatada = formatarData(data)
    if (!dataFormatada) return 0

    // Converter data DD/MM/YYYY para YYYY-MM-DD para comparação
    const [dia, mes, ano] = dataFormatada.split('/')
    const dataComparacao = `${ano}-${mes}-${dia}`

    // Filtrar transações por data e adquirente
    const depositosFiltrados = transacoes.value.filter(transacao => {
      // Verificar se é um depósito (valor positivo)
      if (!transacao.valor || transacao.valor <= 0) return false

      // Verificar se a data corresponde
      const dataTransacao = formatarData(transacao.data)
      if (!dataTransacao) return false
      
      const [diaT, mesT, anoT] = dataTransacao.split('/')
      const dataTransacaoComparacao = `${anoT}-${mesT}-${diaT}`
      
      if (dataTransacaoComparacao !== dataComparacao) return false

      // Verificar se o adquirente corresponde
      if (!transacao.descricao) return false

      const descricaoUpper = transacao.descricao.toUpperCase()
      const adquirenteUpper = adquirente.toUpperCase()

      // Lógica especial para UNICA - buscar por "UNICA" ou "TRIPAG"
      if (adquirenteUpper === 'UNICA') {
        return descricaoUpper.includes('UNICA') || descricaoUpper.includes('TRIPAG')
      }

      // Para outros adquirentes, buscar pelo nome exato
      return descricaoUpper.includes(adquirenteUpper)
    })

    // Somar todos os depósitos encontrados
    return depositosFiltrados.reduce((total, transacao) => total + (transacao.valor || 0), 0)
  }

  // Função para buscar depósitos agrupados por data
  const buscarDepositosAgrupadosPorData = (dataInicial, dataFinal) => {
    if (!transacoes.value || transacoes.value.length === 0) {
      return {}
    }

    const depositosAgrupados = {}

    transacoes.value.forEach(transacao => {
      // Verificar se é um depósito (valor positivo)
      if (!transacao.valor || transacao.valor <= 0) return

      // Verificar se está no período especificado
      const dataTransacao = formatarData(transacao.data)
      if (!dataTransacao) return

      const [dia, mes, ano] = dataTransacao.split('/')
      const dataComparacao = `${ano}-${mes}-${dia}`

      // Verificar se está no período
      if (dataInicial && dataComparacao < dataInicial) return
      if (dataFinal && dataComparacao > dataFinal) return

      // Identificar o adquirente pela descrição
      let adquirente = 'OUTROS'
      if (transacao.descricao) {
        const descricaoUpper = transacao.descricao.toUpperCase()
        
        if (descricaoUpper.includes('UNICA') || descricaoUpper.includes('TRIPAG')) {
          adquirente = 'UNICA'
        } else if (descricaoUpper.includes('STONE')) {
          adquirente = 'STONE'
        } else if (descricaoUpper.includes('CIELO')) {
          adquirente = 'CIELO'
        } else if (descricaoUpper.includes('REDE')) {
          adquirente = 'REDE'
        } else if (descricaoUpper.includes('GETNET')) {
          adquirente = 'GETNET'
        } else if (descricaoUpper.includes('SAFRAPAY')) {
          adquirente = 'SAFRAPAY'
        } else if (descricaoUpper.includes('MERCADOPAGO')) {
          adquirente = 'MERCADOPAGO'
        } else if (descricaoUpper.includes('PAGSEGURO')) {
          adquirente = 'PAGSEGURO'
        }
      }

      const chave = `${dataTransacao}_${adquirente}`
      
      if (!depositosAgrupados[chave]) {
        depositosAgrupados[chave] = {
          data: dataTransacao,
          adquirente: adquirente,
          totalDepositos: 0,
          quantidadeTransacoes: 0,
          transacoes: []
        }
      }

      depositosAgrupados[chave].totalDepositos += transacao.valor
      depositosAgrupados[chave].quantidadeTransacoes += 1
      depositosAgrupados[chave].transacoes.push(transacao)
    })

    return depositosAgrupados
  }

  // Função para carregar dados do extrato se necessário
  const carregarDadosExtrato = async (filtros = {}) => {
    try {
      await buscarTransacoesBancarias(filtros)
    } catch (error) {}
  }

  // Computed para verificar se há dados carregados
  const temDadosCarregados = computed(() => {
    return transacoes.value && transacoes.value.length > 0
  })

  // Computed para total de depósitos no período
  const totalDepositosPeriodo = computed(() => {
    if (!transacoes.value || transacoes.value.length === 0) return 0
    
    return transacoes.value
      .filter(t => t.valor > 0)
      .reduce((total, t) => total + (t.valor || 0), 0)
  })

  return {
    // Estados
    transacoes,
    temDadosCarregados,
    totalDepositosPeriodo,
    
    // Métodos
    buscarDepositosPorDataAdquirente,
    buscarDepositosAgrupadosPorData,
    carregarDadosExtrato
  }
}