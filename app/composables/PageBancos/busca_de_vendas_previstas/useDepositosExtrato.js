import { computed } from 'vue'
import { useExtratoDetalhado } from '../useExtratoDetalhado'
import { useFormatacaoDados } from './useFormatacaoDados'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'
import { classificarTransacaoPagamentoBanco } from '~/composables/usePagamentoBancoEngine'
import {
  ORDEM_BANDEIRAS,
  normalizarChaveAdquirente,
  normalizarGrupoAdquirente,
  parseValorExtrato
} from '~/composables/PageControladoria/controladoria-recebimentos/recebimentoscontainer/recebimentosUtils'

export const useDepositosExtrato = () => {
  const { transacoes, buscarTransacoesBancarias } = useExtratoDetalhado()
  const { formatarData } = useFormatacaoDados()
  const { detectarAdquirente } = useAdquirenteDetector()
  const bandeirasNormalizadas = new Set(
    ORDEM_BANDEIRAS.map(item => normalizarChaveAdquirente(item))
  )

  const toIsoDate = (dataBr) => {
    const [dia, mes, ano] = String(dataBr || '').split('/')
    if (!dia || !mes || !ano) return ''
    return `${ano}-${mes}-${dia}`
  }

  const criarGrupoDeposito = (target, chave, data, adquirente) => {
    if (!target[chave]) {
      target[chave] = {
        data,
        adquirente,
        totalDepositos: 0,
        totalDebitos: 0,
        depositosPorBandeira: {},
        debitosPorBandeira: {},
        quantidadeTransacoes: 0,
        transacoes: []
      }
    }

    return target[chave]
  }

  const resolverGrupoDeposito = (classificacao, transacao = {}) => {
    const grupoClassificado = String(classificacao?.grupo || '').trim()
    const grupoClassificadoNormalizado = normalizarChaveAdquirente(grupoClassificado)
    const grupoNormalizado = normalizarGrupoAdquirente(classificacao?.grupo || classificacao?.base || '')
    const baseNormalizada = normalizarChaveAdquirente(classificacao?.base || '')
    const grupoComoBandeira = bandeirasNormalizadas.has(normalizarChaveAdquirente(grupoNormalizado)) ||
      bandeirasNormalizadas.has(baseNormalizada)

    if (grupoClassificado && !bandeirasNormalizadas.has(grupoClassificadoNormalizado)) {
      return normalizarGrupoAdquirente(grupoClassificado)
    }

    if (!grupoComoBandeira) return grupoNormalizado
    if (normalizarGrupoAdquirente(baseNormalizada) === 'UNICA') return 'UNICA'

    const contexto = normalizarChaveAdquirente([
      transacao?.descricao,
      transacao?.historico,
      transacao?.documento,
      transacao?.banco,
      transacao?.nome_banco,
      transacao?.banco_nome
    ].filter(Boolean).join(' '))

    if (/\bREDE(?:CARD)?\b/.test(contexto)) {
      return 'REDE'
    }

    if (/\b(UNICA|TRIPAG|TRIANGULO|TRIBANCO)\b/.test(contexto)) {
      return 'UNICA'
    }

    return grupoNormalizado
  }

  const resolverBandeiraDeposito = (classificacao = {}) => {
    return String(
      classificacao?.pagamentoBanco ||
      classificacao?.base ||
      'SEM BANDEIRA'
    ).trim() || 'SEM BANDEIRA'
  }

  const enriquecerLancamentoBanco = (transacao, classificacao, adquirente, bandeira, valor) => ({
    ...transacao,
    conciliacao: {
      adquirente,
      bandeira,
      valor,
      nomenclaturaBanco: classificacao?.pagamentoBanco || bandeira || '',
      nomenclaturaBase: classificacao?.base || '',
      descricaoOriginal: classificacao?.descricao || transacao?.descricao || '',
      banco: transacao?.banco || transacao?.nome_banco || transacao?.banco_nome || '',
      agencia: transacao?.agencia || transacao?.agencia_conta || '',
      conta: transacao?.conta || transacao?.numero_conta || transacao?.conta_corrente || '',
      comprovante: transacao?.nsu || transacao?.comprovante || transacao?.documento || transacao?.id_transacao || transacao?.id || '',
      status: 'Identificado'
    }
  })

  // Função para buscar depósitos por data e adquirente
  const buscarDepositosPorDataAdquirente = (data, adquirente) => {
    const dataFormatada = formatarData(data)
    if (!dataFormatada || !adquirente) return 0

    const adquirenteNormalizado = normalizarGrupoAdquirente(adquirente)
    const chave = `${dataFormatada}_${adquirenteNormalizado}`
    const depositosAgrupados = buscarDepositosAgrupadosPorData(
      toIsoDate(dataFormatada),
      toIsoDate(dataFormatada)
    )

    return Number(depositosAgrupados[chave]?.totalDepositos || 0)
  }

  // Função para buscar depósitos agrupados por data
  const buscarDepositosAgrupadosPorData = (dataInicial, dataFinal) => {
    if (!transacoes.value || transacoes.value.length === 0) {
      return {}
    }

    const depositosAgrupados = {}

    transacoes.value.forEach(transacao => {
      const dataTransacao = formatarData(transacao.data)
      if (!dataTransacao) return

      const [dia, mes, ano] = dataTransacao.split('/')
      const dataComparacao = `${ano}-${mes}-${dia}`

      // Verificar se está no período
      if (dataInicial && dataComparacao < dataInicial) return
      if (dataFinal && dataComparacao > dataFinal) return

      const valor = Number(parseValorExtrato(transacao) || 0)
      const descricaoNormalizada = normalizarChaveAdquirente(transacao?.descricao || '')
      const isDebitoSafraAluguel = valor < 0 &&
        descricaoNormalizada.includes('DEB ALUG POS') &&
        descricaoNormalizada.includes('SAFRAPAY')

      if (isDebitoSafraAluguel) {
        const adquirente = normalizarGrupoAdquirente('SAFRAPAY')
        const bandeira = 'ALUGUEIS'
        const chave = `${dataTransacao}_${adquirente}`
        const grupo = criarGrupoDeposito(depositosAgrupados, chave, dataTransacao, adquirente)
        grupo.totalDebitos += Math.abs(valor)
        grupo.debitosPorBandeira[bandeira] =
          (grupo.debitosPorBandeira[bandeira] || 0) + Math.abs(valor)
        grupo.quantidadeTransacoes += 1
        grupo.transacoes.push(
          enriquecerLancamentoBanco(transacao, { base: bandeira }, adquirente, bandeira, valor)
        )
        return
      }

      const classificacao = classificarTransacaoPagamentoBanco(transacao, detectarAdquirente)
      if (!classificacao) return

      const adquirente = resolverGrupoDeposito(classificacao, transacao)
      const bandeira = resolverBandeiraDeposito(classificacao)
      const chave = `${dataTransacao}_${adquirente}`
      const grupo = criarGrupoDeposito(
        depositosAgrupados,
        chave,
        dataTransacao,
        adquirente
      )

      grupo.totalDepositos += Number(classificacao.valor || 0)
      grupo.depositosPorBandeira[bandeira] =
        (grupo.depositosPorBandeira[bandeira] || 0) + Number(classificacao.valor || 0)
      grupo.quantidadeTransacoes += 1
      grupo.transacoes.push(
        enriquecerLancamentoBanco(transacao, classificacao, adquirente, bandeira, Number(classificacao.valor || 0))
      )
    })

    return depositosAgrupados
  }

  const buscarTotaisDepositosPorAdquirente = (dataInicial, dataFinal) => {
    const depositosAgrupados = buscarDepositosAgrupadosPorData(dataInicial, dataFinal)

    return Object.values(depositosAgrupados).reduce((totais, grupo) => {
      const adquirente = normalizarGrupoAdquirente(grupo?.adquirente || '')
      if (!adquirente) return totais

      totais[adquirente] = (totais[adquirente] || 0) + Number(grupo?.totalDepositos || 0)
      return totais
    }, {})
  }

  // Função para carregar dados do extrato se necessário
  const carregarDadosExtrato = async (filtros = {}, forceReload = false) => {
    try {
      await buscarTransacoesBancarias(filtros, forceReload)
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
    buscarTotaisDepositosPorAdquirente,
    carregarDadosExtrato
  }
}
