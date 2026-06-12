import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'
import { useSeletorIntegracaoEmpresa } from '~/composables/configuracoes/importacao/processor_vendas_automaticas/useSeletorIntegracaoEmpresa'
import { buildRecebimentosImportacaoRows } from './redeRecebimentosImportMapper'

const LIMITE_MAXIMO_REGISTROS = 500000

const construirQueryParamsRede = ({ ecConsulta, dataInicial, dataFinal }) => {
  return {
    parentCompanyNumber: ecConsulta,
    subsidiaries: ecConsulta,
    startDate: dataInicial,
    endDate: dataFinal
  }
}

const parseIsoDate = (value) => {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null

  const [year, month, day] = text.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return Number.isNaN(date.getTime()) ? null : date
}

const formatIsoDate = (date) => date.toISOString().slice(0, 10)

const buildDailyPeriods = (dataInicial, dataFinal) => {
  const start = parseIsoDate(dataInicial)
  const end = parseIsoDate(dataFinal)

  if (!start || !end || start > end) {
    return [{ dataInicial, dataFinal }]
  }

  const periods = []
  const current = new Date(start.getTime())

  while (current <= end) {
    const isoDate = formatIsoDate(current)
    periods.push({
      dataInicial: isoDate,
      dataFinal: isoDate
    })
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return periods
}

const criarChaveRecebimento = (item) => {
  const partes = [
    item?.creditOrderNumber,
    item?.paymentId,
    item?.nsu,
    item?.salesSummaryNumber,
    item?.saleSummaryNumber,
    item?.tid,
    item?.authorizationCode,
    item?.grossAmount,
    item?.grossValue,
    item?.netAmount,
    item?.paymentAmount,
    item?.paymentDate,
    item?.plannedPaymentDate,
    item?.saleDate,
    item?.movementDate
  ]
    .map((valor) => String(valor ?? '').trim())
    .filter(Boolean)

  return partes.length > 0 ? partes.join('|') : JSON.stringify(item)
}

const executarConsultaRedePorPeriodo = async ({
  accessToken,
  integracaoId,
  ecConsulta,
  dataInicial,
  dataFinal
}) => {
  const payload = await $fetch('/api/configuracoes/rede/teste-autenticacao', {
    method: 'POST',
    body: {
      integrationId: Number(integracaoId),
      endpointPath: '/merchant-statement/v1/payments/credit-orders',
      method: 'GET',
      timeoutMs: 60000,
      paginateAll: true,
      maxPaginatedRecords: LIMITE_MAXIMO_REGISTROS,
      paginationStrategy: 'cursor',
      queryParams: construirQueryParamsRede({
        ecConsulta,
        dataInicial,
        dataFinal
      }),
      paymentsEndpointPath: '',
      paymentsQueryParams: {}
    },
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  return {
    ...payload,
    periodo: {
      dataInicial,
      dataFinal
    }
  }
}

export const useImportacaoAutomaticaRede_recebimentos = () => {
  const carregando = ref(false)
  const erro = ref('')
  const integracaoEncontrada = ref(null)
  const criterioBusca = ref('')

  const { listarIntegracoes } = useIntegracoesEmpresaSupabase()
  const { selecionarIntegracao, normalizarEc } = useSeletorIntegracaoEmpresa()

  const limparEstado = () => {
    erro.value = ''
    integracaoEncontrada.value = null
    criterioBusca.value = ''
  }

  const obterAccessToken = async () => {
    const { data } = await supabase.auth.getSession()
    const accessToken = String(data?.session?.access_token || '').trim()

    if (!accessToken) {
      throw new Error('Sessao expirada. Faca login novamente.')
    }

    return accessToken
  }

  const importarRecebimentos = async ({
    nomeEmpresa = '',
    ecEmpresa = '',
    dataInicial = '',
    dataFinal = ''
  }) => {
    carregando.value = true
    erro.value = ''

    try {
      if (!String(nomeEmpresa || '').trim()) {
        throw new Error('Nao foi possivel identificar a empresa selecionada.')
      }

      if (!String(ecEmpresa || '').trim()) {
        throw new Error('A empresa selecionada nao possui EC/matriz preenchida.')
      }

      if (!String(dataInicial || '').trim() || !String(dataFinal || '').trim()) {
        throw new Error('Selecione o periodo no filtro de data antes de puxar os recebimentos.')
      }

      const integracoes = await listarIntegracoes()
      const { integracao, criterio } = selecionarIntegracao({
        integracoes,
        adquirente: 'rede',
        nomeEmpresa,
        ecEmpresa
      })

      if (!integracao) {
        throw new Error(`Nenhuma integracao ativa da Rede foi encontrada para ${nomeEmpresa} com a matriz ${ecEmpresa}.`)
      }

      const ecConsulta = normalizarEc(integracao.ec_adquirente || integracao.matriz || ecEmpresa)
      if (!ecConsulta) {
        throw new Error('A integracao localizada nao possui EC valida para consulta na API da Rede.')
      }

      const accessToken = await obterAccessToken()
      const periodosConsulta = buildDailyPeriods(dataInicial, dataFinal)
      const payloads = []

      for (const periodo of periodosConsulta) {
        const payload = await executarConsultaRedePorPeriodo({
          accessToken,
          integracaoId: integracao.id,
          ecConsulta,
          dataInicial: periodo.dataInicial,
          dataFinal: periodo.dataFinal
        })

        payloads.push(payload)
      }

      if (payloads.length === 0) {
        throw new Error('Falha ao puxar os recebimentos via API da Rede.')
      }

      const transactions = []
      const transactionKeys = new Set()

      payloads.forEach((payload) => {
        const payloadTransactions = Array.isArray(payload?.request?.transactions) ? payload.request.transactions : []

        payloadTransactions.forEach((item) => {
          const key = criarChaveRecebimento(item)
          if (transactionKeys.has(key)) return
          transactionKeys.add(key)
          transactions.push(item)
        })
      })

      const payload = {
        ...(payloads[0] || {}),
        request: {
          ...(payloads[0]?.request || {}),
          quantity: transactions.length,
          transactions
        }
      }

      const registros = buildRecebimentosImportacaoRows({
        payload,
        integracao,
        nomeEmpresa,
        matrizEmpresa: ecEmpresa
      })

      integracaoEncontrada.value = integracao
      criterioBusca.value = criterio

      return {
        integracao,
        criterio,
        ecConsulta,
        payload,
        registros
      }
    } catch (error) {
      erro.value = error?.data?.statusMessage || error?.message || 'Falha ao puxar os recebimentos via API da Rede.'
      throw new Error(erro.value)
    } finally {
      carregando.value = false
    }
  }

  return {
    carregando,
    erro,
    integracaoEncontrada,
    criterioBusca,
    limparEstado,
    importarRecebimentos
  }
}
