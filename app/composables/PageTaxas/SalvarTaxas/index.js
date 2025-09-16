import { ref } from 'vue'
import { useAPIsupabase } from '../../useAPIsupabase'
import { mapTaxa } from './mappers.js'
import { createUpsertOperations } from './operations.js'
import { createQueryOperations } from './queries.js'

/**
 * Composable principal para operações de taxas no Supabase
 * Integra todos os módulos componentizados
 */
export const useTaxasSupabaseModular = () => {
  const { supabase, error: apiError } = useAPIsupabase()

  // Estados reativos
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)
  const resumo = ref({ processadas: 0, sucesso: 0, falha: 0, erros: [] })

  const state = { loading, error, success, resumo }

  // Criar operações CRUD
  const operations = createUpsertOperations(supabase, state)
  
  // Criar operações de busca
  const queries = createQueryOperations(supabase)

  // === Aliases de compatibilidade (mantêm nomes antigos usados nos componentes) ===
  const salvarTaxasNoSupabase = async (taxas, options = {}) => {
    return await operations.upsertTaxas(taxas, options)
  }

  const enviarTaxa = async (taxa, options = {}) => {
    return await operations.upsertTaxa(taxa, options)
  }

  const enviarTaxasLote = async (taxas, options = {}) => {
    return await operations.upsertTaxas(taxas, options)
  }

  return {
    // Estados
    loading,
    error,
    success,
    resumo,
    
    // Utilitários
    mapTaxa,
    
    // Operações principais
    ...operations,
    ...queries,
    
    // Aliases de compatibilidade
    salvarTaxasNoSupabase,
    enviarTaxa,
    enviarTaxasLote
  }
}