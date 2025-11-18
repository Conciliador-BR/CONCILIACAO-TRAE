export const mapSenha = (senha) => {
  if (!senha) return null
  const normalizeEC = (v) => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return {
    empresa: String(senha.empresa ?? ''),
    ec: normalizeEC(senha.ec),
    adquirente: String(senha.adquirente ?? ''),
    portal: String(senha.portal ?? ''),
    banco: String(senha.banco ?? ''),
    agencia: String(senha.agencia ?? ''),
    conta: String(senha.conta ?? ''),
    login: String(senha.login ?? ''),
    senha: String(senha.senha ?? ''),
    id: Number.isFinite(Number(senha.id)) ? Number(senha.id) : undefined
  }
}

export const mapSenhaFromSupabase = (row) => {
  if (!row) return null
  return {
    id: row.id || `senha_${Date.now()}`,
    empresa: row.empresa || '',
    ec: row.ec || '',
    adquirente: row.adquirente || '',
    portal: row.portal || '',
    banco: row.banco || '',
    agencia: row.agencia || '',
    conta: row.conta || '',
    login: row.login || '',
    senha: row.senha || ''
  }
}

export const validateSenha = (senha) => {
  const errors = []
  const empresaStr = String(senha.empresa ?? '').trim()
  if (!empresaStr) errors.push('Empresa é obrigatória')
  const ecStr = String(senha.ec ?? '').trim()
  if (!ecStr) errors.push('EC é obrigatório')
  const loginStr = String(senha.login ?? '').trim()
  if (!loginStr) errors.push('Login é obrigatório')
  const senhaStr = String(senha.senha ?? '').trim()
  if (!senhaStr) errors.push('Senha é obrigatória')
  return { isValid: errors.length === 0, errors }
}

export const createEmptySenha = () => ({
  id: `senha_${Date.now()}`,
  empresa: '',
  ec: '',
  adquirente: '',
  portal: '',
  banco: '',
  agencia: '',
  conta: '',
  login: '',
  senha: ''
})