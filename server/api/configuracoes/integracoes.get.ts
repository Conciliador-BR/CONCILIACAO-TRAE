import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'

const CREDENCIAIS_TABLE = 'credenciais_adquirente'

const normalizeText = (value: unknown) => String(value || '').trim()
const normalizeCnpj = (value: unknown) => String(value || '').replace(/\D/g, '').trim()

const normalizeCompare = (value: unknown) => {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const serializeIntegracao = (item: any) => ({
  ...item,
  client_secret_criptografado: undefined,
  has_company_credentials: !!(String(item?.client_id || '').trim() && String(item?.client_secret_criptografado || '').trim()),
  credential_mode: String(item?.client_id || '').trim() && String(item?.client_secret_criptografado || '').trim()
    ? 'empresa'
    : 'global'
})

const resolveEmpresaFromCredential = (empresas: any[], empresaNome: string, ec: string) => {
  const empresaNomeNormalizado = normalizeCompare(empresaNome)
  const ecNormalizado = normalizeText(ec)

  return (empresas || []).find((item) => {
    const sameEmpresa = normalizeCompare(item?.nome_empresa) === empresaNomeNormalizado
    const sameEc = !ecNormalizado || normalizeText(item?.matriz_ec) === ecNormalizado
    return sameEmpresa && sameEc
  }) || null
}

const mapVrCredential = (item: any, empresas: any[]) => {
  const empresaNome = normalizeText(item?.empresas)
  const ec = normalizeText(item?.ec)
  const empresaRelacionada = resolveEmpresaFromCredential(empresas, empresaNome, ec)

  return serializeIntegracao({
    id: item?.id || null,
    source_table: CREDENCIAIS_TABLE,
    empresa_id: empresaRelacionada?.id || null,
    nome_empresa: empresaNome || empresaRelacionada?.nome_empresa || null,
    matriz: ec || empresaRelacionada?.matriz_ec || null,
    empresas: empresaNome || null,
    ec: ec || null,
    adquirente: normalizeText(item?.adquirente || 'vr') || 'vr',
    ambiente: normalizeText(item?.ambiente || 'producao') || 'producao',
    ativo: item?.ativo !== false,
    status_integracao: item?.ativo === false ? 'pendente' : 'valida',
    ultima_validacao_em: null,
    ultimo_erro: null,
    ultima_sincronizacao_em: null,
    ec_adquirente: ec || null,
    client_id: normalizeText(item?.client_id) || null,
    client_secret_criptografado: item?.client_secret_criptografado || null,
    cnpj: normalizeCnpj(item?.client_secret_criptografado) || null,
    ultimo_optin_em: null,
    ultimo_optin_status: null,
    ultimo_optin_erro: null,
    created_at: item?.created_at || null,
    updated_at: item?.updated_at || null
  })
}

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const supabase = createSupabaseServerClient(accessToken)
  const query = getQuery(event)

  const empresaId = normalizeText(query.empresaId)
  let empresaFiltro: any = null

  if (empresaId) {
    const { data: empresaData, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome_empresa, matriz_ec')
      .eq('id', empresaId)
      .maybeSingle()

    if (empresaError) {
      throw createError({
        statusCode: 500,
        statusMessage: empresaError.message || 'Erro ao carregar a empresa do filtro.'
      })
    }

    empresaFiltro = empresaData || null
  }

  const { data: empresasRelacionadas, error: empresasError } = await supabase
    .from('empresas')
    .select('id, nome_empresa, matriz_ec')

  let request = supabase
    .from('integracoes_empresa')
    .select('id, empresa_id, nome_empresa, matriz, adquirente, ambiente, ativo, status_integracao, ultima_validacao_em, ultimo_erro, ultima_sincronizacao_em, ec_adquirente, client_id, client_secret_criptografado, ultimo_optin_em, ultimo_optin_status, ultimo_optin_erro, created_at, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (empresaId) {
    request = request.eq('empresa_id', empresaId)
  }

  if (query.status) {
    request = request.eq('status_integracao', query.status)
  }

  let vrRequest = supabase
    .from(CREDENCIAIS_TABLE)
    .select('id, adquirente, ambiente, ativo, client_id, client_secret_criptografado, empresas, ec, created_at, updated_at')
    .eq('adquirente', 'vr')
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (empresaFiltro?.nome_empresa) {
    vrRequest = vrRequest.eq('empresas', normalizeText(empresaFiltro.nome_empresa))
  }

  if (empresaFiltro?.matriz_ec) {
    vrRequest = vrRequest.eq('ec', normalizeText(empresaFiltro.matriz_ec))
  }

  const [{ data, error }, { data: vrData, error: vrError }] = await Promise.all([
    request,
    vrRequest
  ])

  if (empresasError) {
    throw createError({
      statusCode: 500,
      statusMessage: empresasError.message || 'Erro ao carregar empresas para relacionar as credenciais.'
    })
  }

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao listar integracoes.'
    })
  }

  if (vrError) {
    throw createError({
      statusCode: 500,
      statusMessage: vrError.message || 'Erro ao listar credenciais da VR.'
    })
  }

  const integracoesRede = Array.isArray(data) ? data.map((item) => serializeIntegracao({
    ...item,
    source_table: 'integracoes_empresa'
  })) : []

  const integracoesVr = Array.isArray(vrData)
    ? vrData.map((item) => mapVrCredential(item, empresasRelacionadas || []))
    : []

  return [...integracoesRede, ...integracoesVr]
    .sort((left, right) => {
      const leftTime = new Date(left?.updated_at || left?.created_at || 0).getTime()
      const rightTime = new Date(right?.updated_at || right?.created_at || 0).getTime()
      return rightTime - leftTime
    })
})
