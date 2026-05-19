import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useIntegracoesEmpresaSupabase = () => {
  const { supabase } = useAPIsupabase()

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

  const getAuthUserId = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      return data?.user?.id || null
    } catch {
      return null
    }
  }

  const buildMensagemErro = (err, fallback) => {
    const base = err?.message || fallback
    if (String(base).includes('relation') && String(base).includes('does not exist')) {
      return 'Tabela de integracoes/logs nao encontrada. Rode o SQL no editor do Supabase antes de usar esta tela.'
    }
    return base
  }

  const registrarLog = async ({
    empresaId,
    integracaoId = null,
    adquirente,
    tipoOperacao,
    statusExecucao,
    mensagem,
    payloadResumo = null
  }) => {
    try {
      const executadoPor = await getAuthUserId()
      await supabase
        .from('logs_integracao')
        .insert({
          empresa_id: empresaId,
          integracao_id: integracaoId,
          adquirente,
          tipo_operacao: tipoOperacao,
          status_execucao: statusExecucao,
          quantidade_registros: 0,
          mensagem,
          payload_resumo: payloadResumo,
          executado_por: executadoPor
        })
    } catch {
      // Log best-effort: nao bloquear o fluxo principal.
    }
  }

  const listarIntegracoes = async (filters = {}) => {
    carregandoIntegracoes.value = true
    erro.value = ''

    try {
      let query = supabase
        .from('integracoes_empresa')
        .select('id, empresa_id, nome_empresa, adquirente, ambiente, client_id, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, ec_estabelecimento, request_company_number, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
        .order('updated_at', { ascending: false, nullsFirst: false })

      if (filters.empresaId) {
        query = query.eq('empresa_id', filters.empresaId)
      }

      if (filters.status) {
        query = query.eq('status_integracao', filters.status)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

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
      let query = supabase
        .from('logs_integracao')
        .select('id, empresa_id, integracao_id, adquirente, tipo_operacao, status_execucao, periodo_inicial, periodo_final, http_status, quantidade_registros, mensagem, request_id, payload_resumo, created_at')
        .order('created_at', { ascending: false })
        .limit(filters.limit || 12)

      if (filters.empresaId) {
        query = query.eq('empresa_id', filters.empresaId)
      }

      if (filters.integracaoId) {
        query = query.eq('integracao_id', filters.integracaoId)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

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

    if (!String(form.client_id || '').trim()) {
      salvandoIntegracao.value = false
      throw new Error('Informe o Client ID.')
    }

    if (!form.id && !String(form.client_secret || '').trim()) {
      salvandoIntegracao.value = false
      throw new Error('Informe o Client Secret.')
    }

    const updatedBy = await getAuthUserId()
    const payload = {
      empresa_id: empresaId,
      nome_empresa: String(form.nome_empresa || '').trim() || null,
      adquirente,
      ambiente: String(form.ambiente || 'sandbox').trim(),
      client_id: String(form.client_id || '').trim(),
      ec_adquirente: String(form.ec_adquirente || '').trim() || null,
      request_company_number: String(form.request_company_number || '').trim() || null,
      ativo: !!form.ativo,
      status_integracao: String(form.status_integracao || 'pendente').trim(),
      ultimo_erro: form.status_integracao === 'erro'
        ? (String(form.ultimo_erro || '').trim() || null)
        : null,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy
    }

    if (String(form.client_secret || '').trim()) {
      payload.client_secret_criptografado = String(form.client_secret).trim()
    }

    try {
      let result = null

      if (form.id) {
        const { data, error: updateError } = await supabase
          .from('integracoes_empresa')
          .update(payload)
          .eq('id', form.id)
          .select('id, empresa_id, nome_empresa, adquirente, ambiente, client_id, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, ec_estabelecimento, request_company_number, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
          .single()

        if (updateError) throw updateError
        result = data
      } else {
        const { data, error: insertError } = await supabase
          .from('integracoes_empresa')
          .insert(payload)
          .select('id, empresa_id, nome_empresa, adquirente, ambiente, client_id, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, ec_estabelecimento, request_company_number, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
          .single()

        if (insertError) throw insertError
        result = data
      }

      await registrarLog({
        empresaId,
        integracaoId: result?.id || null,
        adquirente,
        tipoOperacao: form.id ? 'atualizacao_cadastro' : 'cadastro_integracao',
        statusExecucao: 'sucesso',
        mensagem: form.id
          ? 'Integracao atualizada manualmente na tela de configuracoes.'
          : 'Integracao cadastrada manualmente na tela de configuracoes.'
      })

      return result
    } catch (err) {
      const mensagem = buildMensagemErro(err, 'Erro ao salvar integracao.')
      erro.value = mensagem

      await registrarLog({
        empresaId,
        integracaoId: form.id || null,
        adquirente,
        tipoOperacao: form.id ? 'atualizacao_cadastro' : 'cadastro_integracao',
        statusExecucao: 'erro',
        mensagem
      })

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
