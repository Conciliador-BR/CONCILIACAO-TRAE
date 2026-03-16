export const VOUCHERS_FIXOS = [
  'ALELO',
  'TICKET',
  'VR',
  'SODEXO',
  'PLUXE',
  'COMPROCARD',
  'LE CARD',
  'UP BRASIL',
  'ECX CARD',
  'FN CARD',
  'BEN VISA',
  'CREDSHOP',
  'RC CARD',
  'GOOD CARD',
  'BIG CARD',
  'BK CARD',
  'GREEN CARD',
  'BRASILCARD',
  'BOLT CARD',
  'CABAL',
  'VEROCARD',
  'FACECARD',
  'VALE CARD',
  'NAIP'
]

export const ALIASES_TABELA_POR_VOUCHER = {
  TICKET: ['TICKET SERVICOS SA', 'TICKET SERVICOS'],
  VR: ['VR BENEFICIOS', 'VR BENEF'],
  PLUXE: ['PLUXEE', 'PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR'],
  ALELO: ['ALELO INSTITUICAO DE PAGAMENTO', 'RECEBIMENTO ALELO'],
  'LE CARD': ['LE CARD ADMINISTRADORA', 'LECARD'],
  'UP BRASIL': ['UP BRASIL ADMINISTRACAO']
}

export const getOperadorasParaTabela = (voucherNome) => {
  const key = String(voucherNome || '').toUpperCase().trim()
  const aliases = ALIASES_TABELA_POR_VOUCHER[key] || []
  return [voucherNome, ...aliases].filter(Boolean)
}
