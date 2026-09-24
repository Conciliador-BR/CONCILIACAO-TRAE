import {
  AleloEdi21Parser,
  type AleloMovement,
  type AleloPayment,
  type ParsedAleloEdiResult
} from './aleloEdi21Parser'

type AleloSourceFile = {
  fileName: string
  content: string
  referenceDate?: string
  modifiedAt?: string
}

type AleloBuildInput = {
  files: AleloSourceFile[]
  empresa: string
  ec: string
}

type AleloVendaRecord = {
  adquirente: string
  bandeira: string
  modalidade: string
  nsu: string
  data_venda: string | null
  data_venda_text: string
  previsao_pgto: string | null
  previsao_pgto_text: string
  valor_bruto: number
  despesa: number
  despesa_mdr: number
  valor_liquido: number
  empresa: string
  ec: string
  matriz: string
  arquivo_origem: string
}

type AleloRecebimentoRecord = {
  adquirente: string
  nsu: string
  data_venda: null
  data_recebimento: string | null
  data_pgto: string | null
  modalidade: string
  valor_bruto: number
  despesa: number
  despesa_mdr: number
  valor_liquido: number
  empresa: string
  ec: string
  matriz: string
  arquivo_origem: string
}

type AleloBuildResult<T> = {
  totalArquivosProcessados: number
  totalRegistros: number
  arquivosComRegistros: string[]
  registros: T[]
}

const SALES_FILE_TYPES = new Set(['01', '04'])
const RECEIPT_FILE_TYPES = new Set(['02', '05'])
const EFFECTIVE_STATUS = '003'
const SPLIT_STATUS = '005'

const PRODUCT_NAMES: Record<string, string> = {
  '45': 'REFEICAO',
  '46': 'ALIMENTACAO',
  '47': 'REFEICAO',
  '48': 'ALIMENTACAO',
  '57': 'MULTIBENEFICIOS',
  '58': 'MULTIBENEFICIOS',
  '59': 'VELOE_GO',
  '60': 'NATAL',
  '61': 'CULTURA'
}

const parser = new AleloEdi21Parser()

const roundCurrency = (value: number) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

const parseCompactDate = (value: string) => {
  const date = String(value || '').trim()
  if (!/^\d{8}$/.test(date)) return null
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
}

const formatDate = (value: string | null) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}

const getAcquirer = (parsed: ParsedAleloEdiResult) => {
  const value = String(parsed.header?.acquiringCompany || '').trim().toUpperCase()
  return value === 'NAIP' ? 'NAIP' : 'ALELO'
}

const getProductName = (productCode: string) => {
  return PRODUCT_NAMES[String(productCode || '').replace(/^0+/, '')] || 'VOUCHER'
}

const buildSale = ({
  movement,
  parsed,
  file,
  empresa,
  ec
}: {
  movement: AleloMovement
  parsed: ParsedAleloEdiResult
  file: AleloSourceFile
  empresa: string
  ec: string
}): AleloVendaRecord => {
  const saleDate = parseCompactDate(movement.transactionDate)
  const expectedPaymentDate = parseCompactDate(movement.expectedPaymentDate)
  const grossValue = roundCurrency(movement.grossValue)
  const netValue = roundCurrency(movement.netValue)

  return {
    adquirente: getAcquirer(parsed),
    bandeira: getAcquirer(parsed),
    modalidade: getProductName(movement.productCode),
    nsu: movement.nsuDoc,
    data_venda: saleDate,
    data_venda_text: formatDate(saleDate),
    previsao_pgto: expectedPaymentDate,
    previsao_pgto_text: formatDate(expectedPaymentDate),
    valor_bruto: grossValue,
    despesa: roundCurrency(Math.max(0, grossValue - netValue)),
    despesa_mdr: roundCurrency(Math.abs(movement.administrationFeeValue)),
    valor_liquido: netValue,
    empresa,
    ec,
    matriz: ec,
    arquivo_origem: file.fileName
  }
}

const buildReceipt = ({
  paymentKey,
  paymentDate,
  grossValue,
  netValue,
  modalidade,
  parsed,
  file,
  empresa,
  ec
}: {
  paymentKey: string
  paymentDate: string
  grossValue: number
  netValue: number
  modalidade: string
  parsed: ParsedAleloEdiResult
  file: AleloSourceFile
  empresa: string
  ec: string
}): AleloRecebimentoRecord => {
  const normalizedPaymentDate = parseCompactDate(paymentDate)
  const normalizedGrossValue = roundCurrency(grossValue)
  const normalizedNetValue = roundCurrency(netValue)

  return {
    adquirente: getAcquirer(parsed),
    nsu: paymentKey,
    data_venda: null,
    data_recebimento: normalizedPaymentDate,
    data_pgto: normalizedPaymentDate,
    modalidade,
    valor_bruto: normalizedGrossValue,
    despesa: roundCurrency(Math.max(0, normalizedGrossValue - normalizedNetValue)),
    despesa_mdr: 0,
    valor_liquido: normalizedNetValue,
    empresa,
    ec,
    matriz: ec,
    arquivo_origem: file.fileName
  }
}

const buildEffectivePayment = (
  payment: AleloPayment,
  context: Omit<Parameters<typeof buildReceipt>[0], 'paymentKey' | 'paymentDate' | 'grossValue' | 'netValue' | 'modalidade'>,
  netValue = payment.paymentValue
) => buildReceipt({
  ...context,
  paymentKey: payment.paymentKey,
  paymentDate: payment.paymentDate,
  grossValue: payment.paymentValue,
  netValue,
  modalidade: payment.paymentType === 'A' ? 'ANTECIPACAO' : 'VOUCHER'
})

const buildEffectivePayments = (
  payments: AleloPayment[],
  context: Omit<Parameters<typeof buildReceipt>[0], 'paymentKey' | 'paymentDate' | 'grossValue' | 'netValue' | 'modalidade'>
) => {
  const effectivePayments = payments.filter(payment => payment.status === EFFECTIVE_STATUS)
  const anticipatedGroups = new Map<string, AleloPayment[]>()

  effectivePayments
    .filter(payment => payment.paymentType === 'A')
    .forEach((payment) => {
      const groupId = payment.anticipationOperationNumber || payment.arvPaymentId || payment.paymentKey
      anticipatedGroups.set(groupId, [...(anticipatedGroups.get(groupId) || []), payment])
    })

  return effectivePayments.map((payment) => {
    if (payment.paymentType !== 'A') return buildEffectivePayment(payment, context)

    const groupId = payment.anticipationOperationNumber || payment.arvPaymentId || payment.paymentKey
    const group = anticipatedGroups.get(groupId) || [payment]
    const originalTotal = group.reduce((total, item) => total + Math.abs(item.paymentValue), 0)
    const operationNetValue = Math.abs(group[0]?.anticipationNetValue || 0)
    const allocatedNetValue = originalTotal > 0 && operationNetValue > 0
      ? operationNetValue * (Math.abs(payment.paymentValue) / originalTotal)
      : payment.paymentValue

    return buildEffectivePayment(payment, context, allocatedNetValue)
  })
}

const buildSplitPayments = (
  parsed: ParsedAleloEdiResult,
  context: Omit<Parameters<typeof buildReceipt>[0], 'paymentKey' | 'paymentDate' | 'grossValue' | 'netValue' | 'modalidade'>
) => {
  return parsed.payments
    .filter(payment => payment.status === SPLIT_STATUS)
    .flatMap((payment) => {
      const details = parsed.multibenefitPayments.filter((item) => {
        return item.unifiedPaymentId === payment.unifiedPaymentId
      })
      const totalDetailed = details.reduce((total, item) => total + Math.abs(item.paymentValue), 0)
      const totalEffective = details
        .filter(item => item.status === EFFECTIVE_STATUS)
        .reduce((total, item) => total + Math.abs(item.paymentValue), 0)

      if (totalDetailed <= 0 || totalEffective <= 0) return []

      const effectiveValue = Math.abs(payment.paymentValue) * (totalEffective / totalDetailed)
      return [buildReceipt({
        ...context,
        paymentKey: payment.paymentKey,
        paymentDate: payment.paymentDate,
        grossValue: effectiveValue,
        netValue: effectiveValue,
        modalidade: 'MULTIBENEFICIOS'
      })]
    })
}

export const buildAleloVendasFromParsedFiles = async ({
  files,
  empresa,
  ec
}: AleloBuildInput): Promise<AleloBuildResult<AleloVendaRecord>> => {
  const registros: AleloVendaRecord[] = []
  const arquivosComRegistros: string[] = []

  for (const file of files || []) {
    const parsed = parser.parse(file.content)
    if (!SALES_FILE_TYPES.has(String(parsed.header?.fileType || ''))) continue

    const fileRecords = parsed.movements
      .filter(movement => movement.movementType === '01')
      .map(movement => buildSale({ movement, parsed, file, empresa, ec }))

    if (fileRecords.length > 0) {
      arquivosComRegistros.push(file.fileName)
      registros.push(...fileRecords)
    }
  }

  return {
    totalArquivosProcessados: (files || []).length,
    totalRegistros: registros.length,
    arquivosComRegistros,
    registros
  }
}

export const buildAleloRecebimentosFromParsedFiles = async ({
  files,
  empresa,
  ec
}: AleloBuildInput): Promise<AleloBuildResult<AleloRecebimentoRecord>> => {
  const registros: AleloRecebimentoRecord[] = []
  const arquivosComRegistros: string[] = []

  for (const file of files || []) {
    const parsed = parser.parse(file.content)
    if (!RECEIPT_FILE_TYPES.has(String(parsed.header?.fileType || ''))) continue

    const context = { parsed, file, empresa, ec }
    const regularPayments = buildEffectivePayments(parsed.payments, context)
    const splitPayments = buildSplitPayments(parsed, context)
    const fileRecords = [...regularPayments, ...splitPayments]

    if (fileRecords.length > 0) {
      arquivosComRegistros.push(file.fileName)
      registros.push(...fileRecords)
    }
  }

  return {
    totalArquivosProcessados: (files || []).length,
    totalRegistros: registros.length,
    arquivosComRegistros,
    registros
  }
}
