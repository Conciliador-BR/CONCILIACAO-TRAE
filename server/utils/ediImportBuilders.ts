import { EdiReaderService } from './ediReaderService'
import type { EdiTransaction, ParsedEdiResult } from './edi.types'

export type ParsedEdiSourceFile = {
  fileName: string
  content: string
  referenceDate?: string
  modifiedAt?: string
}

type BuildParsedFilesInput = {
  files: ParsedEdiSourceFile[]
  empresa: string
  ec: string
  adquirente: string
  adquirenteLabel: string
  transactionFilter?: (context: {
    transaction: EdiTransaction
    parsed: ParsedEdiResult
    file: ParsedEdiSourceFile
  }) => boolean
}

type RegistroVenda = {
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

type RegistroRecebimento = {
  adquirente: string
  nsu: string
  data_venda: string | null
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

type BuildResult<TRegistro> = {
  totalArquivosProcessados: number
  totalRegistros: number
  arquivosComRegistros: string[]
  registros: TRegistro[]
}

const ediReaderService = new EdiReaderService()

const formatIsoDisplayDate = (isoDate: string | null) => {
  if (!isoDate) return ''

  const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return ''

  return `${match[3]}/${match[2]}/${match[1]}`
}

const parseCompactDate = (value?: string) => {
  const text = String(value || '').trim()
  if (!/^\d{8}$/.test(text)) return null

  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
}

const isMeaningfulNsu = (value?: string) => {
  const normalized = String(value || '').trim().replace(/[^a-z0-9]/gi, '')
  return normalized.length > 0 && !/^0+$/.test(normalized)
}

const getTransactionNsu = (transaction: EdiTransaction) => {
  const candidates = [transaction.nsuHost, transaction.nsuHostParcela]
  const meaningfulNsu = candidates.find(isMeaningfulNsu)

  return String(meaningfulNsu || candidates.find((value) => String(value || '').trim()) || '').trim()
}

const getTransactionModalidade = (transaction: EdiTransaction) => {
  const tipoProduto = String(transaction.tipoProduto || '').trim().toUpperCase()

  switch (tipoProduto) {
    case 'C':
      return 'CREDITO'
    case 'D':
      return 'DEBITO'
    case 'V':
      return 'VOUCHER'
    case 'P':
      return 'PRE_PAGO'
    default:
      return tipoProduto || 'VOUCHER'
  }
}

const buildFinancialValues = (transaction: EdiTransaction) => {
  const valorBruto = Number(transaction.valorBruto || 0)
  const valorLiquido = Number(transaction.valorLiquido || 0)
  const despesa = Math.max(0, valorBruto - valorLiquido)

  return {
    valorBruto,
    valorLiquido,
    despesa
  }
}

const buildVendaRecord = ({
  transaction,
  empresa,
  ec,
  adquirenteLabel,
  fileName
}: {
  transaction: EdiTransaction
  empresa: string
  ec: string
  adquirenteLabel: string
  fileName: string
}): RegistroVenda => {
  const dataVenda = parseCompactDate(transaction.dataTransacao)
  const previsaoPgto = parseCompactDate(transaction.dataPagamento)
  const modalidade = getTransactionModalidade(transaction)
  const { valorBruto, valorLiquido, despesa } = buildFinancialValues(transaction)

  return {
    adquirente: adquirenteLabel,
    bandeira: String(transaction.codigoBandeira || adquirenteLabel).trim() || adquirenteLabel,
    modalidade,
    nsu: getTransactionNsu(transaction),
    data_venda: dataVenda,
    data_venda_text: formatIsoDisplayDate(dataVenda),
    previsao_pgto: previsaoPgto,
    previsao_pgto_text: formatIsoDisplayDate(previsaoPgto),
    valor_bruto: valorBruto,
    despesa,
    despesa_mdr: despesa,
    valor_liquido: valorLiquido,
    empresa,
    ec,
    matriz: ec,
    arquivo_origem: fileName
  }
}

const buildRecebimentoRecord = ({
  transaction,
  empresa,
  ec,
  adquirenteLabel,
  fileName
}: {
  transaction: EdiTransaction
  empresa: string
  ec: string
  adquirenteLabel: string
  fileName: string
}): RegistroRecebimento => {
  const dataVenda = parseCompactDate(transaction.dataTransacao)
  const dataPagamento = parseCompactDate(transaction.dataPagamento)
  const modalidade = getTransactionModalidade(transaction)
  const { valorBruto, valorLiquido, despesa } = buildFinancialValues(transaction)

  return {
    adquirente: adquirenteLabel,
    nsu: getTransactionNsu(transaction),
    data_venda: dataVenda,
    data_recebimento: dataPagamento,
    data_pgto: dataPagamento,
    modalidade,
    valor_bruto: valorBruto,
    despesa,
    despesa_mdr: despesa,
    valor_liquido: valorLiquido,
    empresa,
    ec,
    matriz: ec,
    arquivo_origem: fileName
  }
}

export const buildEdiVendasFromParsedFiles = async ({
  files,
  empresa,
  ec,
  adquirente,
  adquirenteLabel,
  transactionFilter
}: BuildParsedFilesInput): Promise<BuildResult<RegistroVenda>> => {
  const registros: RegistroVenda[] = []
  const arquivosComRegistros: string[] = []

  for (const file of files || []) {
    const parsed = ediReaderService.parseFile(file.content, adquirente)
    const currentRecords = parsed.transacoes
      .filter((transaction) => !transactionFilter || transactionFilter({ transaction, parsed, file }))
      .map((transaction) => {
        return buildVendaRecord({
          transaction,
          empresa,
          ec,
          adquirenteLabel,
          fileName: file.fileName
        })
      })

    if (currentRecords.length > 0) {
      arquivosComRegistros.push(file.fileName)
      registros.push(...currentRecords)
    }
  }

  return {
    totalArquivosProcessados: (files || []).length,
    totalRegistros: registros.length,
    arquivosComRegistros,
    registros
  }
}

export const buildEdiRecebimentosFromParsedFiles = async ({
  files,
  empresa,
  ec,
  adquirente,
  adquirenteLabel,
  transactionFilter
}: BuildParsedFilesInput): Promise<BuildResult<RegistroRecebimento>> => {
  const registros: RegistroRecebimento[] = []
  const arquivosComRegistros: string[] = []

  for (const file of files || []) {
    const parsed = ediReaderService.parseFile(file.content, adquirente)
    const currentRecords = parsed.transacoes
      .filter((transaction) => !transactionFilter || transactionFilter({ transaction, parsed, file }))
      .map((transaction) => {
        return buildRecebimentoRecord({
          transaction,
          empresa,
          ec,
          adquirenteLabel,
          fileName: file.fileName
        })
      })

    if (currentRecords.length > 0) {
      arquivosComRegistros.push(file.fileName)
      registros.push(...currentRecords)
    }
  }

  return {
    totalArquivosProcessados: (files || []).length,
    totalRegistros: registros.length,
    arquivosComRegistros,
    registros
  }
}
