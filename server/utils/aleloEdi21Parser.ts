export type AleloEdiFileType = '01' | '02' | '04' | '05' | '06'
export type AleloPaymentStatus = '001' | '003' | '004' | '005' | string

export interface AleloEdiHeader {
  groupingId: string
  processingDate: string
  initialPeriod: string
  finalPeriod: string
  generationType: 'D' | 'R' | string
  sequence: string
  acquiringCompany: 'ALELO' | 'NAIP' | string
  fileType: AleloEdiFileType
  mailbox: string
  layoutVersion: string
  cnpj: string
}

export interface AleloMovement {
  paymentKey: string
  paymentMatrix: string
  merchantId: string
  cnpjRoot: string
  movementType: string
  adjustmentOrigin: string
  compensationId: string
  processingDate: string
  expectedProcessingDate: string
  transactionDate: string
  transactionTime: string
  expectedPaymentDate: string
  grossValue: number
  netValue: number
  administrationFeeValue: number
  administrationFeePercentage: number
  administrationTariffValue: number
  productCode: string
  captureType: string
  captureMethod: string
  brandCode: string
  cardEntryMode: string
  maskedCard: string
  terminalNumber: string
  authorizationCode: string
  nsuDoc: string
  bank: string
  agency: string
  account: string
  movementId: string
  psr: string
}

export interface AleloPayment {
  merchantId: string
  cnpjRoot: string
  paymentMatrix: string
  paymentKey: string
  paymentType: string
  status: AleloPaymentStatus
  rejectionReason: string
  resent: boolean
  originalPaymentDate: string
  paymentDate: string
  bankSubmissionDate: string
  paymentValue: number
  anticipationOperationNumber: string
  anticipationNetValue: number
  anticipationDiscountValue: number
  bank: string
  agency: string
  account: string
  arvOperationType: string
  arvPaymentId: string
  statusUpdateDate: string
  unifiedPaymentId: string
}

export interface AleloMultibenefitPayment {
  paymentKey: string
  ipId: string
  merchantId: string
  cnpjRoot: string
  paymentType: string
  status: AleloPaymentStatus
  rejectionReason: string
  paymentDate: string
  paymentValue: number
  receivableUnit: string
  contractNumber: string
  bank: string
  agency: string
  account: string
  unifiedPaymentId: string
}

export interface AleloNegativeBalance {
  merchantId: string
  cnpjRoot: string
  processingDate: string
  negativeBalanceStartDate: string
  currentNegativeBalance: number
  negativeBalanceReduction: number
  previousNegativeBalance: number
  variation: string
  productCode: string
}

export interface AleloUnifiedPayment {
  cnpjRoot: string
  paymentType: string
  status: AleloPaymentStatus
  rejectionReason: string
  resent: boolean
  originalPaymentDate: string
  paymentDate: string
  bankSubmissionDate: string
  paymentValue: number
  bank: string
  agency: string
  account: string
  statusUpdateDate: string
  unifiedPaymentId: string
}

export interface AleloEdiTrailer {
  totalRecords: number
  totalBranches: number
}

export interface ParsedAleloEdiResult {
  header: AleloEdiHeader | null
  movements: AleloMovement[]
  payments: AleloPayment[]
  multibenefitPayments: AleloMultibenefitPayment[]
  negativeBalances: AleloNegativeBalance[]
  unifiedPayments: AleloUnifiedPayment[]
  trailer: AleloEdiTrailer | null
  totalRecords: number
}

const RECORD_LENGTH = 500

const field = (line: string, start: number, end: number) => {
  return line.slice(start - 1, end).trim()
}

const numeric = (line: string, start: number, end: number) => {
  const value = Number.parseInt(field(line, start, end), 10)
  return Number.isFinite(value) ? value : 0
}

const decimal = (line: string, signPosition: number | null, start: number, end: number) => {
  const digits = field(line, start, end).replace(/\D/g, '')
  if (!digits) return 0

  const value = Number.parseInt(digits, 10) / 1_000_000
  const sign = signPosition ? field(line, signPosition, signPosition) : '+'
  return sign === '-' ? -value : value
}

const normalizeCode = (value: string) => {
  const normalized = String(value || '').trim()
  return normalized.replace(/^0+(?=\d)/, '')
}

export class AleloEdi21Parser {
  readonly layoutId = 'alelo-edi-2.1'

  parse(fileContent: string): ParsedAleloEdiResult {
    const result: ParsedAleloEdiResult = {
      header: null,
      movements: [],
      payments: [],
      multibenefitPayments: [],
      negativeBalances: [],
      unifiedPayments: [],
      trailer: null,
      totalRecords: 0
    }

    const lines = String(fileContent || '')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)

    lines.forEach((line, index) => {
      if (line.length !== RECORD_LENGTH) {
        throw new Error(
          `Registro Alelo invalido na linha ${index + 1}: esperado ${RECORD_LENGTH} posicoes, recebido ${line.length}.`
        )
      }

      const recordType = field(line, 1, 2)

      switch (recordType) {
        case '00':
          result.header = this.parseHeader(line)
          break
        case '01':
          result.movements.push(this.parseMovement(line))
          break
        case '02':
          result.payments.push(this.parsePayment(line))
          break
        case '03':
          result.multibenefitPayments.push(this.parseMultibenefitPayment(line))
          break
        case '05':
          result.negativeBalances.push(this.parseNegativeBalance(line))
          break
        case '06':
          result.unifiedPayments.push(this.parseUnifiedPayment(line))
          break
        case '99':
          result.trailer = this.parseTrailer(line)
          break
        default:
          throw new Error(`Tipo de registro Alelo desconhecido na linha ${index + 1}: ${recordType || '(vazio)'}.`)
      }
    })

    if (!result.header) {
      throw new Error('Arquivo Alelo invalido: registro header 00 nao encontrado.')
    }

    result.totalRecords = result.movements.length
      + result.payments.length
      + result.multibenefitPayments.length
      + result.negativeBalances.length
      + result.unifiedPayments.length

    return result
  }

  private parseHeader(line: string): AleloEdiHeader {
    return {
      groupingId: field(line, 3, 17),
      processingDate: field(line, 18, 25),
      initialPeriod: field(line, 26, 33),
      finalPeriod: field(line, 34, 41),
      generationType: field(line, 42, 42),
      sequence: field(line, 43, 49),
      acquiringCompany: field(line, 50, 54).toUpperCase(),
      fileType: field(line, 55, 56) as AleloEdiFileType,
      mailbox: field(line, 57, 106),
      layoutVersion: field(line, 107, 111),
      cnpj: field(line, 112, 125)
    }
  }

  private parseMovement(line: string): AleloMovement {
    return {
      paymentKey: field(line, 3, 32),
      paymentMatrix: field(line, 33, 47),
      merchantId: field(line, 48, 62),
      cnpjRoot: field(line, 63, 70),
      movementType: normalizeCode(field(line, 71, 73)).padStart(2, '0'),
      adjustmentOrigin: normalizeCode(field(line, 74, 79)).padStart(2, '0'),
      compensationId: field(line, 80, 94),
      processingDate: field(line, 95, 102),
      expectedProcessingDate: field(line, 103, 110),
      transactionDate: field(line, 111, 118),
      transactionTime: field(line, 119, 124),
      expectedPaymentDate: field(line, 125, 132),
      grossValue: decimal(line, 133, 134, 146),
      netValue: decimal(line, 147, 148, 160),
      administrationFeeValue: decimal(line, 161, 162, 174),
      administrationFeePercentage: decimal(line, null, 175, 187),
      administrationTariffValue: decimal(line, null, 188, 200),
      productCode: normalizeCode(field(line, 201, 204)),
      captureType: field(line, 205, 206),
      captureMethod: field(line, 207, 208),
      brandCode: field(line, 209, 211),
      cardEntryMode: field(line, 212, 214),
      maskedCard: field(line, 215, 233),
      terminalNumber: field(line, 234, 241),
      authorizationCode: field(line, 242, 249),
      nsuDoc: field(line, 250, 255),
      bank: field(line, 256, 259),
      agency: field(line, 260, 264),
      account: field(line, 265, 278),
      movementId: field(line, 279, 296),
      psr: field(line, 297, 299)
    }
  }

  private parsePayment(line: string): AleloPayment {
    return {
      merchantId: field(line, 3, 17),
      cnpjRoot: field(line, 18, 25),
      paymentMatrix: field(line, 26, 40),
      paymentKey: field(line, 41, 70),
      paymentType: field(line, 71, 71),
      status: field(line, 72, 74),
      rejectionReason: field(line, 75, 79),
      resent: field(line, 80, 80).toUpperCase() === 'S',
      originalPaymentDate: field(line, 81, 88),
      paymentDate: field(line, 89, 96),
      bankSubmissionDate: field(line, 97, 104),
      paymentValue: decimal(line, 105, 106, 123),
      anticipationOperationNumber: field(line, 124, 132),
      anticipationNetValue: decimal(line, 133, 134, 151),
      anticipationDiscountValue: decimal(line, null, 152, 169),
      bank: field(line, 170, 173),
      agency: field(line, 174, 178),
      account: field(line, 179, 192),
      arvOperationType: field(line, 193, 196),
      arvPaymentId: field(line, 197, 208),
      statusUpdateDate: field(line, 209, 216),
      unifiedPaymentId: field(line, 217, 228)
    }
  }

  private parseMultibenefitPayment(line: string): AleloMultibenefitPayment {
    return {
      paymentKey: field(line, 3, 32),
      ipId: field(line, 33, 62),
      merchantId: field(line, 63, 77),
      cnpjRoot: field(line, 78, 85),
      paymentType: field(line, 86, 87),
      status: field(line, 88, 90),
      rejectionReason: field(line, 91, 95),
      paymentDate: field(line, 96, 103),
      paymentValue: decimal(line, 104, 105, 122),
      receivableUnit: field(line, 123, 172),
      contractNumber: field(line, 173, 222),
      bank: field(line, 223, 226),
      agency: field(line, 227, 231),
      account: field(line, 232, 245),
      unifiedPaymentId: field(line, 246, 257)
    }
  }

  private parseNegativeBalance(line: string): AleloNegativeBalance {
    return {
      merchantId: field(line, 48, 62),
      cnpjRoot: field(line, 63, 70),
      processingDate: field(line, 95, 102),
      negativeBalanceStartDate: field(line, 125, 132),
      currentNegativeBalance: decimal(line, 133, 134, 146),
      negativeBalanceReduction: decimal(line, 147, 148, 160),
      previousNegativeBalance: decimal(line, 161, 162, 174),
      variation: field(line, 175, 187),
      productCode: normalizeCode(field(line, 201, 204))
    }
  }

  private parseUnifiedPayment(line: string): AleloUnifiedPayment {
    return {
      cnpjRoot: field(line, 18, 25),
      paymentType: field(line, 71, 71),
      status: field(line, 72, 74),
      rejectionReason: field(line, 75, 79),
      resent: field(line, 80, 80).toUpperCase() === 'S',
      originalPaymentDate: field(line, 81, 88),
      paymentDate: field(line, 89, 96),
      bankSubmissionDate: field(line, 97, 104),
      paymentValue: decimal(line, 105, 106, 123),
      bank: field(line, 170, 173),
      agency: field(line, 174, 178),
      account: field(line, 179, 192),
      statusUpdateDate: field(line, 209, 216),
      unifiedPaymentId: field(line, 217, 228)
    }
  }

  private parseTrailer(line: string): AleloEdiTrailer {
    return {
      totalRecords: numeric(line, 3, 13),
      totalBranches: numeric(line, 14, 19)
    }
  }
}
