import type { IEdiLayoutParser } from './edi.types'
import { SoftwareExpress16bParser } from './softwareExpress16bParser'
import { SoftwareExpress17dParser } from './softwareExpress17dParser'
import { SoftwareExpress17dEd15Parser } from './softwareExpress17dEd15Parser'

export const normalizeAcquirerId = (acquirerId: string) => {
  return String(acquirerId || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

export const ACQUIRER_LAYOUT_MAP: Record<string, IEdiLayoutParser> = {
  lecard: new SoftwareExpress17dEd15Parser(),
  comprocard: new SoftwareExpress17dParser(),
  up_brasil: new SoftwareExpress16bParser(),
  upbrasil: new SoftwareExpress16bParser(),
  policard: new SoftwareExpress16bParser(),
  algorix: new SoftwareExpress17dEd15Parser()
}
