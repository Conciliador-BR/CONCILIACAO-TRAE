import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const supabase = createSupabaseServerClient(accessToken)
  const query = getQuery(event)
  const limit = Math.max(1, Math.min(Number(query.limit) || 12, 100))

  let request = supabase
    .from('logs_integracao')
    .select('id, empresa_id, integracao_id, adquirente, tipo_operacao, status_execucao, periodo_inicial, periodo_final, http_status, quantidade_registros, mensagem, request_id, payload_resumo, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (query.empresaId) {
    request = request.eq('empresa_id', query.empresaId)
  }

  if (query.integracaoId) {
    request = request.eq('integracao_id', query.integracaoId)
  }

  const { data, error } = await request

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao listar logs.'
    })
  }

  return Array.isArray(data) ? data : []
})
