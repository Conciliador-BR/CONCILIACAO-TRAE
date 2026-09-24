import {
  buildEdiRecebimentosFromParsedFiles,
  buildEdiVendasFromParsedFiles,
  type ParsedEdiSourceFile
} from './ediImportBuilders'
import type { EdiTransaction } from './edi.types'

type BuildInput = {
  files: ParsedEdiSourceFile[]
  empresa: string
  ec: string
}

const normalizeCompactDate = (value?: string) => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length === 8 ? digits : ''
}

const getTransactionDates = (transaction: EdiTransaction) => {
  return {
    batchDate: normalizeCompactDate(transaction.dataLote),
    saleDate: normalizeCompactDate(transaction.dataTransacao),
    paymentDate: normalizeCompactDate(transaction.dataPagamento)
  }
}

const isUpBrasilSale = ({ transaction }: { transaction: EdiTransaction }) => {
  const { batchDate, saleDate, paymentDate } = getTransactionDates(transaction)

  return Boolean(
    batchDate
    && saleDate === batchDate
    && paymentDate > batchDate
  )
}

const isUpBrasilReceipt = ({ transaction }: { transaction: EdiTransaction }) => {
  const { batchDate, saleDate, paymentDate } = getTransactionDates(transaction)

  return Boolean(
    batchDate
    && saleDate
    && saleDate < batchDate
    && paymentDate === batchDate
  )
}

export const buildUpbrasilVendasFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiVendasFromParsedFiles({
    files,
    empresa,
    ec,
    adquirente: 'upbrasil',
    adquirenteLabel: 'UP BRASIL',
    transactionFilter: isUpBrasilSale
  })
}

export const buildUpbrasilRecebimentosFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiRecebimentosFromParsedFiles({
    files,
    empresa,
    ec,
    adquirente: 'upbrasil',
    adquirenteLabel: 'UP BRASIL',
    transactionFilter: isUpBrasilReceipt
  })
}
