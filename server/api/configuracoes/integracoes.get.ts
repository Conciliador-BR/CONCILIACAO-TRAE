import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const supabase = createSupabaseServerClient(accessToken)
  const query = getQuery(event)

  let request = supabase
    .from('integracoes_empresa')
    .select('id, empresa_id, nome_empresa, matriz, adquirente, ambiente, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (query.empresaId) {
    request = request.eq('empresa_id', query.empresaId)
  }

  if (query.status) {
    request = request.eq('status_integracao', query.status)
  }

  const { data, error } = await request

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao listar integracoes.'
    })
  }

  return Array.isArray(data) ? data : []
})
