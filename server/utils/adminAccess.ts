import { createClient } from '@supabase/supabase-js'

const normalizeEmailList = (value: string) => {
  return String(value || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export const getConfiguredAdminEmails = () => {
  const config = useRuntimeConfig()
  return normalizeEmailList(
    String(config.adminConfigEmails || config.public?.adminConfigEmails || '')
  )
}

export const extractBearerToken = (event: any) => {
  const authorization = getHeader(event, 'authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

export const requireAdminAccess = async (event: any) => {
  const accessToken = extractBearerToken(event)

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessao expirada. Faca login novamente.'
    })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl
  const supabaseAnonKey = config.public?.supabaseAnonKey

  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configuracao do Supabase nao encontrada no servidor.'
    })
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await authClient.auth.getUser(accessToken)

  if (error || !data?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessao invalida. Faca login novamente.'
    })
  }

  const adminEmails = getConfiguredAdminEmails()
  const userEmail = String(data.user.email || '').toLowerCase()

  if (!adminEmails.includes(userEmail)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Voce nao tem permissao para acessar esta funcionalidade.'
    })
  }

  return {
    user: data.user,
    accessToken
  }
}
