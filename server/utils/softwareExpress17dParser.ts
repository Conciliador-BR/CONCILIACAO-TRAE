import type {
  EdiAdjustment,
  EdiHeader,
  EdiTransaction,
  IEdiLayoutParser,
  ParsedEdiResult
} from './edi.types'

const REGISTRO_HEADER = 'A0'
const REGISTRO_LOTE = 'L0'
const REGISTRO_VENDA = 'CV'
const REGISTRO_AJUSTE = 'AJ'

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

const parseTipoAjuste = (value: string): EdiAdjustment['tipoAjuste'] => {
  return value.trim() === '2' ? 'DEBITO' : 'CREDITO'
}

export class SoftwareExpress17dParser implements IEdiLayoutParser {
  layoutId = 'software-express-1.7d'

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
        continue
      }

      if (recordType === REGISTRO_AJUSTE) {
        const adjustment = this.parseAdjustment(line)
        result.ajustes.push(adjustment)
        if (adjustment.tipoAjuste === 'DEBITO') {
          result.totalValorDebito += adjustment.valorLiquido
        } else {
          result.totalValorCredito += adjustment.valorLiquido
        }
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
      valorLiquido: parseAmount(sliceField(line, 76, 87)),
      cartaoMascarado: sliceField(line, 87, 106),
      parcela: parseNumber(sliceField(line, 106, 108)),
      totalParcelas: parseNumber(sliceField(line, 108, 110)),
      nsuHostParcela: sliceField(line, 110, 122),
      valorBrutoParcela: parseAmount(sliceField(line, 122, 133)),
      valorDescontoParcela: parseAmount(sliceField(line, 133, 144)),
      valorLiquidoParcela: parseAmount(sliceField(line, 144, 155)),
      banco: sliceField(line, 155, 158),
      agencia: sliceField(line, 158, 164),
      contaCorrente: sliceField(line, 164, 175),
      autorizacao: sliceField(line, 175, 187),
      codigoBandeira: sliceField(line, 187, 190),
      codigoProduto: sliceField(line, 190, 193)
    }
  }

  private parseAdjustment(line: string): EdiAdjustment {
    return {
      cnpjLoja: sliceField(line, 2, 17),
      nsuHostOriginal: sliceField(line, 17, 29),
      dataTransacaoOriginal: sliceField(line, 29, 37),
      nsuAjuste: sliceField(line, 39, 51),
      dataAjuste: sliceField(line, 51, 59),
      tipoAjuste: parseTipoAjuste(sliceField(line, 75, 76)),
      codigoAjuste: sliceField(line, 76, 79),
      descricaoMotivo: sliceField(line, 79, 109),
      valorBruto: parseAmount(sliceField(line, 109, 120)),
      valorDesconto: parseAmount(sliceField(line, 120, 131)),
      valorLiquido: parseAmount(sliceField(line, 131, 142))
    }
  }
}

export default SoftwareExpress17dParser
