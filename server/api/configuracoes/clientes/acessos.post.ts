import { requireAdminAccess } from '../../../utils/adminAccess'
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin'

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase()
const normalizeDigits = (value: unknown) => String(value || '').replace(/\D/g, '')

const chunk = <T>(items: T[], size = 100) => {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

const findUserByEmail = async (adminClient: any, email: string) => {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const users = data?.users || []
    const found = users.find((user: any) => String(user?.email || '').toLowerCase() === email)
    if (found) return found
    if (users.length < perPage) break
    page += 1
  }

  return null
}

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)

  const body = await readBody(event)
  const email = normalizeEmail(body?.email)
  const password = String(body?.password || '').trim()
  const cnpjs = Array.from(new Set(
    (Array.isArray(body?.cnpjs) ? body.cnpjs : [])
      .map(normalizeDigits)
      .filter(Boolean)
  ))

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Informe o e-mail do cliente.' })
  }

  if (!password || password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  if (cnpjs.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Selecione pelo menos um CNPJ.' })
  }

  const adminClient = getSupabaseAdminClient()

  let authUser = await findUserByEmail(adminClient, email)

  if (authUser?.id) {
    const { data, error } = await adminClient.auth.admin.updateUserById(authUser.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'client',
        access_scope: 'restricted'
      }
    })

    if (error) throw error
    authUser = data.user
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'client',
        access_scope: 'restricted'
      }
    })

    if (error) throw error
    authUser = data.user
  }

  const cnpjsNumericos = cnpjs.map((value) => Number(value)).filter(Number.isFinite)

  const { data: empresasSelecionadas, error: empresasError } = await adminClient
    .from('empresas')
    .select('id, cnpj_empresa')
    .in('cnpj_empresa', cnpjsNumericos)

  if (empresasError) throw empresasError

  if (!empresasSelecionadas?.length) {
    throw createError({ statusCode: 404, statusMessage: 'Nenhum CNPJ selecionado foi encontrado na tabela empresas.' })
  }

  const idsSelecionados = empresasSelecionadas.map((item: any) => item.id).filter(Boolean)

  const { error: limparError } = await adminClient
    .from('empresas')
    .update({ email: null })
    .eq('email', email)
    .not('id', 'in', `(${idsSelecionados.join(',')})`)

  if (limparError && idsSelecionados.length > 0) throw limparError

  for (const lote of chunk(idsSelecionados, 200)) {
    const { error: vinculoError } = await adminClient
      .from('empresas')
      .update({ email })
      .in('id', lote)

    if (vinculoError) throw vinculoError
  }

  return {
    success: true,
    email,
    userId: authUser?.id || null,
    cnpjsVinculados: empresasSelecionadas.map((item: any) => String(item.cnpj_empresa || ''))
  }
})
