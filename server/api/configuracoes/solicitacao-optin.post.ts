import {
  createSupabaseServerClient,
  getRedeAuthBaseUrl,
  getRedeDataBaseUrl,
  maskToken,
  normalizeServerError,
  parseResponseBody
} from '../../utils/redeIntegration'

const truncatePayload = (value: unknown) => {
  try {
    const json = JSON.stringify(value)
    if (!json) return null
    return json.length > 1500
      ? { truncated: true, preview: json.slice(0, 1500) }
      : value
  } catch {
    return null
  }
}

const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item || '').trim())
      .filter(Boolean)
  }

  return String(value || '')
    .split(/[\n,;]+/g)
    .map(item => item.trim())
    .filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const supabase = createSupabaseServerClient()
  const body = await readBody(event)

  const integrationId = Number(body?.integrationId)
  const timeoutMs = Math.max(3000, Math.min(Number(body?.timeoutMs) || 30000, 60000))

  if (!integrationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Selecione uma integracao valida para solicitar o opt-in.'
    })
  }

  const { data: integracao, error: integrationError } = await supabase
    .from('integracoes_empresa')
    .select('id, empresa_id, nome_empresa, adquirente, ambiente, client_id, client_secret_criptografado, ativo, ec_adquirente')
    .eq('id', integrationId)
    .single()

  if (integrationError || !integracao) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Integracao nao encontrada para solicitar o opt-in.'
    })
  }

  if (String(integracao.adquirente || '').toLowerCase() !== 'rede') {
    throw createError({
      statusCode: 400,
      statusMessage: 'A page de solicitacao de opt-in atual foi preparada para a REDE.'
    })
  }

  const requestCompanyNumber = String(body?.requestCompanyNumber || integracao.ec_adquirente || '').trim()
  const defaultCompanyNumbers = integracao.ec_adquirente
    ? [integracao.ec_adquirente]
    : []
  const companyNumbers = toStringArray(body?.companyNumbers || defaultCompanyNumbers)
  const requestType = String(body?.requestType || 'P').trim().toUpperCase()
  const permissions = String(body?.permissions || 'R').trim().toUpperCase()

  if (!requestCompanyNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe o PV/EC solicitante para o opt-in.'
    })
  }

  if (!companyNumbers.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe ao menos um EC em companyNumbers para solicitar o opt-in.'
    })
  }

  const inserirLog = async ({
    tipoOperacao,
    statusExecucao,
    mensagem,
    httpStatus = null,
    payloadResumo = null
  }: {
    tipoOperacao: string
    statusExecucao: string
    mensagem: string
    httpStatus?: number | null
    payloadResumo?: any
  }) => {
    await supabase.from('logs_integracao').insert({
      empresa_id: integracao.empresa_id,
      integracao_id: integracao.id,
      adquirente: integracao.adquirente,
      tipo_operacao: tipoOperacao,
      status_execucao: statusExecucao,
      http_status: httpStatus,
      quantidade_registros: companyNumbers.length,
      mensagem,
      payload_resumo: truncatePayload(payloadResumo)
    })
  }

  const atualizarIntegracao = async (payload: Record<string, any>) => {
    await supabase
      .from('integracoes_empresa')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', integracao.id)
  }

  const authBaseUrl = getRedeAuthBaseUrl(integracao.ambiente)
  const dataBaseUrl = getRedeDataBaseUrl(integracao.ambiente)
  const authUrl = `${authBaseUrl}/oauth2/token`
  const optinUrl = `${String(dataBaseUrl).replace(/\/+$/, '')}/partner/v1/organizations/requests/features/merchant-statement`
  const basicToken = Buffer
    .from(`${integracao.client_id}:${integracao.client_secret_criptografado}`)
    .toString('base64')

  const authController = new AbortController()
  const authTimeout = setTimeout(() => authController.abort(), timeoutMs)

  try {
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
      signal: authController.signal
    })

    const authPayload = await parseResponseBody(authResponse)

    if (!authResponse.ok) {
      const mensagem = `Falha ao gerar token para opt-in (${authResponse.status}).`

      await atualizarIntegracao({
        ultimo_optin_status: 'erro',
        ultimo_optin_erro: mensagem
      })

      await inserirLog({
        tipoOperacao: 'optin_auth',
        statusExecucao: 'erro',
        mensagem,
        httpStatus: authResponse.status,
        payloadResumo: authPayload
      })

      throw createError({
        statusCode: 502,
        statusMessage: mensagem,
        data: {
          ok: false,
          errorStage: 'auth',
          auth: {
            ok: false,
            authUrl,
            httpStatus: authResponse.status,
            response: authPayload
          },
          request: null
        }
      })
    }

    const accessToken = String(authPayload?.access_token || '')
    const tokenType = String(authPayload?.token_type || 'Bearer')
    const payloadOptin = {
      requestCompanyNumber,
      companyNumbers,
      requestType,
      permissions
    }

    await inserirLog({
      tipoOperacao: 'optin_auth',
      statusExecucao: 'sucesso',
      mensagem: 'Token OAuth2 obtido com sucesso para o opt-in.',
      httpStatus: authResponse.status,
      payloadResumo: {
        auth_url: authUrl,
        token_type: tokenType,
        access_token_masked: maskToken(accessToken)
      }
    })

    const requestController = new AbortController()
    const requestTimeout = setTimeout(() => requestController.abort(), timeoutMs)

    try {
      const optinResponse = await fetch(optinUrl, {
        method: 'POST',
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadOptin),
        signal: requestController.signal
      })

      const optinPayload = await parseResponseBody(optinResponse)
      const nowIso = new Date().toISOString()
      const mensagem = optinResponse.ok
        ? 'Opt-in solicitado com sucesso.'
        : `Falha ao solicitar opt-in (${optinResponse.status}).`

      await atualizarIntegracao({
        ultimo_optin_em: nowIso,
        ultimo_optin_status: optinResponse.ok ? 'sucesso' : 'erro',
        ultimo_optin_erro: optinResponse.ok ? null : mensagem
      })

      await inserirLog({
        tipoOperacao: 'solicitacao_optin',
        statusExecucao: optinResponse.ok ? 'sucesso' : 'erro',
        mensagem,
        httpStatus: optinResponse.status,
        payloadResumo: {
          request: payloadOptin,
          response: optinPayload
        }
      })

      if (!optinResponse.ok) {
        throw createError({
          statusCode: 502,
          statusMessage: mensagem,
          data: {
            ok: false,
            errorStage: 'request',
            auth: {
              ok: true,
              authUrl,
              httpStatus: authResponse.status,
              accessTokenMasked: maskToken(accessToken),
              tokenType
            },
            request: {
              ok: false,
              url: optinUrl,
              method: 'POST',
              httpStatus: optinResponse.status,
              payload: payloadOptin,
              response: optinPayload
            }
          }
        })
      }

      return {
        ok: true,
        integration: {
          id: integracao.id,
          empresa_id: integracao.empresa_id,
          adquirente: integracao.adquirente,
          ambiente: integracao.ambiente,
          nome_empresa: integracao.nome_empresa || null,
          ec_adquirente_used: requestCompanyNumber,
          company_numbers: companyNumbers,
          ec_adquirente: integracao.ec_adquirente || null
        },
        auth: {
          ok: true,
          authUrl,
          httpStatus: authResponse.status,
          tokenType,
          accessTokenMasked: maskToken(accessToken)
        },
        request: {
          ok: true,
          url: optinUrl,
          method: 'POST',
          httpStatus: optinResponse.status,
          payload: payloadOptin,
          response: optinPayload
        }
      }
    } finally {
      clearTimeout(requestTimeout)
    }
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: normalizeServerError(error, 'Falha ao solicitar o opt-in da adquirente.'),
      data: error?.data || {
        ok: false,
        errorStage: 'internal',
        auth: null,
        request: null
      }
    })
  } finally {
    clearTimeout(authTimeout)
  }
})
