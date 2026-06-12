import {
  buildRequestUrl,
  createSupabaseServerClient,
  getERedeDataBaseUrl,
  getRedeAuthBaseUrl,
  maskToken,
  normalizeServerError,
  parseResponseBody
} from '../../../utils/redeIntegration'
import { requireAdminAccess } from '../../../utils/adminAccess'

const buildPixLookupTarget = ({
  tid,
  reference
}: {
  tid: string
  reference: string
}) => {
  if (tid) {
    return {
      endpointPath: `/v2/transactions/${encodeURIComponent(tid)}`,
      queryParams: {},
      lookupType: 'tid'
    }
  }

  return {
    endpointPath: '/v2/transactions',
    queryParams: { reference },
    lookupType: 'reference'
  }
}

const detectPixPayload = (payload: any) => {
  const joined = JSON.stringify([
    payload?.kind,
    payload?.type,
    payload?.subType,
    payload?.qrCode,
    payload?.e2eId,
    payload?.endToEndId,
    payload?.pix,
    payload?.paymentMethod,
    payload?.authorization?.kind
  ]).toUpperCase()

  return joined.includes('PIX') || joined.includes('QRCODE') || joined.includes('ENDTOEND')
}

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const body = await readBody(event)
  const supabase = createSupabaseServerClient(accessToken)

  const integrationId = Number(body?.integrationId)
  const reference = String(body?.reference || '').trim()
  const tid = String(body?.tid || '').trim()
  const includeRefunds = !!body?.includeRefunds
  const timeoutMs = Math.max(3000, Math.min(Number(body?.timeoutMs) || 20000, 60000))
  const baseUrlOverride = String(body?.baseUrlOverride || '').trim()

  if (!integrationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe uma integracao valida para testar o Pix da e.Rede.'
    })
  }

  if (!reference && !tid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe ao menos um reference ou tid para consultar o Pix na e.Rede.'
    })
  }

  const { data: integracao, error: integrationError } = await supabase
    .from('integracoes_empresa')
    .select('id, empresa_id, nome_empresa, adquirente, ambiente, client_id, client_secret_criptografado, ativo, status_integracao, ec_adquirente')
    .eq('id', integrationId)
    .single()

  if (integrationError || !integracao) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Integracao nao encontrada.'
    })
  }

  if (String(integracao.adquirente || '').toLowerCase() !== 'rede') {
    throw createError({
      statusCode: 400,
      statusMessage: 'A consulta Pix da e.Rede esta disponivel apenas para integracoes da REDE.'
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
      quantidade_registros: 0,
      mensagem,
      payload_resumo: payloadResumo
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
  const dataBaseUrl = baseUrlOverride || getERedeDataBaseUrl(integracao.ambiente)
  const { endpointPath, queryParams, lookupType } = buildPixLookupTarget({ tid, reference })
  const authUrl = `${authBaseUrl}/oauth2/token`

  const authController = new AbortController()
  const authTimeout = setTimeout(() => authController.abort(), timeoutMs)

  try {
    const basicToken = Buffer
      .from(`${integracao.client_id}:${integracao.client_secret_criptografado}`)
      .toString('base64')

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
      const mensagem = `Falha na autenticacao OAuth2 da REDE para a e.Rede (${authResponse.status}).`

      await atualizarIntegracao({
        status_integracao: 'erro',
        ultimo_erro: mensagem
      })

      await inserirLog({
        tipoOperacao: 'auth_erede_pix',
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
            baseUrl: authBaseUrl,
            response: authPayload
          }
        }
      })
    }

    const accessTokenRede = String(authPayload?.access_token || '').trim()
    const tokenType = String(authPayload?.token_type || 'Bearer').trim() || 'Bearer'
    const requestUrl = buildRequestUrl(dataBaseUrl, endpointPath, queryParams)
    const requestController = new AbortController()
    const requestTimeout = setTimeout(() => requestController.abort(), timeoutMs)

    const requestResponse = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Authorization: `${tokenType} ${accessTokenRede}`,
        Accept: 'application/json'
      },
      signal: requestController.signal
    })

    clearTimeout(requestTimeout)

    const requestPayload = await parseResponseBody(requestResponse)
    const resolvedTid = String(
      requestPayload?.tid
      || requestPayload?.transaction?.tid
      || tid
      || ''
    ).trim()

    let refundsResult: any = {
      ok: false,
      url: null,
      httpStatus: null,
      response: null,
      message: 'Consulta de devolucao nao executada.'
    }

    if (includeRefunds && resolvedTid) {
      const refundsUrl = buildRequestUrl(dataBaseUrl, `/v2/transactions/${encodeURIComponent(resolvedTid)}/refunds`)
      const refundsController = new AbortController()
      const refundsTimeout = setTimeout(() => refundsController.abort(), timeoutMs)

      try {
        const refundsResponse = await fetch(refundsUrl, {
          method: 'GET',
          headers: {
            Authorization: `${tokenType} ${accessTokenRede}`,
            Accept: 'application/json'
          },
          signal: refundsController.signal
        })

        clearTimeout(refundsTimeout)

        const refundsPayload = await parseResponseBody(refundsResponse)
        refundsResult = {
          ok: refundsResponse.ok,
          url: refundsUrl,
          httpStatus: refundsResponse.status,
          response: refundsPayload,
          message: refundsResponse.ok
            ? 'Consulta de devolucao realizada com sucesso.'
            : `Falha ao consultar devolucao Pix (${refundsResponse.status}).`
        }
      } catch (refundsError: any) {
        clearTimeout(refundsTimeout)
        refundsResult = {
          ok: false,
          url: refundsUrl,
          httpStatus: null,
          response: null,
          message: normalizeServerError(refundsError, 'Falha ao consultar devolucao Pix.')
        }
      }
    }

    if (!requestResponse.ok) {
      const mensagem = `Autenticacao concluida, mas a consulta Pix da e.Rede falhou (${requestResponse.status}).`

      await atualizarIntegracao({
        status_integracao: 'erro',
        ultimo_erro: mensagem
      })

      await inserirLog({
        tipoOperacao: 'consulta_erede_pix',
        statusExecucao: 'erro',
        mensagem,
        httpStatus: requestResponse.status,
        payloadResumo: {
          lookupType,
          requestUrl,
          response: requestPayload
        }
      })

      throw createError({
        statusCode: 502,
        statusMessage: mensagem,
        data: {
          ok: false,
          errorStage: 'request',
          auth: {
            ok: true,
            authUrl,
            baseUrl: authBaseUrl,
            tokenType,
            accessTokenMasked: maskToken(accessTokenRede)
          },
          request: {
            ok: false,
            url: requestUrl,
            baseUrl: dataBaseUrl,
            lookupType,
            response: requestPayload
          }
        }
      })
    }

    await atualizarIntegracao({
      status_integracao: 'valida',
      ultima_sincronizacao_em: new Date().toISOString(),
      ultimo_erro: null
    })

    await inserirLog({
      tipoOperacao: 'consulta_erede_pix',
      statusExecucao: 'sucesso',
      mensagem: 'Consulta Pix da e.Rede realizada com sucesso.',
      httpStatus: requestResponse.status,
      payloadResumo: {
        lookupType,
        requestUrl,
        detectedAsPix: detectPixPayload(requestPayload)
      }
    })

    return {
      ok: true,
      integration: {
        id: integracao.id,
        empresa_id: integracao.empresa_id,
        nome_empresa: integracao.nome_empresa || null,
        adquirente: integracao.adquirente,
        ambiente: integracao.ambiente,
        ec_adquirente: integracao.ec_adquirente || null
      },
      auth: {
        ok: true,
        baseUrl: authBaseUrl,
        authUrl,
        httpStatus: authResponse.status,
        tokenType,
        accessTokenMasked: maskToken(accessTokenRede)
      },
      request: {
        ok: true,
        baseUrl: dataBaseUrl,
        url: requestUrl,
        httpStatus: requestResponse.status,
        lookupType,
        lookupValue: lookupType === 'tid' ? tid : reference,
        detectedAsPix: detectPixPayload(requestPayload),
        response: requestPayload
      },
      refunds: refundsResult,
      limitations: {
        supportsDateRangeImport: false,
        supportedLookups: ['reference', 'tid'],
        recommendation: 'Para conciliar Pix por periodo, sera necessario armazenar reference/tid/txid via criacao de cobranca e webhook.'
      }
    }
  } catch (error: any) {
    const mensagem = normalizeServerError(error, 'Erro interno ao consultar Pix da e.Rede.')

    if (!error?.statusCode || error.statusCode < 400) {
      await atualizarIntegracao({
        status_integracao: 'erro',
        ultimo_erro: mensagem
      })

      await inserirLog({
        tipoOperacao: 'consulta_erede_pix',
        statusExecucao: 'erro',
        mensagem
      })
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: mensagem,
      data: error?.data || {
        ok: false,
        errorStage: 'internal'
      }
    })
  } finally {
    clearTimeout(authTimeout)
  }
})
