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

const toNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const toUpperSafe = (value) => {
  return String(value || '').trim().toUpperCase()
}

const BRAND_CODE_MAP = {
  '1': 'VISA',
  '2': 'MASTERCARD',
  '14': 'ELO',
  '16': 'HIPERCARD'
}

const MODALIDADE_CODE_MAP = {
  '1': 'DEBITO',
  '2': 'CREDITO',
  '3': 'PARCELADO'
}

const getObjectDisplayValue = (value) => {
  if (value == null) return ''
  if (typeof value !== 'object') return String(value)

  const preferredKeys = [
    'description',
    'descricao',
    'name',
    'nome',
    'label',
    'title',
    'value',
    'code',
    'id'
  ]

  for (const key of preferredKeys) {
    const current = value?.[key]
    if (current !== null && current !== undefined && current !== '') {
      if (typeof current === 'object') {
        const nested = getObjectDisplayValue(current)
        if (nested) return nested
      } else {
        return String(current)
      }
    }
  }

  for (const current of Object.values(value)) {
    if (current !== null && current !== undefined && current !== '') {
      if (typeof current === 'object') {
        const nested = getObjectDisplayValue(current)
        if (nested) return nested
      } else {
        return String(current)
      }
    }
  }

  return ''
}

const getNormalizedDisplayValue = (value) => {
  return toUpperSafe(getObjectDisplayValue(value))
}

const normalizeTextKey = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

const resolverBandeira = (item) => {
  const brandName = getNormalizedDisplayValue(getFirstDefined(item, [
    'brandName',
    'brandName.description',
    'brandDescription',
    'brand.description',
    'brand.name',
    'brand',
    'cardBrand.description',
    'cardBrand.name'
  ]))

  if (brandName && !/^\d+$/.test(brandName)) {
    return brandName
  }

  const brandCode = getNormalizedDisplayValue(getFirstDefined(item, [
    'brandCode',
    'brand.code',
    'brand.id',
    'cardBrand.code',
    'cardBrand.id'
  ]))

  if (BRAND_CODE_MAP[brandCode]) {
    return BRAND_CODE_MAP[brandCode]
  }

  return brandName || brandCode || '-'
}

const resolverModalidade = (item, numeroParcelas = 1) => {
  const rawModalidade = getNormalizedDisplayValue(getFirstDefined(item, [
    'transactionType.description',
    'transactionType.name',
    'transactionType.code',
    'transactionType',
    'modality.description',
    'modality.name',
    'modality.code',
    'modality',
    'productType.description',
    'productType.name',
    'productType.code',
    'productType',
    'captureType.description',
    'captureType.name',
    'captureType.code',
    'captureType'
  ]))

  const texto = normalizeTextKey(rawModalidade)

  if (MODALIDADE_CODE_MAP[texto]) {
    return Number(numeroParcelas) > 1 && texto !== '1'
      ? 'PARCELADO'
      : MODALIDADE_CODE_MAP[texto]
  }

  if (texto.includes('DEBIT')) return 'DEBITO'
  if (texto.includes('VOUCHER')) return 'VOUCHER'
  if (texto.includes('PARCEL')) return 'PARCELADO'
  if (texto.includes('INSTALLMENT')) return 'PARCELADO'
  if (texto.includes('CRED')) {
    return Number(numeroParcelas) > 1 ? 'PARCELADO' : 'CREDITO'
  }

  if (Number(numeroParcelas) > 1) {
    return 'PARCELADO'
  }

  if (texto === 'POS' || texto === 'TEF' || texto === '[OBJECT OBJECT]' || !texto) {
    return 'CREDITO'
  }

  return texto
}

const normalizeDate = (value) => {
  const text = String(value || '').trim()
  if (!text) return null

  const first = text.split(/[T\s]+/)[0]

  if (/^\d{4}-\d{2}-\d{2}$/.test(first)) {
    return first
  }

  const brDateMatch = first.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (brDateMatch) {
    const [, dia, mes, ano] = brDateMatch
    return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  return first
}

export const buildVendasImportacaoRows = ({
  payload,
  integracao,
  nomeEmpresa = '',
  matrizEmpresa = ''
}) => {
  const directTransactions = payload?.request?.transactions
  const records = Array.isArray(directTransactions)
    ? directTransactions
    : extractRecordsFromPayload(payload?.request?.response)

  const adquirente = toUpperSafe(integracao?.adquirente || 'REDE')
  const empresa = String(nomeEmpresa || integracao?.nome_empresa || '').trim() || '-'
  const matriz = String(matrizEmpresa || integracao?.matriz || '').trim() || '-'
  const ec = String(integracao?.ec_adquirente || integracao?.matriz || matrizEmpresa || '').trim() || matriz

  return records.map((item, index) => {
    const valorBruto = toNumber(getFirstDefined(item, ['amount', 'grossAmount', 'grossValue']))
    const valorLiquido = toNumber(getFirstDefined(item, ['netAmount', 'liquidAmount', 'netValue']))
    const despesaMdr = toNumber(getFirstDefined(item, ['feeTotal', 'mdrFee', 'mdrAmount']))
    const descontoTotal = toNumber(getFirstDefined(item, ['discountAmount']))
    const despesaAntecipacao = Math.max(descontoTotal - despesaMdr, 0)
    const valorAntecipacao = despesaAntecipacao > 0 ? valorBruto : 0
    const valorLiquidoAntecipacao = valorAntecipacao > 0
      ? Math.max(valorLiquido - despesaAntecipacao, 0)
      : 0
    const taxaMdr = valorBruto > 0 ? (despesaMdr / valorBruto) : 0
    const numeroParcelas = toNumber(getFirstDefined(item, ['installmentQuantity', 'installments', 'numberOfInstallments'])) || 1

    return {
      id: getFirstDefined(item, ['saleSummaryNumber', 'id', 'nsu', 'tid']) || `venda-api-rede-${index + 1}`,
      data_venda: normalizeDate(getFirstDefined(item, ['movementDate', 'saleDate', 'transactionDate', 'captureDate'])),
      modalidade: resolverModalidade(item, numeroParcelas),
      nsu: getFirstDefined(item, ['nsu', 'salesSummaryNumber', 'saleSummaryNumber']) || '-',
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      taxa_mdr: taxaMdr,
      despesa_mdr: despesaMdr,
      parcela_atual: getFirstDefined(item, ['installmentNumber', 'currentInstallment']) || null,
      numero_parcelas: numeroParcelas,
      bandeira: resolverBandeira(item),
      valor_antecipacao: valorAntecipacao || null,
      despesa_antecipacao: despesaAntecipacao || null,
      valor_liquido_antecipacao: valorLiquidoAntecipacao || null,
      previsao_pgto: normalizeDate(getFirstDefined(item, ['paymentDate', 'liquidationDate', 'creditDate'])),
      adquirente,
      empresa,
      matriz,
      ec
    }
  })
}
