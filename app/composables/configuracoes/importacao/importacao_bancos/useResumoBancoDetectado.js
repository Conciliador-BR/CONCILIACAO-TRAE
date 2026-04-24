export const detectarBancoResumo = (bancoOriginal) => {
  const banco = String(bancoOriginal || '').toLowerCase()
  if (banco.includes('sicoob')) return 'sicoob'
  if (banco.includes('bradesco')) return 'bradesco'
  if (banco.includes('tribanco')) return 'tribanco'
  if (banco.includes('banco do brasil') || banco.includes('brasil')) return 'bb'
  if (banco.includes('itau') || banco.includes('itaú')) return 'itau'
  if (banco.includes('safra')) return 'safra'
  if (banco.includes('caixa')) return 'caixa'
  if (banco.includes('sicredi')) return 'sicredi'
  if (banco.includes('stone')) return 'stone'
  if (banco.includes('banestes')) return 'banestes'
  if (banco.includes('santander')) return 'santander'
  if (banco.includes('nordeste') || banco.includes('banco do nordeste') || banco.includes('bnb')) return 'bnb'
  return null
}
