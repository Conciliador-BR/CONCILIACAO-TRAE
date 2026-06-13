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
  '3': 'AMEX',
  '4': 'DINERS CLUB',
  '5': 'JCB',
  '6': 'DISCOVER',
  '7': 'AURA',
  '8': 'SOROCRED',
  '9': 'CABAL',
  '10': 'MAIS!',
  '11': 'AVISTA',
  '12': 'CREDZ',
  '13': 'BANRICOMPRAS',
  '14': 'ELO',
  '15': 'HIPERCARD',
  '16': 'ALELO',
  '17': 'TICKET',
  '18': 'SODEXO',
  '19': 'VR',
  '20': 'PLUXEE',
  '21': 'VR',
  '22': 'VEROCHEQUE',
  '23': 'COOPERCARD',
  '24': 'PERSONAL CARD',
  '25': 'POLICARD',
  '26': 'VALECARD',
  '27': 'UP BRASIL',
  '28': 'SENFF',
  '29': 'TRICARD',
  '30': 'FORTBRASIL',
  '31': 'CALCARD',
  '32': 'BNB CLUBE',
  '33': 'GOOD CARD',
  '37': 'LECARD',
  '52': 'TICKET'
}

const MODALIDADE_CODE_MAP = {
  '1': 'DEBITO',
  '2': 'CREDITO',
  '3': 'CREDITO'
}
const VOUCHER_ISSUER_NAMES = [
  'ALELO',
  'PLUXEE',
  'PLUXE',
  'TICKET',
  'VR',
  'VR BENEFICIOS',
  'LECARD',
  'LE CARD',
  'UP BRASIL',
  'SODEXO',
  'BEN VISA VALE',
  'COMPROCARD',
  'GREEN CARD',
  'GREENCARD',
  'VEROCHEQUE',
  'GOOD CARD',
  'VALERCARD',
  'VALECARD',
  'POLICARD',
  'COOPERCARD',
  'PERSONAL CARD'
]
const VOUCHER_BRAND_CODES = new Set([
  '16', '17', '18', '19', '20', '21', '22', '23', '24',
  '25', '26', '27', '28', '29', '30', '31', '32', '33', '37', '52'
])

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

const normalizeModalidadeConsulta = (value) => {
  const texto = normalizeTextKey(value)
  if (texto === 'DEBIT') return 'DEBITO'
  if (texto === 'CREDIT') return 'CREDITO'
  return texto
}

const isMeaningfulDisplayValue = (value) => {
  const texto = normalizeTextKey(value)
  return !!texto && texto !== '-' && texto !== 'SEM BANDEIRA' && texto !== 'SEM MODALIDADE'
}

const isVoucherIssuerName = (value) => {
  const texto = normalizeTextKey(value)
  if (!texto) return false
  return VOUCHER_ISSUER_NAMES.some((issuer) => texto.includes(issuer))
}

const getBrandCodeFromItem = (item) => {
  return getNormalizedDisplayValue(getFirstDefined(item, [
    'cardBrand.code',
    'cardBrand.id',
    'brandCode',
    'brand.code',
    'brand.id',
    '__consultaRede.brandCode'
  ]))
}

const isVoucherBrandCode = (value) => {
  return VOUCHER_BRAND_CODES.has(String(value || '').trim())
}

const isPixTransaction = (item, rawModalidade = '') => {
  const texto = normalizeTextKey([
    rawModalidade,
    getFirstDefined(item, ['productType.description', 'productType.name', 'productType.code', 'productType']),
    getFirstDefined(item, ['transactionType.description', 'transactionType.name', 'transactionType.code', 'transactionType']),
    getFirstDefined(item, ['captureType.description', 'captureType.name', 'captureType.code', 'captureType']),
    getFirstDefined(item, ['kind', 'type', 'subType', 'cardType']),
    getFirstDefined(item, ['brandName', 'brandDescription', 'brandCodeDescription']),
    getFirstDefined(item, ['cardBrand.description', 'cardBrand.name']),
    getFirstDefined(item, ['paymentMethod.description', 'paymentMethod.name', 'paymentMethod.code', 'paymentMethod']),
    getFirstDefined(item, ['wallet.description', 'wallet.name', 'wallet.code', 'wallet'])
  ].filter(Boolean).join(' '))

  return (
    texto.includes('PIX')
    || texto.includes('QR CODE')
    || texto.includes('QRCODE')
    || texto.includes('INSTANT PAYMENT')
  )
}

const isVoucherTransaction = (item, rawModalidade = '') => {
  const texto = normalizeTextKey([
    rawModalidade,
    getFirstDefined(item, ['productType.description', 'productType.name', 'productType.code', 'productType']),
    getFirstDefined(item, ['transactionType.description', 'transactionType.name', 'transactionType.code', 'transactionType']),
    getFirstDefined(item, ['captureType.description', 'captureType.name', 'captureType.code', 'captureType']),
    getFirstDefined(item, ['kind', 'type', 'subType', 'cardType']),
    getFirstDefined(item, ['typeCode']),
    getFirstDefined(item, ['brandName', 'brandDescription', 'brandCodeDescription']),
    getFirstDefined(item, ['cardBrand.description', 'cardBrand.name'])
  ].filter(Boolean).join(' '))

  if (
    texto.includes('VOUCHER')
    || texto.includes('BENEF')
    || texto.includes('ALIMENTA')
    || texto.includes('REFEICAO')
    || texto.includes('PAT')
    || texto.includes('VENDAS FULL')
    || texto.includes('VENDA FULL')
  ) {
    return true
  }

  const brandCode = getBrandCodeFromItem(item)
  if (isVoucherBrandCode(brandCode)) {
    return true
  }

  return isVoucherIssuerName(texto)
}

const normalizeNetworkBrandName = (value) => {
  const texto = normalizeTextKey(value)
  if (!texto) return ''
  if (texto.includes('MASTER')) return 'MASTERCARD'
  if (texto.includes('VISA')) return 'VISA'
  if (texto.includes('AMEX') || texto.includes('AMERICAN')) return 'AMEX'
  if (texto.includes('DINERS')) return 'DINERS CLUB'
  if (texto.includes('JCB')) return 'JCB'
  if (texto.includes('DISCOVER')) return 'DISCOVER'
  if (texto.includes('AURA')) return 'AURA'
  if (texto.includes('CABAL')) return 'CABAL'
  if (texto.includes('HIPER')) return 'HIPERCARD'
  if (texto.includes('ELO')) return 'ELO'
  return texto
}

const resolverBandeira = (item) => {
  if (isPixTransaction(item)) {
    return 'PIX'
  }

  const cardBrandName = getNormalizedDisplayValue(getFirstDefined(item, [
    'cardBrand.description',
    'cardBrand.name',
    'cardBrand'
  ]))

  if (cardBrandName && !/^\d+$/.test(cardBrandName) && !isVoucherIssuerName(cardBrandName)) {
    return normalizeNetworkBrandName(cardBrandName)
  }

  const brandName = getNormalizedDisplayValue(getFirstDefined(item, [
    'brandName',
    'brandName.description',
    'brandDescription',
    'brand.description',
    'brand.name',
    'brand'
  ]))

  if (brandName && !/^\d+$/.test(brandName) && !isVoucherIssuerName(brandName)) {
    return normalizeNetworkBrandName(brandName)
  }

  if (brandName.includes('AMEX') || brandName.includes('AMERICAN')) {
    return 'AMEX'
  }

  if (brandName.includes('HIPER')) {
    return 'HIPERCARD'
  }

  const brandCodeDescription = getNormalizedDisplayValue(getFirstDefined(item, [
    'brandCodeDescription'
  ]))

  if (brandCodeDescription && !/^\d+$/.test(brandCodeDescription) && !isVoucherIssuerName(brandCodeDescription)) {
    return normalizeNetworkBrandName(brandCodeDescription)
  }

  const queryBrandName = getNormalizedDisplayValue(getFirstDefined(item, [
    '__consultaRede.brandName'
  ]))

  if (queryBrandName && !isVoucherIssuerName(queryBrandName)) {
    return normalizeNetworkBrandName(queryBrandName)
  }

  const brandCode = getBrandCodeFromItem(item)

  if (BRAND_CODE_MAP[brandCode]) {
    return BRAND_CODE_MAP[brandCode]
  }

  if (isVoucherIssuerName(brandName) || isVoucherIssuerName(cardBrandName)) {
    return brandCode || '-'
  }

  return normalizeNetworkBrandName(brandName || brandCode || queryBrandName || '-')
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
    'captureType',
    '__consultaRede.modalidade'
  ]))

  const texto = normalizeTextKey(rawModalidade)

  if (isPixTransaction(item, rawModalidade)) {
    return 'PIX'
  }

  if (isVoucherTransaction(item, rawModalidade)) {
    return 'VOUCHER'
  }

  if (MODALIDADE_CODE_MAP[texto]) {
    return Number(numeroParcelas) > 1 && texto !== '1'
      ? 'PARCELADO'
      : MODALIDADE_CODE_MAP[texto]
  }

  if (texto.includes('DEBIT')) return 'DEBITO'
  if (texto.includes('PARCEL')) return 'CREDITO'
  if (texto.includes('INSTALLMENT')) return 'CREDITO'
  if (texto.includes('CRED')) return 'CREDITO'
  if (Number(numeroParcelas) > 1) return 'CREDITO'

  if (texto === 'POS' || texto === 'TEF' || texto === '[OBJECT OBJECT]' || !texto) {
    return 'CREDITO'
  }

  return texto
}

const resolverGrupoImportacao = ({ item, bandeira, modalidade }) => {
  const bandeiraConsulta = getNormalizedDisplayValue(getFirstDefined(item, [
    '__consultaRede.brandName',
    '__consultaRede.brandCode'
  ]))
  const modalidadeConsulta = normalizeModalidadeConsulta(getFirstDefined(item, [
    '__consultaRede.modalidade'
  ]))

  const bandeiraResolvida = normalizeTextKey(bandeira)
  const modalidadeResolvida = normalizeTextKey(modalidade)

  const tituloBandeira = isMeaningfulDisplayValue(bandeiraResolvida)
    ? bandeiraResolvida
    : (bandeiraConsulta || 'SEM BANDEIRA')
  const tituloModalidade = isMeaningfulDisplayValue(modalidadeResolvida)
    ? modalidadeResolvida
    : (modalidadeConsulta || 'SEM MODALIDADE')

  return `${tituloBandeira} ${tituloModalidade}`.trim()
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

    const ehVoucher = isVoucherTransaction(item)
    const modalidade = resolverModalidade(item, numeroParcelas)
    const bandeira = resolverBandeira(item)
    const grupoImportacao = resolverGrupoImportacao({
      item,
      bandeira,
      modalidade
    })

    return {
      id: getFirstDefined(item, ['saleSummaryNumber', 'id', 'nsu', 'tid']) || `venda-api-rede-${index + 1}`,
      data_venda: normalizeDate(getFirstDefined(item, ['movementDate', 'saleDate', 'transactionDate', 'captureDate'])),
      modalidade,
      nsu: getFirstDefined(item, ['nsu', 'salesSummaryNumber', 'saleSummaryNumber']) || '-',
      numero_lote_pagamento: getFirstDefined(item, [
        'paymentBatchNumber',
        'paymentLotNumber',
        'lotNumber',
        'batchNumber',
        'paymentOrderNumber',
        'paymentOrderId',
        'paymentSummaryNumber',
        'creditOrderNumber',
        'creditOrderId'
      ]) || null,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      taxa_mdr: taxaMdr,
      despesa_mdr: despesaMdr,
      parcela_atual: getFirstDefined(item, ['installmentNumber', 'currentInstallment']) || null,
      numero_parcelas: numeroParcelas,
      bandeira,
      valor_antecipacao: valorAntecipacao || null,
      despesa_antecipacao: despesaAntecipacao || null,
      valor_liquido_antecipacao: valorLiquidoAntecipacao || null,
      previsao_pgto: normalizeDate(getFirstDefined(item, ['paymentDate', 'liquidationDate', 'creditDate'])),
      grupo_importacao: grupoImportacao,
      grupo_importacao_ordem: toNumber(getFirstDefined(item, ['__consultaRede.order'])) || Number.MAX_SAFE_INTEGER,
      consulta_bandeira: getFirstDefined(item, ['__consultaRede.brandName']) || null,
      consulta_brand_code: getFirstDefined(item, ['__consultaRede.brandCode']) || null,
      consulta_modalidade: getFirstDefined(item, ['__consultaRede.modalidade']) || null,
      eh_voucher: ehVoucher,
      json_original: item,
      adquirente,
      empresa,
      matriz,
      ec
    }
  }).filter((item) => {
    return (
      item.modalidade === 'DEBITO'
      || item.modalidade === 'CREDITO'
      || item.modalidade === 'VOUCHER'
      || item.modalidade === 'PIX'
    )
  }).map(({ eh_voucher, ...item }) => item)
}
