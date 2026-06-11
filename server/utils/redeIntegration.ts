import { createClient } from '@supabase/supabase-js'

const REDE_AUTH_BASE_URLS: Record<string, string> = {
  sandbox: 'https://rl7-sandbox-api.useredecloud.com.br',
  producao: 'https://api.userede.com.br/redelabs'
}

const REDE_DATA_BASE_URLS: Record<string, string> = {
  sandbox: 'https://rl7-sandbox-api.useredecloud.com.br',
  sandbox_novo: 'https://payments-apisandbox.useredecloud.com.br',
  producao: 'https://api.userede.com.br/redelabs'
}

export const getRedeAuthBaseUrl = (ambiente = 'sandbox') => {
  return REDE_AUTH_BASE_URLS[String(ambiente || 'sandbox').toLowerCase()] || REDE_AUTH_BASE_URLS.sandbox
}

export const getRedeDataBaseUrl = (ambiente = 'sandbox', preferNovo = false) => {
  const normalized = String(ambiente || 'sandbox').toLowerCase()

  if (normalized === 'sandbox' && preferNovo) {
    return REDE_DATA_BASE_URLS.sandbox_novo
  }

  return REDE_DATA_BASE_URLS[normalized] || REDE_DATA_BASE_URLS.sandbox
}

export const createSupabaseServerClient = (accessToken = '') => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl
  const supabaseAnonKey = config.public?.supabaseAnonKey

  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configuracao do Supabase nao encontrada no servidor.'
    })
  }

  const headers: Record<string, string> = {}

  if (String(accessToken || '').trim()) {
    headers.Authorization = `Bearer ${String(accessToken).trim()}`
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers
    }
  })
}

export const normalizeServerError = (error: any, fallback = 'Erro interno ao testar a integracao.') => {
  if (!error) return fallback

  const message = error?.data?.statusMessage || error?.statusMessage || error?.message || fallback
  return String(message)
}

export const parseJsonInput = (value: unknown, fallback: Record<string, any> = {}) => {
  if (!value) return fallback
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>

  const text = String(value || '').trim()
  if (!text) return fallback

  return JSON.parse(text)
}

export const buildRequestUrl = (baseUrl: string, path: string, queryParams: Record<string, any> = {}) => {
  const isAbsolute = /^https?:\/\//i.test(path)
  const normalizedBase = String(baseUrl || '').replace(/\/+$/, '')
  const normalizedPath = isAbsolute ? path : `${normalizedBase}/${String(path || '').replace(/^\/+/, '')}`
  const url = new URL(normalizedPath)

  Object.entries(queryParams || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined && item !== '') {
          url.searchParams.append(key, String(item))
        }
      })
      return
    }

    if (typeof value === 'object') {
      url.searchParams.set(key, JSON.stringify(value))
      return
    }

    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

export const parseResponseBody = async (response: Response) => {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const maskToken = (token = '') => {
  const text = String(token || '')
  if (text.length <= 16) return text
  return `${text.slice(0, 8)}...${text.slice(-8)}`
}

type CollectionExtractionResult = {
  path: string | null
  records: any[]
}

const COLLECTION_CANDIDATE_PATHS = [
  'content.transactions',
  'content.paymentSummaries',
  'content.payments',
  'content.paymentOrders',
  'content.sales',
  'content.items',
  'content',
  'paymentSummaries',
  'payments',
  'paymentOrders',
  'transactions',
  'sales',
  'items',
  'data',
  'results'
]

const getValueByPath = (source: any, path: string) => {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), source)
}

export const extractPrimaryCollection = (payload: any): CollectionExtractionResult => {
  for (const path of COLLECTION_CANDIDATE_PATHS) {
    const value = getValueByPath(payload, path)
    if (Array.isArray(value)) {
      return {
        path,
        records: value
      }
    }
  }

  if (Array.isArray(payload)) {
    return {
      path: 'root',
      records: payload
    }
  }

  return {
    path: null,
    records: []
  }
}
