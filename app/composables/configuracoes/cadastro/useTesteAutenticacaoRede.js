import { computed, reactive, ref, watch } from 'vue'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig.js'

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

const buildPreviewUrl = (baseUrl, endpointPath, queryParams = {}) => {
  const normalizedBase = String(baseUrl || '').trim().replace(/\/+$/, '')
  const normalizedPath = String(endpointPath || '').trim()
  if (!normalizedBase || !normalizedPath) return ''

  const url = new URL(`${normalizedBase}/${normalizedPath.replace(/^\/+/, '')}`)

  Object.entries(queryParams || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

const createDefaultDates = () => {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(now)
  }
}

const buildRedeQueryParamsFromIntegration = (integracao, periodo = createDefaultDates()) => {
  const ec = String(integracao?.ec_adquirente || '').trim()

  return {
    parentCompanyNumber: ec,
    subsidiaries: ec,
    startDate: periodo.startDate,
    endDate: periodo.endDate
  }
}

const OPERADORAS_ADQUIRENTES = [
  { id: 'cielo', label: 'Cielo', sigla: 'CI', cor: 'bg-blue-500' },
  { id: 'rede', label: 'Rede', sigla: 'RD', cor: 'bg-orange-600' },
  { id: 'getnet', label: 'Getnet', sigla: 'GN', cor: 'bg-purple-600' },
  { id: 'unica', label: 'Unica', sigla: 'UN', cor: 'bg-purple-700' },
  { id: 'stone', label: 'Stone', sigla: 'ST', cor: 'bg-gray-700' },
  { id: 'safra', label: 'Safra', sigla: 'SF', cor: 'bg-indigo-600' }
]

const OPERADORAS_VOUCHERS = [
  { id: 'alelo', label: 'Alelo', sigla: 'AL', cor: 'bg-yellow-500' },
  { id: 'lecard', label: 'Lecard', sigla: 'LC', cor: 'bg-lime-500' },
  { id: 'pluxee', label: 'Pluxee', sigla: 'PL', cor: 'bg-cyan-500' },
  { id: 'vr', label: 'VR', sigla: 'VR', cor: 'bg-green-500' },
  { id: 'ticket', label: 'Ticket', sigla: 'TK', cor: 'bg-red-500' },
  { id: 'credshop', label: 'Credshop', sigla: 'CS', cor: 'bg-pink-600' },
  { id: 'cabal', label: 'Cabal', sigla: 'CB', cor: 'bg-yellow-400' },
  { id: 'greencard', label: 'Green Card', sigla: 'GC', cor: 'bg-green-600' }
]

const buildRedePreset = (ambiente = 'producao', integracao = null, periodo = createDefaultDates()) => {
  const queryParams = buildRedeQueryParamsFromIntegration(integracao, periodo)

  return {
    authStrategy: 'oauth2_client_credentials',
    baseUrlOverride: ambiente === 'producao'
      ? 'https://api.userede.com.br/redelabs'
      : SANDBOX_BASE_REDE,
    endpointPath: '/merchant-statement/v1/sales',
    method: 'GET',
    preferNovoSandbox: false,
    paymentsEndpointPath: '/merchant-statement/v1/payments',
    queryParams,
    paymentsQueryParams: queryParams,
    hint: ambiente === 'producao'
      ? 'Preset REDE producao: usa a credencial global da conciliadora e consulta vendas/pagamentos com a EC cadastrada do cliente.'
      : 'Preset REDE sandbox: usa a credencial global da conciliadora e consulta vendas/pagamentos com a EC cadastrada do cliente.'
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
    operadoraSelecionada: 'rede',
    integrationId: '',
    dataInicial: createDefaultDates().startDate,
    dataFinal: createDefaultDates().endDate,
    authStrategy: 'oauth2_client_credentials',
    baseUrlOverride: 'https://api.userede.com.br/redelabs',
    endpointPath: '/merchant-statement/v2/sales',
    method: 'GET',
    preferNovoSandbox: false,
    timeoutMs: 60000,
    queryParamsText: JSON.stringify(buildRedePreset('producao', null, createDefaultDates()).queryParams, null, 2),
    paymentsEndpointPath: '/merchant-statement/v1/payments',
    paymentsQueryParamsText: JSON.stringify(buildRedePreset('producao', null, createDefaultDates()).paymentsQueryParams, null, 2),
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

  const integracoesFiltradas = computed(() => {
    const operadora = String(form.operadoraSelecionada || '').toLowerCase()
    return (integracoes.value || []).filter(item => String(item.adquirente || '').toLowerCase() === operadora)
  })

  const integracaoSelecionadaDetalhada = computed(() => {
    return integracoes.value.find(item => item.id === form.integrationId || item.id == form.integrationId) || null
  })

  const operadoraSelecionadaDetalhada = computed(() => {
    return [...OPERADORAS_ADQUIRENTES, ...OPERADORAS_VOUCHERS]
      .find(item => item.id === form.operadoraSelecionada) || null
  })

  const presetAtual = computed(() => {
    const integracao = integracaoSelecionadaDetalhada.value
    const ambiente = integracao?.ambiente || 'producao'
    const periodo = {
      startDate: form.dataInicial,
      endDate: form.dataFinal
    }

    if (String(form.operadoraSelecionada || '').toLowerCase() === 'rede') {
      return buildRedePreset(ambiente, integracao, periodo)
    }

    return null
  })

  const aplicarPresetAutomatico = () => {
    const preset = presetAtual.value
    if (!preset) return

    form.authStrategy = preset.authStrategy
    form.baseUrlOverride = preset.baseUrlOverride
    form.endpointPath = preset.endpointPath
    form.method = preset.method
    form.preferNovoSandbox = preset.preferNovoSandbox
    form.queryParamsText = JSON.stringify(preset.queryParams, null, 2)
    form.paymentsEndpointPath = preset.paymentsEndpointPath
    form.paymentsQueryParamsText = JSON.stringify(preset.paymentsQueryParams, null, 2)
    form.requestBodyText = ''
  }

  watch(
    () => [form.dataInicial, form.dataFinal],
    () => {
      if (form.integrationId && String(form.operadoraSelecionada || '').toLowerCase() === 'rede') {
        aplicarPresetAutomatico()
      }
    }
  )

  const carregarDadosIniciais = async () => {
    await Promise.all([
      listarIntegracoes(),
      listarLogs({ limit: 12 })
    ])
  }

  const selecionarOperadora = async (operadoraId) => {
    form.operadoraSelecionada = operadoraId || ''
    form.integrationId = ''
    resetResultado()
    erros.value = []
    aplicarPresetAutomatico()
    await listarLogs({ limit: 12 })
  }

  const selecionarIntegracao = async (integrationId) => {
    form.integrationId = integrationId || ''
    resetResultado()
    erros.value = []

    const integracao = integracoes.value.find(item => item.id === integrationId || item.id == integrationId)

    if (integracao) {
      form.operadoraSelecionada = String(integracao.adquirente || '').toLowerCase()
      aplicarPresetAutomatico()
    }

    if (form.integrationId) {
      await listarLogs({ integracaoId: form.integrationId, limit: 12 })
    } else {
      await listarLogs({ limit: 12 })
    }
  }

  const validar = () => {
    const lista = []

    if (!form.operadoraSelecionada) {
      lista.push('Selecione uma adquirente ou voucher para configurar o teste.')
    }

    if (!form.integrationId) {
      lista.push('Selecione uma integracao cadastrada.')
    }

    const integracao = integracaoSelecionadaDetalhada.value
    if (String(form.operadoraSelecionada || '').toLowerCase() !== 'rede') {
      lista.push('No momento, a tela inteligente de teste esta implementada somente para a REDE.')
    }

    if (String(integracao?.adquirente || '').toLowerCase() === 'rede' && !String(integracao?.ec_adquirente || '').trim()) {
      lista.push('Essa integracao da REDE precisa ter a EC da adquirente cadastrada para montar a consulta.')
    }

    if (!String(form.dataInicial || '').trim() || !String(form.dataFinal || '').trim()) {
      lista.push('Informe a data inicial e a data final para o teste.')
    }

    if (String(form.dataInicial || '') > String(form.dataFinal || '')) {
      lista.push('A data inicial nao pode ser maior que a data final.')
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
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = String(sessionData?.session?.access_token || '').trim()
      if (!accessToken) {
        throw new Error('Sessao expirada. Faca login novamente.')
      }
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

      const response = await $fetch('/api/configuracoes/rede/teste-autenticacao', {
        method: 'POST',
        body: payload,
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
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

  const quantidadePagamentos = computed(() => {
    return Number(resultadoNormalizado.value?.payments?.quantity || 0)
  })

  const resultadoNormalizado = computed(() => {
    return normalizeResultadoPayload(resultadoTeste.value)
  })

  const authUrlPreview = computed(() => {
    const integracao = integracaoSelecionadaDetalhada.value
    const ambiente = integracao?.ambiente || 'producao'
    const baseUrl = ambiente === 'producao'
      ? 'https://api.userede.com.br/redelabs'
      : SANDBOX_BASE_REDE

    return `${String(baseUrl).replace(/\/+$/, '')}/oauth2/token`
  })

  const pvEcPreview = computed(() => {
    const integracao = integracaoSelecionadaDetalhada.value
    return integracao?.ec_adquirente ? String(integracao.ec_adquirente) : ''
  })

  const requestUrlPreview = computed(() => {
    try {
      return buildPreviewUrl(form.baseUrlOverride, form.endpointPath, parseJsonText(form.queryParamsText, {}))
    } catch {
      return buildPreviewUrl(form.baseUrlOverride, form.endpointPath, {})
    }
  })

  const paymentsUrlPreview = computed(() => {
    try {
      return buildPreviewUrl(form.baseUrlOverride, form.paymentsEndpointPath, parseJsonText(form.paymentsQueryParamsText, {}))
    } catch {
      return buildPreviewUrl(form.baseUrlOverride, form.paymentsEndpointPath, {})
    }
  })

  const statusResumo = computed(() => {
    if (!resultadoNormalizado.value) {
      return {
        auth: 'pendente',
        request: 'pendente',
        payments: 'pendente'
      }
    }

    return {
      auth: resultadoNormalizado.value?.auth?.ok ? 'valida' : resultadoNormalizado.value?.auth ? 'erro' : 'pendente',
      request: resultadoNormalizado.value?.request?.ok ? 'valida' : resultadoNormalizado.value?.request ? 'erro' : 'pendente',
      payments: resultadoNormalizado.value?.payments?.ok ? 'valida' : resultadoNormalizado.value?.payments ? 'erro' : 'pendente'
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
    const empresa = String(integracao?.nome_empresa || '').trim() || '-'
    const matriz = String(integracao?.matriz || '').trim() || '-'

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
    integracoesFiltradas,
    operadoraSelecionadaDetalhada,
    presetAtual,
    opcoesAdquirentes: OPERADORAS_ADQUIRENTES,
    opcoesVouchers: OPERADORAS_VOUCHERS,
    logs,
    carregandoIntegracoes,
    carregandoLogs,
    executandoTeste,
    resultadoTeste,
    resultadoNormalizado,
    quantidadeRegistros,
    quantidadePagamentos,
    statusResumo,
    authUrlPreview,
    pvEcPreview,
    requestUrlPreview,
    paymentsUrlPreview,
    tabelaExcelRows,
    vendasImportacaoRows,
    recebimentosImportacaoRows,
    carregarDadosIniciais,
    selecionarOperadora,
    selecionarIntegracao,
    aplicarPresetAutomatico,
    executarTeste,
    limparFormulario
  }
}
