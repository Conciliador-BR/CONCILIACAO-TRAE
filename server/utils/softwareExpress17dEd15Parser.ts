import type {
  EdiHeader,
  EdiTransaction,
  IEdiLayoutParser,
  ParsedEdiResult
} from './edi.types'

const REGISTRO_HEADER = 'A0'
const REGISTRO_LOTE = 'L0'
const REGISTRO_VENDA = 'CV'

const sliceField = (line: string, start: number, end: number) => line.slice(start, end).trim()

const parseNumber = (value: string) => {
  const parsed = Number.parseInt(value.trim(), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseAmount = (value: string) => {
  const normalized = value.trim()
  if (!normalized) return 0

  const sign = normalized.startsWith('-') ? -1 : 1
  const digits = normalized.replace(/\D/g, '')
  if (!digits) return 0

  return sign * (Number.parseInt(digits, 10) / 100)
}

export class SoftwareExpress17dEd15Parser implements IEdiLayoutParser {
  layoutId = 'software-express-1.7d-ed1.5'

  parse(fileContent: string): ParsedEdiResult {
    const result: ParsedEdiResult = {
      header: null,
      transacoes: [],
      ajustes: [],
      totalRegistros: 0,
      totalValorCredito: 0,
      totalValorDebito: 0
    }

    const lines = String(fileContent || '')
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.trim())

    let currentBatchDate = ''

    for (const line of lines) {
      const recordType = sliceField(line, 0, 2)

      if (recordType === REGISTRO_HEADER) {
        result.header = this.parseHeader(line)
        result.totalRegistros += 1
        continue
      }

      if (recordType === REGISTRO_LOTE) {
        currentBatchDate = sliceField(line, 2, 10)
        continue
      }

      if (recordType === REGISTRO_VENDA) {
        const transaction = this.parseTransaction(line, currentBatchDate)
        result.transacoes.push(transaction)
        result.totalValorCredito += transaction.valorLiquido
        result.totalRegistros += 1
      }
    }

    return result
  }

  private parseHeader(line: string): EdiHeader {
    return {
      versaoLayout: sliceField(line, 2, 8),
      dataGeracao: sliceField(line, 8, 16),
      horaGeracao: sliceField(line, 16, 22),
      nomeAdministradora: sliceField(line, 28, 58)
    }
  }

  private parseTransaction(line: string, batchDate: string): EdiTransaction {
    return {
      cnpjLoja: sliceField(line, 2, 17),
      nsuHost: sliceField(line, 17, 29),
      dataTransacao: sliceField(line, 29, 37),
      horaTransacao: sliceField(line, 37, 43),
      tipoLancamento: parseNumber(sliceField(line, 43, 44)),
      dataPagamento: sliceField(line, 44, 52),
      dataLote: batchDate,
      tipoProduto: sliceField(line, 52, 53),
      meioCaptura: sliceField(line, 53, 54),
      valorBruto: parseAmount(sliceField(line, 54, 65)),
      valorDesconto: parseAmount(sliceField(line, 65, 76)),
      valorOutrosDescontos: parseAmount(sliceField(line, 76, 87)),
      valorLiquido: parseAmount(sliceField(line, 87, 98)),
      cartaoMascarado: sliceField(line, 98, 117),
      parcela: parseNumber(sliceField(line, 117, 119)),
      totalParcelas: parseNumber(sliceField(line, 119, 121)),
      nsuHostParcela: sliceField(line, 121, 133),
      valorBrutoParcela: parseAmount(sliceField(line, 133, 144)),
      valorDescontoParcela: parseAmount(sliceField(line, 144, 155)),
      valorOutrosDescontosParcela: parseAmount(sliceField(line, 155, 166)),
      valorLiquidoParcela: parseAmount(sliceField(line, 166, 177)),
      banco: sliceField(line, 177, 180),
      agencia: sliceField(line, 180, 186),
      contaCorrente: sliceField(line, 186, 197),
      autorizacao: sliceField(line, 197, 209),
      codigoBandeira: sliceField(line, 209, 212),
      codigoProduto: sliceField(line, 212, 215),
      idLoteAntecipado: sliceField(line, 215, 227)
    }
  }
}

export default SoftwareExpress17dEd15Parser
