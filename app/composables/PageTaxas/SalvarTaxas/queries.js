/**
 * Operações de busca e consulta no Supabase
 */

export const createQueryOperations = (supabase) => {
  // Nova função para buscar taxas do Supabase
  const buscarTaxasDoSupabase = async (filtros = {}) => {
    try {
      console.log('🔍 Buscando taxas do Supabase...', filtros)
      
      let query = supabase
        .from('cadastro_taxas')
        .select('*')
      
      // Aplicar filtros se fornecidos
      if (filtros.empresa) {
        query = query.eq('empresa', filtros.empresa)
      }
      if (filtros.adquirente) {
        query = query.eq('adquirente', filtros.adquirente)
      }
      if (filtros.bandeira) {
        query = query.eq('bandeira', filtros.bandeira)
      }
      if (filtros.modalidade) {
        query = query.eq('modalidade', filtros.modalidade)
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) {
        console.error('❌ Erro ao buscar taxas:', fetchError)
        throw new Error(`Erro ao buscar taxas: ${fetchError.message}`)
      }
      
      console.log('✅ Taxas encontradas:', data?.length || 0)
      return data || []
      
    } catch (err) {
      console.error('💥 Erro na busca de taxas:', err)
      throw err
    }
  }

  return {
    buscarTaxasDoSupabase
  }
}