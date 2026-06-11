import {
  buildRequestUrl,
  createSupabaseServerClient,
  extractPrimaryCollection,
  getRedeAuthBaseUrl,
  getRedeDataBaseUrl,
  maskToken,
  normalizeServerError,
  parseJsonInput,
  parseResponseBody
} from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'

const SAMPLE_LOG_PAYLOAD_LIMIT = 1500

const truncatePayload = (value: unknown) => {
  try {
    const json = JSON.stringify(value)
    if (!json) return null
    if (json.length <= SAMPLE_LOG_PAYLOAD_LIMIT) return value
    return { truncated: true, preview: json.slice(0, SAMPLE_LOG_PAYLOAD_LIMIT) }
  } catch {
    return null
  }
}

const CURSOR_PARAM_CANDIDATES = [
  ['cursor', 'nextKey'],
  ['cursor', 'key'],
  ['cursor', 'next'],
  [null, 'nextKey'],
  [null, 'key'],
  [null, 'next']
] as const

const extractNextCursorParam = (payload: any) => {
  const hasNextKey = !!payload?.cursor?.hasNextKey
  if (!hasNextKey) return null

  for (const [parentKey, childKey] of CURSOR_PARAM_CANDIDATES) {
    const value = parentKey ? payload?.[parentKey]?.[childKey] : payload?.[childKey]
    if (value !== null && value !== undefined && String(value).trim()) {
      return {
        key: parentKey || childKey,
        value
      }
    }
  }

  return null
}

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const body = await readBody(event)
  const supabase = createSupabaseServerClient(accessToken)

  const integrationId = Number(body?.integrationId)
  const endpointPath = String(body?.endpointPath || '').trim()
  const method = String(body?.method || 'GET').trim().toUpperCase()
  const preferNovoSandbox = !!body?.preferNovoSandbox
  const baseUrlOverride = String(body?.baseUrlOverride || '').trim()
  const timeoutMs = Math.max(3000, Math.min(Number(body?.timeoutMs) || 20000, 60000))

  if (!integrationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe uma integracao valida para o teste.'
    })
  }

  if (!endpointPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe a rota de consulta que deseja testar.'
    })
  }

  const queryParams = parseJsonInput(body?.queryParams || {}, {})
  const requestBody = parseJsonInput(body?.requestBody || {}, {})
  const paymentsEndpointPath = String(body?.paymentsEndpointPath || '/merchant-statement/v1/payments').trim()
  const paymentsQueryParams = parseJsonInput(body?.paymentsQueryParams || queryParams, queryParams)
  const paginateAll = !!body?.paginateAll
  const maxPaginatedRecords = Math.max(1, Math.min(Number(body?.maxPaginatedRecords) || 500000, 500000))

  const { data: integracao, error: integrationError } = await supabase
    .from('integracoes_empresa')
    .select('id, empresa_id, nome_empresa, adquirente, ambiente, client_id, client_secret_criptografado, ativo, status_integracao, ec_adquirente, ultimo_optin_em, ultimo_optin_status')
    .eq('id', integrationId)
    .single()

  if (integrationError || !integracao) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Integracao nao encontrada. Verifique se a sessao do usuario esta ativa e se a integracao existe no cadastro.'
    })
  }

  if (String(integracao.adquirente || '').toLowerCase() !== 'rede') {
    throw createError({
      statusCode: 400,
      statusMessage: 'A pagina de teste atual foi preparada para integracoes da REDE.'
    })
  }

  const authBaseUrl = getRedeAuthBaseUrl(integracao.ambiente)
  const defaultDataBaseUrl = getRedeDataBaseUrl(integracao.ambiente, preferNovoSandbox)
  const dataBaseUrl = baseUrlOverride || defaultDataBaseUrl

  const inserirLog = async ({
    tipoOperacao,
    statusExecucao,
    mensagem,
    httpStatus = null,
    quantidadeRegistros = 0,
    payloadResumo = null
  }: {
    tipoOperacao: string
    statusExecucao: string
    mensagem: string
    httpStatus?: number | null
    quantidadeRegistros?: number
    payloadResumo?: any
  }) => {
    await supabase.from('logs_integracao').insert({
      empresa_id: integracao.empresa_id,
      integracao_id: integracao.id,
      adquirente: integracao.adquirente,
      tipo_operacao: tipoOperacao,
      status_execucao: statusExecucao,
      http_status: httpStatus,
      quantidade_registros: quantidadeRegistros,
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

  const authController = new AbortController()
  const authTimeout = setTimeout(() => authController.abort(), timeoutMs)

  try {
    const authUrl = `${authBaseUrl}/oauth2/token`
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
      const mensagem = `Falha na autenticacao OAuth2 da REDE (${authResponse.status}).`

      await atualizarIntegracao({
        status_integracao: 'erro',
        ultimo_erro: mensagem
      })

      await inserirLog({
        tipoOperacao: 'auth',
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
            baseUrl: authBaseUrl,
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
    const expiresIn = Number(authPayload?.expires_in || 0)
    const authSucceededAt = new Date()

    await atualizarIntegracao({
      status_integracao: 'valida',
      ultima_validacao_em: authSucceededAt.toISOString(),
      token_expira_em: expiresIn > 0 ? new Date(authSucceededAt.getTime() + expiresIn * 1000).toISOString() : null,
      ultimo_erro: null
    })

    await inserirLog({
      tipoOperacao: 'auth',
      statusExecucao: 'sucesso',
      mensagem: 'Token OAuth2 obtido com sucesso.',
      httpStatus: authResponse.status,
      payloadResumo: {
        auth_url: authUrl,
        token_type: tokenType,
        expires_in: expiresIn,
        scope: authPayload?.scope || null
      }
    })

    const requestQueryParams = { ...queryParams }
    const aggregatedRequestRecords: any[] = []
    const seenCursorKeys = new Set<string>()
    let requestUrl = ''
    let dataResponse: Response | null = null
    let dataPayload: any = null
    let collectionPath: string | null = null
    let records: any[] = []

    do {
      requestUrl = buildRequestUrl(dataBaseUrl, endpointPath, requestQueryParams)
    const requestHeaders: Record<string, string> = {
      Authorization: `${tokenType} ${accessToken}`,
      Accept: 'application/json'
    }

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders
    }

    if (method !== 'GET' && method !== 'HEAD') {
      requestHeaders['Content-Type'] = 'application/json'
      requestInit.body = JSON.stringify(requestBody || {})
    }

    const requestController = new AbortController()
    const requestTimeout = setTimeout(() => requestController.abort(), timeoutMs)
    requestInit.signal = requestController.signal

      dataResponse = await fetch(requestUrl, requestInit)
      clearTimeout(requestTimeout)

      dataPayload = await parseResponseBody(dataResponse)
      const extracted = extractPrimaryCollection(dataPayload)
      collectionPath = extracted.path
      records = Array.isArray(extracted.records) ? extracted.records : []
      aggregatedRequestRecords.push(...records)

      if (aggregatedRequestRecords.length >= maxPaginatedRecords) {
        aggregatedRequestRecords.length = maxPaginatedRecords
        break
      }

      if (!paginateAll || !dataResponse.ok) {
        break
      }

      const nextCursor = extractNextCursorParam(dataPayload)
      if (!nextCursor || seenCursorKeys.has(`${nextCursor.key}:${nextCursor.value}`)) {
        break
      }

      seenCursorKeys.add(`${nextCursor.key}:${nextCursor.value}`)
      requestQueryParams[nextCursor.key] = nextCursor.value
    } while (true)

    const quantidadeRegistros = aggregatedRequestRecords.length
    const requestSummary = {
      collectionPath,
      quantity: quantidadeRegistros,
      sample: quantidadeRegistros > 0 ? aggregatedRequestRecords[0] : null
    }

    if (!dataResponse?.ok) {
      const mensagem = `Autenticacao concluida, mas a consulta de dados falhou (${dataResponse.status}).`

      await atualizarIntegracao({
        status_integracao: 'erro',
        ultimo_erro: mensagem
      })

      await inserirLog({
        tipoOperacao: 'consulta_dados',
        statusExecucao: 'erro',
        mensagem,
        httpStatus: dataResponse.status,
        quantidadeRegistros,
        payloadResumo: {
          summary: requestSummary,
          response: dataPayload
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
            baseUrl: authBaseUrl,
            authUrl,
            tokenType,
            expiresIn,
            accessTokenMasked: maskToken(accessToken),
            scope: authPayload?.scope || null
          },
          request: {
            ok: false,
            baseUrl: dataBaseUrl,
            url: requestUrl,
            method,
            httpStatus: dataResponse.status,
            quantity: quantidadeRegistros,
            hasData: quantidadeRegistros > 0,
            collectionPath,
            sample: requestSummary.sample,
            response: dataPayload
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
      tipoOperacao: 'consulta_dados',
      statusExecucao: 'sucesso',
      mensagem: 'Consulta de dados realizada com sucesso.',
      httpStatus: dataResponse.status,
      quantidadeRegistros,
      payloadResumo: {
        summary: requestSummary,
        response: dataPayload
      }
    })

    let paymentsResult: any = {
      ok: false,
      baseUrl: dataBaseUrl,
      url: null,
      method: 'GET',
      httpStatus: null,
      quantity: 0,
      hasData: false,
      collectionPath: null,
      sample: null,
      transactions: [],
      response: null,
      message: 'Consulta de pagamentos ainda nao executada.'
    }

    if (paymentsEndpointPath) {
      const paymentsUrl = buildRequestUrl(dataBaseUrl, paymentsEndpointPath, paymentsQueryParams)
      const paymentsController = new AbortController()
      const paymentsTimeout = setTimeout(() => paymentsController.abort(), timeoutMs)

      try {
        const paymentsResponse = await fetch(paymentsUrl, {
          method: 'GET',
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
            Accept: 'application/json'
          },
          signal: paymentsController.signal
        })

        clearTimeout(paymentsTimeout)

        const paymentsPayload = await parseResponseBody(paymentsResponse)
        const { path: paymentsCollectionPath, records: paymentsRecords } = extractPrimaryCollection(paymentsPayload)
        const paymentsQuantity = Array.isArray(paymentsRecords) ? paymentsRecords.length : 0

        paymentsResult = {
          ok: paymentsResponse.ok,
          baseUrl: dataBaseUrl,
          url: paymentsUrl,
          method: 'GET',
          httpStatus: paymentsResponse.status,
          quantity: paymentsQuantity,
          hasData: paymentsQuantity > 0,
          collectionPath: paymentsCollectionPath,
          sample: paymentsQuantity > 0 ? paymentsRecords[0] : null,
          transactions: paymentsRecords,
          response: paymentsPayload,
          message: paymentsResponse.ok
            ? 'Consulta de pagamentos realizada com sucesso.'
            : `Falha na consulta de pagamentos (${paymentsResponse.status}).`
        }

        await inserirLog({
          tipoOperacao: 'consulta_pagamentos',
          statusExecucao: paymentsResponse.ok ? 'sucesso' : 'erro',
          mensagem: paymentsResult.message,
          httpStatus: paymentsResponse.status,
          quantidadeRegistros: paymentsQuantity,
          payloadResumo: {
            summary: {
              collectionPath: paymentsCollectionPath,
              quantity: paymentsQuantity,
              sample: paymentsResult.sample
            },
            response: paymentsPayload
          }
        })
      } catch (paymentsError: any) {
        clearTimeout(paymentsTimeout)
        paymentsResult = {
          ok: false,
          baseUrl: dataBaseUrl,
          url: paymentsUrl,
          method: 'GET',
          httpStatus: null,
          quantity: 0,
          hasData: false,
          collectionPath: null,
          sample: null,
          transactions: [],
          response: null,
          message: normalizeServerError(paymentsError, 'Falha ao consultar pagamentos.')
        }

        await inserirLog({
          tipoOperacao: 'consulta_pagamentos',
          statusExecucao: 'erro',
          mensagem: paymentsResult.message
        })
      }
    }

    return {
      ok: true,
      integration: {
        id: integracao.id,
        empresa_id: integracao.empresa_id,
        adquirente: integracao.adquirente,
        ambiente: integracao.ambiente,
        ativo: integracao.ativo,
        nome_empresa: integracao.nome_empresa || null,
        ec_adquirente: integracao.ec_adquirente || null,
        ultimo_optin_em: integracao.ultimo_optin_em || null,
        ultimo_optin_status: integracao.ultimo_optin_status || null
      },
      auth: {
        ok: true,
        baseUrl: authBaseUrl,
        authUrl,
        httpStatus: authResponse.status,
        tokenType,
        expiresIn,
        accessTokenMasked: maskToken(accessToken),
        scope: authPayload?.scope || null
      },
      request: {
        ok: true,
        baseUrl: dataBaseUrl,
        url: requestUrl,
        method,
        httpStatus: dataResponse.status,
        quantity: quantidadeRegistros,
        hasData: quantidadeRegistros > 0,
        collectionPath,
        transactions: aggregatedRequestRecords,
        sample: requestSummary.sample,
        response: dataPayload
      },
      payments: paymentsResult
    }
  } catch (error: any) {
    const mensagem = normalizeServerError(error)

    if (!error?.statusCode || error.statusCode < 400) {
      await atualizarIntegracao({
        status_integracao: 'erro',
        ultimo_erro: mensagem
      })

      await inserirLog({
        tipoOperacao: 'consulta_dados',
        statusExecucao: 'erro',
        mensagem
      })
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: mensagem,
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
