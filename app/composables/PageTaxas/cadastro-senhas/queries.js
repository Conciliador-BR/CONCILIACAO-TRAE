/**
 * Operações de consulta para senhas no Supabase
 */

import { mapSenhaFromSupabase } from './mappers.js'

/**
 * Cria operações de consulta para senhas
 */
export const createQueryOperations = (supabase) => {
  /**
   * Busca todas as senhas
   */
  const buscarSenhas = async (options = {}) => {
    try {
      console.log('🔍 Buscando senhas no Supabase...')
      
      let query = supabase
        .from('cadastro_senhas')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros se fornecidos
      if (options.empresa) {
        query = query.eq('empresa', options.empresa)
      }
      
      if (options.ec) {
        query = query.eq('ec', options.ec)
      }
      
      if (options.adquirente) {
        query = query.eq('adquirente', options.adquirente)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar senhas:', error)
        throw error
      }

      console.log(`✅ ${data?.length || 0} senhas encontradas`)
      
      // Mapear para formato do frontend
      const senhas = (data || []).map(mapSenhaFromSupabase)
      
      return {
        ok: true,
        data: senhas,
        total: senhas.length
      }

    } catch (err) {
      console.error('❌ Erro ao buscar senhas:', err)
      
      return {
        ok: false,
        error: err.message || 'Erro ao buscar senhas',
        data: []
      }
    }
  }

  /**
   * Busca uma senha específica por chave composta
   */
  const buscarSenhaPorChave = async (empresa, ec, adquirente, login) => {
    try {
      const ecMatch = Number.isFinite(Number(ec)) ? Number(ec) : String(ec ?? '')
      const { data, error } = await supabase
        .from('cadastro_senhas')
        .select('*')
        .match({
          empresa: String(empresa ?? ''),
          ec: ecMatch,
          adquirente: String(adquirente ?? ''),
          login: String(login ?? '')
        })
        .maybeSingle()

      if (error) {
        console.error('❌ Erro ao buscar senha:', error)
        throw error
      }

      const senha = data ? mapSenhaFromSupabase(data) : null
      return { ok: true, data: senha }
    } catch (err) {
      console.error('❌ Erro ao buscar senha:', err)
      return { ok: false, error: err.message || 'Erro ao buscar senhas' }
    }
  }

  /**
   * Busca senhas por empresa
   */
  const buscarSenhasPorEmpresa = async (empresa) => {
    return await buscarSenhas({ empresa })
  }

  /**
   * Busca senhas por EC
   */
  const buscarSenhasPorEC = async (ec) => {
    return await buscarSenhas({ ec })
  }

  /**
   * Busca senhas por adquirente
   */
  const buscarSenhasPorAdquirente = async (adquirente) => {
    return await buscarSenhas({ adquirente })
  }

  return {
    buscarSenhas,
    buscarSenhaPorChave,
    buscarSenhasPorEmpresa,
    buscarSenhasPorEC,
    buscarSenhasPorAdquirente
  }
}