import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'
import { buildCadastroSenhasSelect, isCadastroSenhasEcMissingError } from '../../utils/cadastroSenhas'

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

  const buildRequest = (includeEc: boolean) => {
    let request = supabase
      .from('cadastro_senhas')
      .select(buildCadastroSenhasSelect({ includeEc, includeSenha: true, includeCreatedAt: true }))
      .order('created_at', { ascending: false, nullsFirst: false })

    if (query.empresa) {
      request = request.eq('empresa', query.empresa)
    }

    if (includeEc && query.ec !== undefined && query.ec !== null && query.ec !== '') {
      request = request.eq('ec', normalizeEc(query.ec))
    }

    if (query.adquirente) {
      request = request.eq('adquirente', query.adquirente)
    }

    return request
  }

  let hasEcColumn = true
  let { data, error } = await buildRequest(true)

  if (error && isCadastroSenhasEcMissingError(error)) {
    hasEcColumn = false
    const fallback = await buildRequest(false)
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao buscar senhas.'
    })
  }

  return (Array.isArray(data) ? data : []).map((row: Record<string, any>) => ({
    ...row,
    ec: hasEcColumn ? row.ec ?? null : normalizeEc(query.ec),
    senha: String(row.senha || ''),
    temSenha: !!row.senha
  }))
})
