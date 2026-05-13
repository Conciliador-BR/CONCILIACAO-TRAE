import { computed, reactive, ref } from 'vue'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'

const SANDBOX_BASE_REDE = 'https://rl7-sandbox-api.useredecloud.com.br'
const SANDBOX_BASE_REDE_NOVO = 'https://payments-apisandbox.useredecloud.com.br'
const COLLECTION_CANDIDATE_PATHS = [
  'content.transactions',
  'content.paymentSummaries',
  'content.payments',
  'content.paymentOrders',
  'content.sales',
  'content.items',
  'content',
  'paymentSummaries',
  'payments',
  'paymentOrders',
  'transactions',
  'sales',
  'items',
  'data',
  'results'
]

const getValueByPath = (source, path) => {
  return String(path || '')
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), source)
}

const extractRecordsFromPayload = (payload) => {
  for (const path of COLLECTION_CANDIDATE_PATHS) {
    const value = getValueByPath(payload, path)
    if (Array.isArray(value)) return value
  }

  return Array.isArray(payload) ? payload : []
}

const getFirstDefined = (source, keys = []) => {
  for (const key of keys) {
    const value = getValueByPath(source, key)
    if (value !== null && value !== undefined && value !== '') {
      return value
    }
  }

  return null
}

const formatDateDisplay = (value) => {
  const text = String(value || '').trim()
  if (!text) return '--'
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-')
    return `${day}/${month}/${year}`
  }
  return text
}

const formatCurrencyDisplay = (value) => {
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return '--'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numberValue)
}

const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const toUpperSafe = (value) => {
  return String(value || '').trim().toUpperCase()
}

const normalizeResultadoPayload = (rawValue) => {
  if (!rawValue) return null

  if (rawValue.auth || rawValue.request) {
    return rawValue
  }

  if (rawValue.data && (rawValue.data.auth || rawValue.data.request)) {
    return rawValue.data
  }

  if (rawValue._data && (rawValue._data.auth || rawValue._data.request)) {
    return rawValue._data
  }

  if (typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue)
      return normalizeResultadoPayload(parsed)
    } catch {
      return { raw: rawValue }
    }
  }

  return rawValue
}

const formatDate = (date) => {
  return date.toISOString().slice(0, 10)
}

const createPythonLikeParams = () => {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    parentCompanyNumber: '13381369',
    subsidiaries: '13381369',
    startDate: formatDate(startDate),
    endDate: formatDate(now)
  }
}

export const useTesteAutenticacaoRede = () => {
  const {
    integracoes,
    logs,
    erro,
    carregandoIntegracoes,
    carregandoLogs,
    listarIntegracoes,
    listarLogs
  } = useIntegracoesEmpresaSupabase()

  const executandoTeste = ref(false)
  const resultadoTeste = ref(null)
  const mensagem = ref('')
  const sucesso = ref(false)

  const createDefaultForm = () => ({
    integrationId: '',
    baseUrlOverride: SANDBOX_BASE_REDE,
    endpointPath: '/merchant-statement/v1/sales',
    method: 'GET',
    preferNovoSandbox: false,
    timeoutMs: 20000,
    queryParamsText: JSON.stringify(createPythonLikeParams(), null, 2),
    paymentsEndpointPath: '/merchant-statement/v1/payments',
    paymentsQueryParamsText: JSON.stringify(createPythonLikeParams(), null, 2),
    requestBodyText: ''
  })

  const form = reactive(createDefaultForm())
  const erros = ref([])

  const parseJsonText = (value, fallback = {}) => {
    const text = String(value || '').trim()
    if (!text) return fallback
    return JSON.parse(text)
  }

  const resetResultado = () => {
    resultadoTeste.value = null
    mensagem.value = ''
    sucesso.value = false
  }

  const limparFormulario = () => {
    Object.assign(form, createDefaultForm())
    erros.value = []
    resetResultado()
  }

  const carregarDadosIniciais = async () => {
    await Promise.all([
      listarIntegracoes(),
      listarLogs({ limit: 12 })
    ])
  }

  const selecionarIntegracao = async (integrationId) => {
    form.integrationId = integrationId || ''
    resetResultado()
    erros.value = []

    const integracao = integracoes.value.find(item => item.id === integrationId || item.id == integrationId)

    if (integracao) {
      form.baseUrlOverride = integracao.ambiente === 'sandbox'
        ? SANDBOX_BASE_REDE
        : 'https://api.userede.com.br/redelabs'
    }

    if (form.integrationId) {
      await listarLogs({ integracaoId: form.integrationId, limit: 12 })
    } else {
      await listarLogs({ limit: 12 })
    }
  }

  const usarPresetVendasSandbox = () => {
    form.baseUrlOverride = SANDBOX_BASE_REDE
    form.endpointPath = '/merchant-statement/v1/sales'
    form.method = 'GET'
    form.preferNovoSandbox = false
    form.queryParamsText = JSON.stringify(createPythonLikeParams(), null, 2)
    form.paymentsEndpointPath = '/merchant-statement/v1/payments'
    form.paymentsQueryParamsText = JSON.stringify(createPythonLikeParams(), null, 2)
    form.requestBodyText = ''
  }

  const usarPresetVendasNsuSandbox = () => {
    form.baseUrlOverride = SANDBOX_BASE_REDE_NOVO
    form.endpointPath = '/merchant-statement/v1/sales/1254405/daily'
    form.method = 'GET'
    form.preferNovoSandbox = true
    form.queryParamsText = JSON.stringify({
      startDate: '2022-11-22',
      endDate: '2022-11-28'
    }, null, 2)
    form.paymentsEndpointPath = '/merchant-statement/v1/payments'
    form.paymentsQueryParamsText = JSON.stringify(createPythonLikeParams(), null, 2)
    form.requestBodyText = ''
  }

  const validar = () => {
    const lista = []

    if (!form.integrationId) {
      lista.push('Selecione uma integracao cadastrada.')
    }

    if (!String(form.endpointPath || '').trim()) {
      lista.push('Informe a rota que deseja consultar.')
    }

    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(String(form.method || '').toUpperCase())) {
      lista.push('Selecione um metodo HTTP valido.')
    }

    try {
      parseJsonText(form.queryParamsText, {})
    } catch {
      lista.push('O JSON dos query params esta invalido.')
    }

    try {
      parseJsonText(form.paymentsQueryParamsText, {})
    } catch {
      lista.push('O JSON dos query params de pagamentos esta invalido.')
    }

    if (!['GET', 'HEAD'].includes(String(form.method || '').toUpperCase()) && String(form.requestBodyText || '').trim()) {
      try {
        parseJsonText(form.requestBodyText, {})
      } catch {
        lista.push('O JSON do body esta invalido.')
      }
    }

    erros.value = lista
    return lista.length === 0
  }

  const executarTeste = async () => {
    resetResultado()

    if (!validar()) return

    executandoTeste.value = true

    try {
      const payload = {
        integrationId: Number(form.integrationId),
        baseUrlOverride: form.baseUrlOverride,
        endpointPath: form.endpointPath,
        method: String(form.method || 'GET').toUpperCase(),
        preferNovoSandbox: !!form.preferNovoSandbox,
        timeoutMs: Number(form.timeoutMs) || 20000,
        queryParams: parseJsonText(form.queryParamsText, {}),
        paymentsEndpointPath: form.paymentsEndpointPath,
        paymentsQueryParams: parseJsonText(form.paymentsQueryParamsText, {}),
        requestBody: String(form.requestBodyText || '').trim()
          ? parseJsonText(form.requestBodyText, {})
          : {}
      }

      const response = await $fetch('/api/configuracoes/teste-autenticacao', {
        method: 'POST',
        body: payload
      })

      resultadoTeste.value = response
      sucesso.value = true
      mensagem.value = 'Teste executado com sucesso. A API autenticou e respondeu a consulta.'
      await Promise.all([
        listarIntegracoes(),
        listarLogs({ integracaoId: form.integrationId, limit: 12 })
      ])
    } catch (error) {
      sucesso.value = false
      mensagem.value = error?.data?.statusMessage || error?.message || 'Falha ao testar autenticacao.'
      resultadoTeste.value = error?.data || null
      await Promise.all([
        listarIntegracoes(),
        listarLogs({ integracaoId: form.integrationId, limit: 12 })
      ])
    } finally {
      executandoTeste.value = false
    }
  }

  const quantidadeRegistros = computed(() => {
    return Number(resultadoNormalizado.value?.request?.quantity || 0)
  })

  const integracaoSelecionadaDetalhada = computed(() => {
    return integracoes.value.find(item => item.id === form.integrationId || item.id == form.integrationId) || null
  })

  const resultadoNormalizado = computed(() => {
    return normalizeResultadoPayload(resultadoTeste.value)
  })

  const statusResumo = computed(() => {
    if (!resultadoNormalizado.value) {
      return {
        auth: 'pendente',
        request: 'pendente'
      }
    }

    return {
      auth: resultadoNormalizado.value?.auth?.ok ? 'valida' : resultadoNormalizado.value?.auth ? 'erro' : 'pendente',
      request: resultadoNormalizado.value?.request?.ok ? 'valida' : resultadoNormalizado.value?.request ? 'erro' : 'pendente'
    }
  })

  const tabelaExcelRows = computed(() => {
    const directTransactions = resultadoNormalizado.value?.request?.transactions
    const records = Array.isArray(directTransactions)
      ? directTransactions
      : extractRecordsFromPayload(resultadoNormalizado.value?.request?.response)

    return records.map((item, index) => ({
      id: getFirstDefined(item, ['id', 'saleSummaryNumber', 'nsu', 'tid']) || `row-${index + 1}`,
      dataVenda: formatDateDisplay(getFirstDefined(item, ['movementDate', 'saleDate', 'transactionDate', 'captureDate'])),
      dataPagamento: formatDateDisplay(getFirstDefined(item, ['paymentDate', 'liquidationDate', 'creditDate', 'movementDate'])),
      nsu: getFirstDefined(item, ['nsu', 'salesSummaryNumber', 'saleSummaryNumber']) || '--',
      valorBruto: formatCurrencyDisplay(
        Number(getFirstDefined(item, ['netAmount', 'liquidAmount', 'netValue']) || 0)
        + Number(getFirstDefined(item, ['feeTotal', 'mdrFee', 'discountAmount']) || 0)
      ),
      valorLiquido: formatCurrencyDisplay(getFirstDefined(item, ['netAmount', 'liquidAmount', 'netValue'])),
      valorMdr: formatCurrencyDisplay(getFirstDefined(item, ['feeTotal', 'mdrFee', 'discountAmount', 'mdrAmount'])),
      status: getFirstDefined(item, ['status', 'situation']) || '--',
      modalidade: getFirstDefined(item, ['captureType', 'modality', 'productType']) || '--',
      bandeira: getFirstDefined(item, ['brandName', 'brandDescription', 'brandCode', 'brand']) || '--'
    }))
  })

  const vendasImportacaoRows = computed(() => {
    const directTransactions = resultadoNormalizado.value?.request?.transactions
    const records = Array.isArray(directTransactions)
      ? directTransactions
      : extractRecordsFromPayload(resultadoNormalizado.value?.request?.response)

    const integracao = integracaoSelecionadaDetalhada.value
    const adquirente = toUpperSafe(integracao?.adquirente || 'REDE')
    const empresa = integracao?.empresa_id ? `Empresa ${integracao.empresa_id}` : '-'
    const matriz = integracao?.empresa_id ? `Matriz ${integracao.empresa_id}` : '-'

    return records.map((item, index) => {
      const valorBruto = toNumber(getFirstDefined(item, ['amount', 'grossAmount', 'grossValue']))
      const valorLiquido = toNumber(getFirstDefined(item, ['netAmount', 'liquidAmount', 'netValue']))
      const despesaMdr = toNumber(getFirstDefined(item, ['feeTotal', 'mdrFee', 'mdrAmount']))
      const descontoTotal = toNumber(getFirstDefined(item, ['discountAmount']))
      const despesaAntecipacao = Math.max(descontoTotal - despesaMdr, 0)
      const valorAntecipacao = despesaAntecipacao > 0 ? valorBruto : 0
      const valorLiquidoAntecipacao = valorAntecipacao > 0 ? Math.max(valorLiquido - despesaAntecipacao, 0) : 0
      const taxaMdr = valorBruto > 0 ? (despesaMdr / valorBruto) * 100 : 0

      return {
        id: getFirstDefined(item, ['saleSummaryNumber', 'id', 'nsu', 'tid']) || `venda-${index + 1}`,
        data_venda: getFirstDefined(item, ['movementDate', 'saleDate', 'transactionDate']) || null,
        modalidade: toUpperSafe(getFirstDefined(item, ['captureType', 'modality', 'productType'])),
        nsu: getFirstDefined(item, ['nsu', 'salesSummaryNumber', 'saleSummaryNumber']) || '-',
        valor_bruto: valorBruto,
        valor_liquido: valorLiquido,
        taxa_mdr: taxaMdr,
        despesa_mdr: despesaMdr,
        parcela_atual: getFirstDefined(item, ['installmentNumber', 'currentInstallment']) || null,
        numero_parcelas: toNumber(getFirstDefined(item, ['installmentQuantity', 'installments', 'numberOfInstallments'])) || 1,
        bandeira: toUpperSafe(getFirstDefined(item, ['brandName', 'brandDescription', 'brandCode', 'brand'])),
        valor_antecipacao: valorAntecipacao || null,
        despesa_antecipacao: despesaAntecipacao || null,
        valor_liquido_antecipacao: valorLiquidoAntecipacao || null,
        previsao_pgto: getFirstDefined(item, ['paymentDate', 'liquidationDate', 'creditDate']) || null,
        adquirente,
        empresa,
        matriz
      }
    })
  })

  const recebimentosImportacaoRows = computed(() => {
    const directTransactions = resultadoNormalizado.value?.payments?.transactions
    const records = Array.isArray(directTransactions)
      ? directTransactions
      : extractRecordsFromPayload(resultadoNormalizado.value?.payments?.response)

    const integracao = integracaoSelecionadaDetalhada.value
    const adquirente = toUpperSafe(integracao?.adquirente || 'REDE')
    const empresa = integracao?.empresa_id ? `Empresa ${integracao.empresa_id}` : '-'
    const matriz = integracao?.empresa_id ? `Matriz ${integracao.empresa_id}` : '-'

    return records.map((item, index) => {
      const valorBruto = toNumber(getFirstDefined(item, ['amount', 'grossAmount', 'grossValue']))
      const valorLiquido = toNumber(getFirstDefined(item, ['netAmount', 'liquidAmount', 'netValue']))
      const despesaMdr = toNumber(getFirstDefined(item, ['feeTotal', 'mdrFee', 'mdrAmount']))
      const descontoTotal = toNumber(getFirstDefined(item, ['discountAmount']))
      const despesaAntecipacao = Math.max(descontoTotal - despesaMdr, 0)
      const valorPago = despesaAntecipacao > 0 ? Math.max(valorLiquido - despesaAntecipacao, 0) : valorLiquido
      const taxaMdr = valorBruto > 0 ? (despesaMdr / valorBruto) * 100 : 0

      return {
        id: getFirstDefined(item, ['paymentId', 'saleSummaryNumber', 'id', 'nsu', 'tid']) || `recebimento-${index + 1}`,
        data_venda: getFirstDefined(item, ['saleDate', 'movementDate', 'transactionDate']) || null,
        data_recebimento: getFirstDefined(item, ['paymentDate', 'plannedPaymentDate', 'liquidationDate', 'creditDate', 'movementDate']) || null,
        modalidade: toUpperSafe(getFirstDefined(item, ['modality', 'captureType', 'productType'])),
        nsu: getFirstDefined(item, ['nsu', 'salesSummaryNumber', 'saleSummaryNumber']) || getFirstDefined(item, ['paymentId']) || '-',
        valor_bruto: valorBruto || toNumber(getFirstDefined(item, ['grossAmountPlanned', 'grossPlannedAmount'])),
        valor_liquido: valorLiquido || toNumber(getFirstDefined(item, ['plannedAmount', 'paymentAmount', 'amount'])),
        taxa_mdr: taxaMdr,
        despesa_mdr: despesaMdr || toNumber(getFirstDefined(item, ['mdrAmount', 'discountedAmount'])),
        numero_parcelas: toNumber(getFirstDefined(item, ['installmentQuantity', 'installments', 'numberOfInstallments'])) || 1,
        bandeira: toUpperSafe(getFirstDefined(item, ['brandName', 'brandDescription', 'brandCode', 'brand', 'brandCodeDescription'])),
        valor_antecipacao: valorBruto > 0 && despesaAntecipacao > 0 ? valorBruto : toNumber(getFirstDefined(item, ['anticipatedAmount'])),
        despesa_antecipacao: despesaAntecipacao || 0,
        valor_liquido_antecipacao: valorPago || toNumber(getFirstDefined(item, ['paidAmount', 'paymentAmount', 'plannedAmount'])),
        adquirente,
        empresa,
        matriz
      }
    })
  })

  return {
    SANDBOX_BASE_REDE,
    SANDBOX_BASE_REDE_NOVO,
    form,
    erros,
    mensagem,
    sucesso,
    erro,
    integracoes,
    logs,
    carregandoIntegracoes,
    carregandoLogs,
    executandoTeste,
    resultadoTeste,
    resultadoNormalizado,
    quantidadeRegistros,
    statusResumo,
    tabelaExcelRows,
    vendasImportacaoRows,
    recebimentosImportacaoRows,
    carregarDadosIniciais,
    selecionarIntegracao,
    usarPresetVendasSandbox,
    usarPresetVendasNsuSandbox,
    executarTeste,
    limparFormulario
  }
}
