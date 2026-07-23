import { AUTORIZADA_MANUAL_BANDEIRAS } from './constants'

export const round2Autorizada = (value) => {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return 0
  return Math.round((number + Number.EPSILON) * 100) / 100
}

export const criarLinhaAutorizadaInicial = (bandeira) => ({
  bandeira,
  debito: 0,
  credito: 0,
  credito2x: 0,
  credito3x: 0,
  voucher: 0,
  despesa_mdr: 0,
  valor_bruto: 0,
  valor_liquido: 0,
  _debito_input: '0,00',
  _credito_input: '0,00',
  _credito2x_input: '0,00',
  _credito3x_input: '0,00',
  _voucher_input: '0,00',
  _despesa_mdr_input: '0,00',
  _snapshot: null,
  _records_by_modalidade: {},
  status: 'pending'
})

export const criarLinhasAutorizadaInicial = () => AUTORIZADA_MANUAL_BANDEIRAS.map(({ chave }) => criarLinhaAutorizadaInicial(chave))

export const formatBRLNumberAutorizada = (value) => new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(round2Autorizada(value))

export const sincronizarInputsLinhaAutorizada = (linha) => {
  linha._debito_input = formatBRLNumberAutorizada(linha.debito)
  linha._credito_input = formatBRLNumberAutorizada(linha.credito)
  linha._credito2x_input = formatBRLNumberAutorizada(linha.credito2x)
  linha._credito3x_input = formatBRLNumberAutorizada(linha.credito3x)
  linha._voucher_input = formatBRLNumberAutorizada(linha.voucher)
  linha._despesa_mdr_input = formatBRLNumberAutorizada(linha.despesa_mdr)
  return linha
}

export const parseBRLAutorizada = (value) => {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const raw = String(value).trim()
  if (!raw) return 0

  const normalized = raw
    .replace(/\s/g, '')
    .replace(/[^0-9,.-]/g, '')

  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? round2Autorizada(parsed) : 0
}

export const recalcularLinhaAutorizada = (linha, options = {}) => {
  const { sincronizarInputs = true } = options
  const bruto = round2Autorizada(
    Number(linha.debito || 0) +
    Number(linha.credito || 0) +
    Number(linha.credito2x || 0) +
    Number(linha.credito3x || 0) +
    Number(linha.voucher || 0)
  )
  const liquido = round2Autorizada(bruto - Number(linha.despesa_mdr || 0))

  linha.valor_bruto = bruto
  linha.valor_liquido = liquido
  if (sincronizarInputs) sincronizarInputsLinhaAutorizada(linha)
  return linha
}

export const criarSnapshotLinhaAutorizada = (linha) => ({
  debito: round2Autorizada(linha.debito),
  credito: round2Autorizada(linha.credito),
  credito2x: round2Autorizada(linha.credito2x),
  credito3x: round2Autorizada(linha.credito3x),
  voucher: round2Autorizada(linha.voucher),
  despesa_mdr: round2Autorizada(linha.despesa_mdr)
})

export const sincronizarSnapshotLinhaAutorizada = (linha) => {
  linha._snapshot = criarSnapshotLinhaAutorizada(linha)
  return linha
}

export const linhaAutorizadaTemAlteracao = (linha) => {
  const snapshot = linha?._snapshot || {}
  return (
    round2Autorizada(linha?.debito) !== round2Autorizada(snapshot.debito) ||
    round2Autorizada(linha?.credito) !== round2Autorizada(snapshot.credito) ||
    round2Autorizada(linha?.credito2x) !== round2Autorizada(snapshot.credito2x) ||
    round2Autorizada(linha?.credito3x) !== round2Autorizada(snapshot.credito3x) ||
    round2Autorizada(linha?.voucher) !== round2Autorizada(snapshot.voucher) ||
    round2Autorizada(linha?.despesa_mdr) !== round2Autorizada(snapshot.despesa_mdr)
  )
}
