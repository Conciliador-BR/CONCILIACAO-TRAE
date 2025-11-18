import { mapSenhaFromSupabase } from './mappers.js'

export const createQueryOperations = (supabase) => {
  const buscarSenhas = async (options = {}) => {
    try {
      let query = supabase.from('cadastro_senhas').select('*').order('created_at', { ascending: false, nullsFirst: false })
      if (options.empresa) query = query.eq('empresa', options.empresa)
      if (options.ec) query = query.eq('ec', options.ec)
      if (options.adquirente) query = query.eq('adquirente', options.adquirente)
      const { data, error } = await query
      if (error) throw error
      const senhas = (data || []).map(mapSenhaFromSupabase)
      return { ok: true, data: senhas, total: senhas.length }
    } catch (err) {
      return { ok: false, error: err.message || 'Erro ao buscar senhas', data: [] }
    }
  }

  const buscarSenhaPorChave = async (empresa, ec, adquirente, login) => {
    try {
      const ecMatch = Number.isFinite(Number(ec)) ? Number(ec) : String(ec ?? '')
      const { data, error } = await supabase.from('cadastro_senhas').select('*').match({ empresa: String(empresa ?? ''), ec: ecMatch, adquirente: String(adquirente ?? ''), login: String(login ?? '') }).maybeSingle()
      if (error) throw error
      const senha = data ? mapSenhaFromSupabase(data) : null
      return { ok: true, data: senha }
    } catch (err) {
      return { ok: false, error: err.message || 'Erro ao buscar senhas' }
    }
  }

  const buscarSenhasPorEmpresa = async (empresa) => buscarSenhas({ empresa })
  const buscarSenhasPorEC = async (ec) => buscarSenhas({ ec })
  const buscarSenhasPorAdquirente = async (adquirente) => buscarSenhas({ adquirente })

  return { buscarSenhas, buscarSenhaPorChave, buscarSenhasPorEmpresa, buscarSenhasPorEC, buscarSenhasPorAdquirente }
}