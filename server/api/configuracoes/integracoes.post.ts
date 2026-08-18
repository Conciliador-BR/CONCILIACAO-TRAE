import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'
import { encryptSecret } from '../../utils/secretCipher'

const CREDENCIAIS_TABLE = 'credenciais_adquirente'

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

const normalizeText = (value: unknown) => String(value || '').trim()
const normalizeCnpj = (value: unknown) => String(value || '').replace(/\D/g, '').trim()

const buildMensagemErro = (err: any, fallback: string) => {
  const base = err?.message || fallback
  if (String(base).includes('relation') && String(base).includes('does not exist')) {
    return 'Tabela de integracoes/logs nao encontrada. Rode o SQL no editor do Supabase antes de usar esta tela.'
  }
  return String(base)
}

const serializeIntegracao = (item: any) => ({
  ...item,
  client_secret_criptografado: undefined,
  has_company_credentials: !!(String(item?.client_id || '').trim() && String(item?.client_secret_criptografado || '').trim()),
  credential_mode: String(item?.client_id || '').trim() && String(item?.client_secret_criptografado || '').trim()
    ? 'empresa'
    : 'global'
})

const serializeVrCredential = (item: any, form: any) => serializeIntegracao({
  id: item?.id || null,
  source_table: CREDENCIAIS_TABLE,
  empresa_id: form?.empresa_id || null,
  nome_empresa: normalizeText(item?.empresas || form?.nome_empresa) || null,
  matriz: normalizeText(item?.ec || form?.ec || form?.matriz) || null,
  empresas: normalizeText(item?.empresas || form?.nome_empresa) || null,
  ec: normalizeText(item?.ec || form?.ec || form?.matriz) || null,
  adquirente: normalizeIdentifier(item?.adquirente || form?.adquirente || 'vr') || 'vr',
  ambiente: normalizeText(item?.ambiente || form?.ambiente || 'producao') || 'producao',
  ativo: item?.ativo !== false,
  status_integracao: item?.ativo === false ? 'pendente' : 'valida',
  ultima_validacao_em: null,
  ultimo_erro: null,
  ultima_sincronizacao_em: null,
  ec_adquirente: normalizeText(item?.ec || form?.ec || form?.matriz) || null,
  client_id: normalizeText(item?.client_id) || null,
  client_secret_criptografado: item?.client_secret_criptografado || null,
  cnpj: normalizeCnpj(item?.client_secret_criptografado || form?.cnpj) || null,
  ultimo_optin_em: null,
  ultimo_optin_status: null,
  ultimo_optin_erro: null,
  created_at: item?.created_at || null,
  updated_at: item?.updated_at || null
})

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

  const empresasValue = normalizeText(form?.empresas || form?.nome_empresa)
  const ecValue = normalizeText(form?.ec || form?.ec_adquirente || form?.matriz)
  const cnpjValue = normalizeCnpj(form?.cnpj)

  if (adquirente === 'vr') {
    const clientId = normalizeText(form?.client_id)

    if (!clientId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Informe o nome do arquivo da VR para salvar o cadastro.'
      })
    }

    if (!empresasValue) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nao foi possivel identificar a empresa para salvar a credencial da VR.'
      })
    }

    if (!ecValue) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nao foi possivel identificar o EC para salvar a credencial da VR.'
      })
    }

    if (!cnpjValue) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nao foi possivel identificar o CNPJ da empresa para salvar a credencial da VR.'
      })
    }

    const payloadVr: Record<string, any> = {
      adquirente: 'vr',
      ambiente: normalizeText(form?.ambiente || 'producao') || 'producao',
      client_id: clientId,
      client_secret_criptografado: cnpjValue,
      ativo: !!form?.ativo,
      empresas: empresasValue,
      ec: ecValue,
      updated_at: new Date().toISOString()
    }

    try {
      let result = null

      if (form?.id) {
        const { data, error } = await supabase
          .from(CREDENCIAIS_TABLE)
          .update(payloadVr)
          .eq('id', form.id)
          .eq('adquirente', 'vr')
          .select('id, adquirente, ambiente, ativo, client_id, client_secret_criptografado, empresas, ec, created_at, updated_at')
          .single()

        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from(CREDENCIAIS_TABLE)
          .insert(payloadVr)
          .select('id, adquirente, ambiente, ativo, client_id, client_secret_criptografado, empresas, ec, created_at, updated_at')
          .single()

        if (error) throw error
        result = data
      }

      await supabase
        .from('logs_integracao')
        .insert({
          empresa_id: empresaId,
          integracao_id: null,
          adquirente,
          tipo_operacao: form?.id ? 'atualizacao_cadastro_vr' : 'cadastro_integracao_vr',
          status_execucao: 'sucesso',
          quantidade_registros: 0,
          mensagem: form?.id
            ? 'Cadastro da VR atualizado na tabela de credenciais.'
            : 'Cadastro da VR gravado na tabela de credenciais.',
          executado_por: user.id
        })

      return serializeVrCredential(result, form)
    } catch (err: any) {
      const mensagem = buildMensagemErro(err, 'Erro ao salvar credencial da VR.')

      await supabase
        .from('logs_integracao')
        .insert({
          empresa_id: empresaId,
          integracao_id: null,
          adquirente,
          tipo_operacao: form?.id ? 'atualizacao_cadastro_vr' : 'cadastro_integracao_vr',
          status_execucao: 'erro',
          quantidade_registros: 0,
          mensagem,
          executado_por: user.id
        })

      throw createError({
        statusCode: 500,
        statusMessage: mensagem
      })
    }
  }

  const credentialMode = String(form?.credential_mode || '').trim().toLowerCase() === 'global' ? 'global' : 'empresa'
  let integracaoAtual: any = null

  if (form?.id) {
    const { data: existente, error: existingError } = await supabase
      .from('integracoes_empresa')
      .select('id, client_id, client_secret_criptografado')
      .eq('id', form.id)
      .maybeSingle()

    if (existingError) {
      throw createError({
        statusCode: 500,
        statusMessage: buildMensagemErro(existingError, 'Erro ao carregar a integracao atual.')
      })
    }

    integracaoAtual = existente || null
  }

  const payload: Record<string, any> = {
    empresa_id: empresaId,
    nome_empresa: normalizeText(form?.nome_empresa) || null,
    matriz: normalizeText(form?.matriz) || null,
    adquirente,
    ambiente: normalizeText(form?.ambiente || 'producao'),
    ec_adquirente: normalizeText(form?.ec_adquirente) || null,
    ativo: !!form?.ativo,
    status_integracao: normalizeText(form?.status_integracao || 'pendente'),
    ultimo_erro: form?.status_integracao === 'erro'
      ? (normalizeText(form?.ultimo_erro) || null)
      : null,
    updated_at: new Date().toISOString(),
    updated_by: user.id
  }

  if (adquirente === 'rede') {
    if (credentialMode === 'global') {
      payload.client_id = null
      payload.client_secret_criptografado = null
    } else {
      const clientId = String(form?.client_id || '').trim()
      const clientSecret = String(form?.client_secret || '')

      if (!clientId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Informe o Client ID da REDE ou selecione o modo de credencial global.'
        })
      }

      const currentSecret = String(integracaoAtual?.client_secret_criptografado || '').trim()
      const encryptedSecret = String(clientSecret || '').trim()
        ? encryptSecret(clientSecret)
        : (currentSecret || null)

      if (!encryptedSecret) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Informe o Client Secret da REDE na primeira gravacao da credencial por empresa.'
        })
      }

      payload.client_id = clientId
      payload.client_secret_criptografado = encryptedSecret
    }
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
        .select('id, empresa_id, nome_empresa, matriz, adquirente, ambiente, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, client_id, client_secret_criptografado, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('integracoes_empresa')
        .insert(payload)
        .select('id, empresa_id, nome_empresa, matriz, adquirente, ambiente, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, client_id, client_secret_criptografado, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
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

    return serializeIntegracao(result)
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
