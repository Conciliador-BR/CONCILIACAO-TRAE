import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'

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

  let request = supabase.from('cadastro_senhas').delete()

  if (Number.isFinite(id) && id > 0) {
    request = request.eq('id', id)
  } else {
    request = request.match({
      empresa: String(body?.empresa ?? '').trim(),
      ec: normalizeEc(body?.ec),
      adquirente: String(body?.adquirente ?? '').trim(),
      login: String(body?.login ?? '').trim(),
      portal: String(body?.portal ?? '').trim()
    })
  }

  const { error } = await request

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao remover senha.'
    })
  }

  return { ok: true }
})
