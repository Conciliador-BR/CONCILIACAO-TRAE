import {
  buildEdiRecebimentosFromParsedFiles,
  buildEdiVendasFromParsedFiles,
  type ParsedEdiSourceFile
} from './ediImportBuilders'
import type { EdiTransaction, ParsedEdiResult } from './edi.types'

type BuildInput = {
  files: ParsedEdiSourceFile[]
  empresa: string
  ec: string
}

type TransactionContext = {
  transaction: EdiTransaction
  parsed: ParsedEdiResult
  file: ParsedEdiSourceFile
}

const normalizeCompactDate = (value?: string) => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length === 8 ? digits : ''
}

const getFileIssueDate = ({ parsed, file }: Omit<TransactionContext, 'transaction'>) => {
  return normalizeCompactDate(file.referenceDate)
    || normalizeCompactDate(parsed.header?.dataGeracao)
}

const isBatchDate = (transaction: EdiTransaction, expectedDate: string) => {
  const batchDate = normalizeCompactDate(transaction.dataLote)
  return !batchDate || batchDate === expectedDate
}

const isLecardSale = ({ transaction, parsed, file }: TransactionContext) => {
  const issueDate = getFileIssueDate({ parsed, file })
  const saleDate = normalizeCompactDate(transaction.dataTransacao)
  const paymentDate = normalizeCompactDate(transaction.dataPagamento)

  return Boolean(
    issueDate
    && saleDate === issueDate
    && paymentDate > issueDate
    && isBatchDate(transaction, issueDate)
  )
}

const isLecardReceipt = ({ transaction, parsed, file }: TransactionContext) => {
  const issueDate = getFileIssueDate({ parsed, file })
  const saleDate = normalizeCompactDate(transaction.dataTransacao)
  const paymentDate = normalizeCompactDate(transaction.dataPagamento)

  return Boolean(
    issueDate
    && saleDate
    && saleDate < issueDate
    && paymentDate === issueDate
    && isBatchDate(transaction, saleDate)
  )
}

export const buildLecardVendasFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiVendasFromParsedFiles({
    files,
    empresa,
    ec,
    adquirente: 'lecard',
    adquirenteLabel: 'LECARD',
    transactionFilter: isLecardSale
  })
}

export const buildLecardRecebimentosFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiRecebimentosFromParsedFiles({
    files,
    empresa,
    ec,
    adquirente: 'lecard',
    adquirenteLabel: 'LECARD',
    transactionFilter: isLecardReceipt
  })
}
