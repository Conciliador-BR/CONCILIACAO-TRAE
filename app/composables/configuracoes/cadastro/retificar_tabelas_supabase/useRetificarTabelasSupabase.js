import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig.js'

export const useRetificarTabelasSupabase = () => {
  const loading = ref(false)
  const erro = ref('')
  const resultado = ref(null)

  const buildFriendlyErrorMessage = (error) => {
    const message = error?.message || 'Erro ao executar retificação'
    if (message.includes('schema cache')) {
      return 'Função RPC de retificação não encontrada no Supabase atual. Execute a migration supabase/migrations/admin_retificar_tabelas_supabase.sql.'
    }
    return message
  }

  const normalizeIdentifier = (value) => {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  const reset = () => {
    erro.value = ''
    resultado.value = null
  }

  const listarTabelasEmpresa = async (empresa) => {
    loading.value = true
    erro.value = ''
    try {
      const { data, error } = await supabase.rpc('admin_list_tables_for_company', {
        p_empresa: String(empresa || '')
      })
      if (error) throw error
      return Array.isArray(data) ? data : []
    } catch (e) {
      erro.value = buildFriendlyErrorMessage(e)
      return []
    } finally {
      loading.value = false
    }
  }

  const excluirTabelas = async (tables) => {
    loading.value = true
    erro.value = ''
    resultado.value = null
    try {
      const p_tables = (tables || []).map(normalizeIdentifier).filter(Boolean)
      const { data, error } = await supabase.rpc('admin_drop_tables', { p_tables })
      if (error) throw error
      resultado.value = data
      return data
    } catch (e) {
      erro.value = buildFriendlyErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  const excluirMovimentosPorMes = async ({ empresa, adquirentes, mesReferencia, tipos }) => {
    loading.value = true
    erro.value = ''
    resultado.value = null
    try {
      const p_adquirentes = (adquirentes || []).map(normalizeIdentifier).filter(Boolean)
      const p_tipos = (tipos || []).map(normalizeIdentifier).filter(Boolean)
      const mes = String(mesReferencia || '').trim()
      const p_mes = mes ? `${mes}-01` : null

      const { data, error } = await supabase.rpc('admin_delete_movimentos_by_month', {
        p_empresa: String(empresa || ''),
        p_adquirentes,
        p_mes,
        p_tipos
      })
      if (error) throw error
      resultado.value = data
      return data
    } catch (e) {
      erro.value = buildFriendlyErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: computed(() => loading.value),
    erro: computed(() => erro.value),
    resultado: computed(() => resultado.value),
    reset,
    listarTabelasEmpresa,
    excluirTabelas,
    excluirMovimentosPorMes
  }
}
