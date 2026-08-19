import { createSupabaseServerClient } from './redeIntegration'

const CREDENCIAIS_TABLE = 'credenciais_adquirente'

const normalizeText = (value: unknown) => String(value || '').trim()

const normalizeIdentifier = (value: unknown) => {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export const resolveVrCredential = async ({
  accessToken,
  adquirente = 'vr',
  empresaNome,
  ec
}: {
  accessToken?: string
  adquirente?: string
  empresaNome?: string
  ec?: string
}) => {
  const adquirenteNormalizado = normalizeIdentifier(adquirente || 'vr') || 'vr'
  const empresaNormalizada = normalizeText(empresaNome)
  const ecNormalizado = normalizeText(ec)

  if (!empresaNormalizada) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Selecione uma empresa para localizar o arquivo cadastrado da VR.'
    })
  }

  if (!ecNormalizado) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nao foi possivel identificar o EC da empresa para localizar o arquivo da VR.'
    })
  }

  const supabase = createSupabaseServerClient(accessToken)
  const { data, error } = await supabase
    .from(CREDENCIAIS_TABLE)
    .select('id, adquirente, ambiente, ativo, client_id, client_secret_criptografado, empresas, ec, created_at, updated_at')
    .eq('adquirente', adquirenteNormalizado)
    .eq('empresas', empresaNormalizada)
    .eq('ec', ecNormalizado)
    .eq('ativo', true)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao buscar credencial da VR.'
    })
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: `Nenhum cadastro ativo da VR foi encontrado para a empresa ${empresaNormalizada} com EC ${ecNormalizado}.`
    })
  }

  if (!normalizeText(data.client_id)) {
    throw createError({
      statusCode: 400,
      statusMessage: `O cadastro da VR da empresa ${empresaNormalizada} com EC ${ecNormalizado} nao possui nome de arquivo em client_id.`
    })
  }

  return data
}
