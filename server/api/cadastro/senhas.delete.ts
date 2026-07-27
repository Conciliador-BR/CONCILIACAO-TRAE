import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'
import { isCadastroSenhasEcMissingError } from '../../utils/cadastroSenhas'

const normalizeEc = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : String(value).trim()
}

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const supabase = createSupabaseServerClient(accessToken)
  const body = await readBody(event)
  const id = Number(body?.id)
  const empresa = String(body?.empresa ?? '').trim()
  const ec = normalizeEc(body?.ec)
  const adquirente = String(body?.adquirente ?? '').trim()
  const login = String(body?.login ?? '').trim()
  const portal = String(body?.portal ?? '').trim()

  const buildDeleteRequest = (includeEc: boolean) => {
    let request = supabase.from('cadastro_senhas').delete()

    if (Number.isFinite(id) && id > 0) {
      return request.eq('id', id)
    }

    request = request.match({
      empresa,
      adquirente,
      login,
      portal
    })

    if (includeEc) {
      request = request.eq('ec', ec)
    }

    return request
  }

  let { error } = await buildDeleteRequest(true)

  if (error && isCadastroSenhasEcMissingError(error)) {
    const fallback = await buildDeleteRequest(false)
    error = fallback.error
  }

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao remover senha.'
    })
  }

  return { ok: true }
})
