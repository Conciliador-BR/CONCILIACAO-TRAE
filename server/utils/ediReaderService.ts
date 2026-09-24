import {
  ACQUIRER_LAYOUT_MAP,
  normalizeAcquirerId
} from './acquirerRegistry'
import type { IEdiLayoutParser, ParsedEdiResult } from './edi.types'

export class EdiReaderService {
  parseFile(fileContent: string, acquirerId: string): ParsedEdiResult {
    const normalizedAcquirerId = normalizeAcquirerId(acquirerId)
    const parser = ACQUIRER_LAYOUT_MAP[normalizedAcquirerId]

    if (!parser) {
      const mappedAcquirers = Object.keys(ACQUIRER_LAYOUT_MAP).sort().join(', ')
      throw new Error(
        `Layout EDI nao mapeado para a adquirente "${acquirerId}". Adquirentes disponiveis: ${mappedAcquirers}`
      )
    }

    return parser.parse(fileContent)
  }

  static registerAcquirer(acquirerId: string, parser: IEdiLayoutParser): void {
    const normalizedAcquirerId = normalizeAcquirerId(acquirerId)

    if (!normalizedAcquirerId) {
      throw new Error('Informe um identificador de adquirente valido para registrar o layout EDI.')
    }

    if (!parser || typeof parser.parse !== 'function') {
      throw new Error('Parser EDI invalido. O parser deve implementar IEdiLayoutParser.')
    }

    ACQUIRER_LAYOUT_MAP[normalizedAcquirerId] = parser
  }
}

export default EdiReaderService
