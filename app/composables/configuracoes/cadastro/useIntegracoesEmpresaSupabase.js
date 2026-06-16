import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

export const useIntegracoesEmpresaSupabase = () => {
  const integracoes = ref([])
  const logs = ref([])
  const carregandoIntegracoes = ref(false)
  const carregandoLogs = ref(false)
  const salvandoIntegracao = ref(false)
  const erro = ref('')

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

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession()
    const accessToken = String(data?.session?.access_token || '').trim()

    if (!accessToken) {
      throw new Error('Sessao expirada. Faca login novamente.')
    }

    return {
      Authorization: `Bearer ${accessToken}`
    }
  }

  const buildMensagemErro = (err, fallback) => {
    const base = err?.data?.statusMessage || err?.message || fallback
    if (String(base).includes('relation') && String(base).includes('does not exist')) {
      return 'Tabela de integracoes/logs nao encontrada. Rode o SQL no editor do Supabase antes de usar esta tela.'
    }
    return base
  }

  const listarIntegracoes = async (filters = {}) => {
    carregandoIntegracoes.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/integracoes', {
        method: 'GET',
        query: {
          empresaId: filters.empresaId || undefined,
          status: filters.status || undefined
        },
        headers: await getAuthHeaders()
      })

      integracoes.value = Array.isArray(data) ? data : []
      return integracoes.value
    } catch (err) {
      erro.value = buildMensagemErro(err, 'Erro ao listar integracoes.')
      integracoes.value = []
      return []
    } finally {
      carregandoIntegracoes.value = false
    }
  }

  const listarLogs = async (filters = {}) => {
    carregandoLogs.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/logs', {
        method: 'GET',
        query: {
          empresaId: filters.empresaId || undefined,
          integracaoId: filters.integracaoId || undefined,
          limit: filters.limit || 12
        },
        headers: await getAuthHeaders()
      })

      logs.value = Array.isArray(data) ? data : []
      return logs.value
    } catch (err) {
      erro.value = buildMensagemErro(err, 'Erro ao listar logs.')
      logs.value = []
      return []
    } finally {
      carregandoLogs.value = false
    }
  }

  const salvarIntegracao = async (form) => {
    salvandoIntegracao.value = true
    erro.value = ''

    const empresaId = form.empresa_id || null
    const adquirente = normalizeIdentifier(form.adquirente)

    if (!empresaId) {
      salvandoIntegracao.value = false
      throw new Error('Selecione a empresa.')
    }

    if (!adquirente) {
      salvandoIntegracao.value = false
      throw new Error('Informe a adquirente.')
    }

    try {
      const result = await $fetch('/api/configuracoes/integracoes', {
        method: 'POST',
        body: {
          id: form.id || null,
          empresa_id: empresaId,
          nome_empresa: String(form.nome_empresa || '').trim() || null,
          matriz: String(form.matriz || '').trim() || null,
          adquirente,
          ambiente: String(form.ambiente || 'producao').trim(),
          ec_adquirente: String(form.ec_adquirente || '').trim() || null,
          ativo: !!form.ativo,
          status_integracao: String(form.status_integracao || 'pendente').trim(),
          ultimo_erro: form.status_integracao === 'erro'
            ? (String(form.ultimo_erro || '').trim() || null)
            : null
        },
        headers: await getAuthHeaders()
      })

      return result
    } catch (err) {
      const mensagem = buildMensagemErro(err, 'Erro ao salvar integracao.')
      erro.value = mensagem

      throw new Error(mensagem)
    } finally {
      salvandoIntegracao.value = false
    }
  }

  return {
    integracoes,
    logs,
    erro,
    carregandoIntegracoes,
    carregandoLogs,
    salvandoIntegracao,
    normalizeIdentifier,
    listarIntegracoes,
    listarLogs,
    salvarIntegracao
  }
}
