/**
 * Mapeadores para transformar dados entre o frontend e o Supabase
 */

/**
 * Normaliza valores para string, tratando arrays e valores nulos
 */
const normalizeListToString = (v) => {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.filter(Boolean).join(',')
  return String(v ?? '').trim()
}

/**
 * Mapeia um objeto senha do frontend para o formato do Supabase
 */
export const mapSenha = (senha) => {
  if (!senha) return null
  const normalizeEC = (v) => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  return {
    // Campos obrigatórios
    empresa: String(senha.empresa ?? ''),
    ec: normalizeEC(senha.ec),
    adquirente: String(senha.adquirente ?? ''),
    login: String(senha.login ?? ''),
    senha: String(senha.senha ?? ''),
    portal: String(senha.portal ?? ''),
    // Só envia id se for numérico (Supabase espera int8)
    id: Number.isFinite(Number(senha.id)) ? Number(senha.id) : undefined
  }
}

/**
 * Mapeia um registro do Supabase para o formato do frontend
 */
export const mapSenhaFromSupabase = (row) => {
  if (!row) return null

  return {
    id: row.id || `senha_${Date.now()}`,
    empresa: row.empresa || '',
    ec: row.ec || '',
    adquirente: row.adquirente || '',
    login: row.login || '',
    senha: row.senha || '',
    portal: row.portal || '',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  }
}

/**
 * Valida se uma senha tem os campos obrigatórios
 */
export const validateSenha = (senha) => {
  const errors = []
  
  const empresaStr = String(senha.empresa ?? '').trim()
  if (!empresaStr) {
    errors.push('Empresa é obrigatória')
  }
  
  const ecStr = String(senha.ec ?? '').trim()
  if (!ecStr) {
    errors.push('EC é obrigatório')
  }
  
  const adquirenteStr = String(senha.adquirente ?? '').trim()
  if (!adquirenteStr) {
    errors.push('Adquirente é obrigatório')
  }
  
  const loginStr = String(senha.login ?? '').trim()
  if (!loginStr) {
    errors.push('Login é obrigatório')
  }
  
  const senhaStr = String(senha.senha ?? '').trim()
  if (!senhaStr) {
    errors.push('Senha é obrigatória')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Cria uma senha vazia para novos registros
 */
export const createEmptySenha = () => ({
  id: `senha_${Date.now()}`,
  empresa: '',
  ec: '',
  adquirente: '',
  portal: '',
  login: '',
  senha: ''
})