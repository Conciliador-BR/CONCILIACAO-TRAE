import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'

const normalizeEc = (value: unknown) => {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : raw
}

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const supabase = createSupabaseServerClient(accessToken)
  const query = getQuery(event)

  let request = supabase
    .from('cadastro_senhas')
    .select('id, empresa, ec, adquirente, portal, banco, agencia, conta, login, created_at')
    .order('created_at', { ascending: false, nullsFirst: false })

  if (query.empresa) {
    request = request.eq('empresa', query.empresa)
  }

  if (query.ec !== undefined && query.ec !== null && query.ec !== '') {
    request = request.eq('ec', normalizeEc(query.ec))
  }

  if (query.adquirente) {
    request = request.eq('adquirente', query.adquirente)
  }

  const { data, error } = await request

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao buscar senhas.'
    })
  }

  return (Array.isArray(data) ? data : []).map((row) => ({
    ...row,
    senha: '',
    temSenha: true
  }))
})
