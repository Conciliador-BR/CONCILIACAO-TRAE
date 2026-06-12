const BRAND_CODE_MAP = {
  '1': 'VISA',
  '2': 'MASTERCARD',
  '3': 'AMEX',
  '14': 'ELO',
  '15': 'HIPERCARD',
  '16': 'ALELO',
  '17': 'TICKET',
  '18': 'SODEXO',
  '19': 'VR',
  '20': 'PLUXEE',
  '21': 'VR',
  '37': 'LECARD',
  '52': 'TICKET'
}

const getFirstDefined = (item, paths = []) => {
  for (const path of paths) {
    const value = String(path || '')
      .split('.')
      .reduce((acc, key) => (acc == null ? undefined : acc[key]), item)

    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return null
}

const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .replace(/R\$/gi, '')
      .replace(/\s+/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.')

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeTextKey = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

const normalizeDate = (value) => {
  if (!value) return null

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(excelEpoch.getTime() + Math.round(value) * 86400000)
    return date.toISOString().slice(0, 10)
  }

  const text = String(value).trim()
  const first = text.split(/[T\s]+/)[0]

  if (/^\d{4}-\d{2}-\d{2}$/.test(first)) return first

  let match = first.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month}-${day}`
  }

  match = first.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (match) {
    const [, year, month, day] = match
    return `${year}-${month}-${day}`
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const resolveBrandName = (item) => {
  const explicitName = normalizeTextKey(getFirstDefined(item, [
    'brandName',
    'brandDescription',
    'brandCodeDescription',
    'brand',
    'cardBrand.name',
    'cardBrand.description'
  ]))

  if (explicitName) return explicitName

  const brandCode = String(getFirstDefined(item, [
    'brandCode',
    'cardBrand.code',
    'cardBrand.id'
  ]) || '').trim()

  return BRAND_CODE_MAP[brandCode] || (brandCode ? `BANDEIRA ${brandCode}` : '-')
}

const resolveModalidade = (item, numeroParcelas = 1) => {
  const rawModalidade = normalizeTextKey(getFirstDefined(item, [
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
    'kind',
    'type'
  ]))

  if (rawModalidade.includes('PIX') || rawModalidade.includes('QR CODE') || rawModalidade.includes('QRCODE')) {
    return 'PIX'
  }

  if (rawModalidade.includes('VOUCHER') || rawModalidade.includes('VAN') || rawModalidade.includes('PAT') || rawModalidade.includes('BENEF')) {
    return 'VOUCHER'
  }

  if (rawModalidade.includes('DEBIT')) return 'DEBITO'
  if (rawModalidade.includes('CREDIT') || rawModalidade.includes('CREDITO')) {
    return Number(numeroParcelas) > 1 ? 'PARCELADO' : 'CREDITO'
  }

  if (Number(numeroParcelas) > 1) return 'PARCELADO'
  return rawModalidade || 'CREDITO'
}

export const buildRecebimentosImportacaoRows = ({
  payload,
  integracao,
  nomeEmpresa = '',
  matrizEmpresa = ''
}) => {
  const records = Array.isArray(payload?.request?.transactions) ? payload.request.transactions : []
  const adquirente = normalizeTextKey(integracao?.adquirente || 'REDE')
  const empresa = String(nomeEmpresa || '').trim()
  const matriz = String(matrizEmpresa || integracao?.matriz || '').trim()

  return records.map((item, index) => {
    const valorBruto = toNumber(getFirstDefined(item, [
      'grossAmount',
      'grossValue',
      'grossAmountPlanned',
      'grossPlannedAmount',
      'amount'
    ]))
    const valorLiquido = toNumber(getFirstDefined(item, [
      'netAmount',
      'liquidAmount',
      'netValue',
      'plannedAmount',
      'paymentAmount',
      'paidAmount',
      'amount'
    ]))
    const despesaMdr = Math.abs(toNumber(getFirstDefined(item, [
      'feeTotal',
      'mdrFee',
      'mdrAmount',
      'discountedAmount'
    ])))
    const descontoTotal = Math.abs(toNumber(getFirstDefined(item, [
      'discountAmount',
      'totalDiscountAmount'
    ])))
    const despesaAntecipacao = Math.max(descontoTotal - despesaMdr, 0)
    const numeroParcelas = toNumber(getFirstDefined(item, [
      'installmentQuantity',
      'installments',
      'numberOfInstallments'
    ])) || 1
    const valorPago = toNumber(getFirstDefined(item, [
      'paidAmount',
      'paymentAmount',
      'plannedAmount'
    ])) || (despesaAntecipacao > 0 ? Math.max(valorLiquido - despesaAntecipacao, 0) : valorLiquido)
    const taxaMdr = valorBruto > 0 ? despesaMdr / valorBruto : 0

    return {
      id: getFirstDefined(item, ['paymentId', 'saleSummaryNumber', 'id', 'nsu', 'tid']) || `recebimento-api-rede-${index + 1}`,
      data_venda: normalizeDate(getFirstDefined(item, ['saleDate', 'movementDate', 'transactionDate', 'captureDate'])),
      data_recebimento: normalizeDate(getFirstDefined(item, ['paymentDate', 'plannedPaymentDate', 'liquidationDate', 'creditDate', 'movementDate'])),
      modalidade: resolveModalidade(item, numeroParcelas),
      nsu: getFirstDefined(item, ['nsu', 'salesSummaryNumber', 'saleSummaryNumber', 'paymentId']) || '-',
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
      numero_parcelas: numeroParcelas,
      bandeira: resolveBrandName(item),
      valor_antecipacao: valorBruto > 0 && despesaAntecipacao > 0 ? valorBruto : toNumber(getFirstDefined(item, ['anticipatedAmount'])),
      despesa_antecipacao: despesaAntecipacao,
      valor_liquido_antecipacao: valorPago,
      adquirente,
      empresa,
      matriz,
      json_original: item
    }
  }).filter((item) => {
    return (
      item.valor_bruto !== 0
      || item.valor_liquido !== 0
      || item.despesa_mdr !== 0
      || item.despesa_antecipacao !== 0
    )
  })
}
