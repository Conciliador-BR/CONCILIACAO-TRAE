import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'

const normalizeIdentifier = (value: unknown) => {
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

const buildMensagemErro = (err: any, fallback: string) => {
  const base = err?.message || fallback
  if (String(base).includes('relation') && String(base).includes('does not exist')) {
    return 'Tabela de integracoes/logs nao encontrada. Rode o SQL no editor do Supabase antes de usar esta tela.'
  }
  return String(base)
}

export default defineEventHandler(async (event) => {
  const { accessToken, user } = await requireAdminAccess(event)
  const supabase = createSupabaseServerClient(accessToken)
  const form = await readBody(event)

  const empresaId = form?.empresa_id || null
  const adquirente = normalizeIdentifier(form?.adquirente)

  if (!empresaId) {
    throw createError({ statusCode: 400, statusMessage: 'Selecione a empresa.' })
  }

  if (!adquirente) {
    throw createError({ statusCode: 400, statusMessage: 'Informe a adquirente.' })
  }

  const payload: Record<string, any> = {
    empresa_id: empresaId,
    nome_empresa: String(form?.nome_empresa || '').trim() || null,
    matriz: String(form?.matriz || '').trim() || null,
    adquirente,
    ambiente: String(form?.ambiente || 'producao').trim(),
    ec_adquirente: String(form?.ec_adquirente || '').trim() || null,
    ativo: !!form?.ativo,
    status_integracao: String(form?.status_integracao || 'pendente').trim(),
    ultimo_erro: form?.status_integracao === 'erro'
      ? (String(form?.ultimo_erro || '').trim() || null)
      : null,
    updated_at: new Date().toISOString(),
    updated_by: user.id
  }

  const registrarLog = async ({
    integracaoId = null,
    tipoOperacao,
    statusExecucao,
    mensagem
  }: {
    integracaoId?: number | null
    tipoOperacao: string
    statusExecucao: string
    mensagem: string
  }) => {
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
        executado_por: user.id
      })
  }

  try {
    let result = null

    if (form?.id) {
      const { data, error } = await supabase
        .from('integracoes_empresa')
        .update(payload)
        .eq('id', form.id)
        .select('id, empresa_id, nome_empresa, matriz, adquirente, ambiente, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('integracoes_empresa')
        .insert(payload)
        .select('id, empresa_id, nome_empresa, matriz, adquirente, ambiente, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
        .single()

      if (error) throw error
      result = data
    }

    await registrarLog({
      integracaoId: result?.id || null,
      tipoOperacao: form?.id ? 'atualizacao_cadastro' : 'cadastro_integracao',
      statusExecucao: 'sucesso',
      mensagem: form?.id
        ? 'Integracao atualizada manualmente na tela de configuracoes.'
        : 'Integracao cadastrada manualmente na tela de configuracoes.'
    })

    return result
  } catch (err: any) {
    const mensagem = buildMensagemErro(err, 'Erro ao salvar integracao.')

    await registrarLog({
      integracaoId: form?.id || null,
      tipoOperacao: form?.id ? 'atualizacao_cadastro' : 'cadastro_integracao',
      statusExecucao: 'erro',
      mensagem
    })

    throw createError({
      statusCode: 500,
      statusMessage: mensagem
    })
  }
})
