export const AUTORIZADA_MANUAL_STORAGE_MARKER = 'AUTORIZADA_MANUAL'

export const AUTORIZADA_MANUAL_BANDEIRAS = [
  { chave: 'VISA', label: 'VISA' },
  { chave: 'MASTERCARD', label: 'MASTERCARD' },
  { chave: 'ELO', label: 'ELO' },
  { chave: 'AMEX', label: 'AMEX' },
  { chave: 'HIPERCARD', label: 'HIPERCARD' },
  { chave: 'BANESCARD', label: 'BANESCARD' },
  { chave: 'VISA ELECTRON', label: 'VISA ELECTRON' },
  { chave: 'MAESTRO', label: 'MAESTRO' },
  { chave: 'ELO DEBITO', label: 'ELO DEBITO' },
  { chave: 'BANESCARD DEBITO', label: 'BANESCARD DEBITO' },
  { chave: 'CABAL DEBITO', label: 'CABAL DEBITO' }
]

export const AUTORIZADA_MANUAL_COLUNAS_EDITAVEIS = [
  { chave: 'debito', label: 'Debito' },
  { chave: 'credito', label: 'Credito' },
  { chave: 'credito2x', label: 'Credito 2x' },
  { chave: 'credito3x', label: 'Credito 3x' },
  { chave: 'voucher', label: 'Voucher' },
  { chave: 'despesa_mdr', label: 'Despesa MDR' }
]

export const AUTORIZADA_MANUAL_MODALIDADES = [
  { chave: 'debito', modalidade: 'Debito', numeroParcelas: 1 },
  { chave: 'credito', modalidade: 'Credito', numeroParcelas: 1 },
  { chave: 'credito2x', modalidade: 'Credito', numeroParcelas: 2 },
  { chave: 'credito3x', modalidade: 'Credito', numeroParcelas: 3 },
  { chave: 'voucher', modalidade: 'Voucher', numeroParcelas: 1 }
]

export const AUTORIZADA_MANUAL_MODALIDADE_MAP = AUTORIZADA_MANUAL_MODALIDADES.reduce((acc, item) => {
  acc[item.chave] = item
  return acc
}, {})

export const AUTORIZADA_MANUAL_BANDEIRAS_SOMENTE_DEBITO = new Set([
  'VISA ELECTRON',
  'MAESTRO',
  'ELO DEBITO',
  'BANESCARD DEBITO',
  'CABAL DEBITO'
])

export const normalizarAutorizadaTexto = (value) => String(value || '')
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[._-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export const formatarNomeAdquirenteManual = (value) => {
  const texto = String(value || '').trim()
  if (!texto) return ''

  const normalizado = normalizarAutorizadaTexto(texto)
  const aliases = {
    PAGSEGURO: 'Pag Seguro',
    'PAG SEGURO': 'Pag Seguro'
  }

  if (aliases[normalizado]) return aliases[normalizado]

  return texto
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ')
}

export const resolverNomeTabelaAdquirenteManual = (value) => {
  const normalizado = normalizarAutorizadaTexto(value)
  const aliases = {
    PAGSEGURO: 'pagseguro',
    'PAG SEGURO': 'pagseguro',
    PAGBANK: 'pagseguro',
    'PAG BANK': 'pagseguro'
  }

  return aliases[normalizado] || value
}

export const bandeiraAceitaCampoAutorizada = (bandeira, campo) => {
  const bandeiraNormalizada = normalizarAutorizadaTexto(bandeira)
  const somenteDebito = AUTORIZADA_MANUAL_BANDEIRAS_SOMENTE_DEBITO.has(bandeiraNormalizada)

  if (campo === 'despesa_mdr') return true
  if (somenteDebito) return campo === 'debito'
  if (campo === 'debito') return false
  return true
}

export const resolverChaveModalidadeManual = (modalidade, numeroParcelas = 1, bandeira = '') => {
  const texto = normalizarAutorizadaTexto(`${modalidade || ''} ${bandeira || ''}`)
  const parcelas = Number.parseInt(numeroParcelas, 10) || 1

  if (texto.includes('VOUCHER') || texto.includes('ALIMENTACAO') || texto.includes('REFEICAO')) return 'voucher'
  if (texto.includes('DEBITO') || texto.includes('DEB') || texto.includes('DBTO')) return 'debito'
  if (parcelas === 2) return 'credito2x'
  if (parcelas === 3) return 'credito3x'
  return 'credito'
}
