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
    if (message.includes('normalize_identifier')) {
      return 'A função auxiliar `normalize_identifier` não foi encontrada no Supabase. Execute também a migration supabase/migrations/admin_create_tables_from_form.sql antes da retificação.'
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

  const inferTableCategory = (tableName) => {
    const nome = String(tableName || '')
    if (nome.startsWith('vendas_pix_')) return 'pix_vendas'
    if (nome.startsWith('recebimento_pix_')) return 'pix_recebimento'
    if (nome.startsWith('vendas_')) return 'vendas'
    if (nome.startsWith('recebimento_')) return 'recebimento'
    if (nome.startsWith('banco_')) return 'banco'
    return 'outros'
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

  const listarTabelasPorNomes = async (tables) => {
    loading.value = true
    erro.value = ''
    try {
      const unicas = Array.from(new Set((tables || []).map(normalizeIdentifier).filter(Boolean)))
      const encontradas = []

      for (const tableName of unicas) {
        const { error } = await supabase
          .from(tableName)
          .select('id', { head: true, count: 'exact' })
          .limit(1)

        if (!error) {
          encontradas.push({
            table_name: tableName,
            category: inferTableCategory(tableName)
          })
          continue
        }

        const message = String(error?.message || '').toLowerCase()
        const code = String(error?.code || '').toLowerCase()
        const tableMissing = code === 'pgrst205'
          || message.includes('relation')
          || message.includes('does not exist')
          || message.includes('could not find the table')

        if (!tableMissing) {
          throw error
        }
      }

      return encontradas
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

  const excluirMovimentosPorMes = async ({ empresa, adquirentes, mesReferencia, mesesReferencia, tipos }) => {
    loading.value = true
    erro.value = ''
    resultado.value = null
    try {
      const p_adquirentes = (adquirentes || []).map(normalizeIdentifier).filter(Boolean)
      const p_tipos = (tipos || []).map(normalizeIdentifier).filter(Boolean)
      const meses = Array.isArray(mesesReferencia) && mesesReferencia.length > 0
        ? mesesReferencia
        : [mesReferencia]
      const mesesValidos = meses.map(m => String(m || '').trim()).filter(Boolean)
      if (mesesValidos.length === 0) {
        throw new Error('Selecione pelo menos um mês de referência.')
      }

      const agregado = {
        ok: true,
        total_deleted_rows: 0,
        details: [],
        months: []
      }

      for (const mes of mesesValidos) {
        const p_mes = `${mes}-01`
        const { data, error } = await supabase.rpc('admin_delete_movimentos_by_month', {
          p_empresa: String(empresa || ''),
          p_adquirentes,
          p_mes,
          p_tipos
        })
        if (error) throw error
        agregado.total_deleted_rows += Number(data?.total_deleted_rows || 0)
        agregado.months.push(mes)
        if (Array.isArray(data?.details)) {
          agregado.details.push(...data.details.map(d => ({ ...d, month: mes })))
        }
      }

      resultado.value = agregado
      return agregado
    } catch (e) {
      erro.value = buildFriendlyErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  const excluirDepositosPorBancoEMes = async ({ empresa, bancos, mesReferencia, mesesReferencia }) => {
    loading.value = true
    erro.value = ''
    resultado.value = null
    try {
      const empresaNorm = normalizeIdentifier(empresa)
      const bancosNorm = (bancos || []).map(normalizeIdentifier).filter(Boolean)
      const meses = Array.isArray(mesesReferencia) && mesesReferencia.length > 0
        ? mesesReferencia
        : [mesReferencia]
      const mesesValidos = meses.map(m => String(m || '').trim()).filter(Boolean)

      if (!empresaNorm) throw new Error('Selecione uma empresa válida.')
      if (bancosNorm.length === 0) throw new Error('Selecione pelo menos um banco.')
      if (mesesValidos.length === 0) throw new Error('Selecione pelo menos um mês de referência.')

      const agregado = {
        ok: true,
        total_deleted_rows: 0,
        details: [],
        months: []
      }

      for (const mes of mesesValidos) {
        const inicio = `${mes}-01`
        const dtInicio = new Date(`${inicio}T00:00:00`)
        const dtFim = new Date(dtInicio.getFullYear(), dtInicio.getMonth() + 1, 1)
        const inicioIso = dtInicio.toISOString().slice(0, 10)
        const fimIso = dtFim.toISOString().slice(0, 10)

        for (const banco of bancosNorm) {
          const table = `banco_${banco}_${empresaNorm}`
          const { error, count } = await supabase
            .from(table)
            .delete({ count: 'exact' })
            .gte('data', inicioIso)
            .lt('data', fimIso)

          if (error) throw error

          const deletedRows = Number(count || 0)
          agregado.total_deleted_rows += deletedRows
          agregado.details.push({
            table,
            month: mes,
            deleted_rows: deletedRows
          })
        }

        agregado.months.push(mes)
      }

      resultado.value = agregado
      return agregado
    } catch (e) {
      erro.value = buildFriendlyErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  const excluirCadastroCliente = async ({ empresa }) => {
    loading.value = true
    erro.value = ''
    resultado.value = null
    try {
      const empresaNorm = normalizeIdentifier(empresa)
      if (!empresaNorm) throw new Error('Selecione uma empresa válida.')

      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome_empresa')

      if (error) throw error

      const ids = (data || [])
        .filter(item => normalizeIdentifier(item?.nome_empresa) === empresaNorm)
        .map(item => item.id)
        .filter(Boolean)

      if (ids.length === 0) {
        resultado.value = { ok: true, deleted_rows: 0, message: 'Nenhum cadastro encontrado para esta empresa.' }
        return resultado.value
      }

      const { error: delError, count } = await supabase
        .from('empresas')
        .delete({ count: 'exact' })
        .in('id', ids)

      if (delError) throw delError

      resultado.value = {
        ok: true,
        deleted_rows: Number(count || 0),
        deleted_ids: ids
      }
      return resultado.value
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
    normalizeIdentifier,
    reset,
    listarTabelasEmpresa,
    listarTabelasPorNomes,
    excluirTabelas,
    excluirMovimentosPorMes,
    excluirDepositosPorBancoEMes,
    excluirCadastroCliente
  }
}
