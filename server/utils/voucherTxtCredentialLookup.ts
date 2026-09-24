import { createSupabaseServerClient } from './redeIntegration'
import { getVoucherTxtAcquirerMeta } from './voucherTxtRemote'
import { normalizeVoucherTxtIdentifier } from './voucherTxtShared'

const CREDENCIAIS_TABLE = 'credenciais_adquirente'

const normalizeText = (value: unknown) => String(value || '').trim()
const normalizeDigits = (value: unknown) => String(value || '').replace(/\D/g, '')
const normalizeCompare = (value: unknown) => {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

const scoreCredentialCandidate = ({
  candidate,
  empresaNome,
  ec,
  cnpj
}: {
  candidate: Record<string, any>
  empresaNome: string
  ec: string
  cnpj: string
}) => {
  const empresaBusca = normalizeCompare(empresaNome)
  const empresaCandidate = normalizeCompare(candidate?.empresas)
  const ecBusca = normalizeText(ec)
  const ecBuscaDigits = normalizeDigits(ec)
  const ecCandidate = normalizeText(candidate?.ec)
  const ecCandidateDigits = normalizeDigits(candidate?.ec)
  const cnpjBuscaDigits = normalizeDigits(cnpj)
  const cnpjCandidateDigits = normalizeDigits(candidate?.client_secret_criptografado)

  let score = 0

  if (empresaBusca && empresaCandidate) {
    if (empresaCandidate === empresaBusca) score += 100
    else if (empresaCandidate.includes(empresaBusca) || empresaBusca.includes(empresaCandidate)) score += 70
  }

  if (ecBusca && ecCandidate) {
    if (ecCandidate === ecBusca) score += 120
    else if (ecCandidateDigits && ecBuscaDigits && ecCandidateDigits === ecBuscaDigits) score += 120
  }

  if (cnpjBuscaDigits && cnpjCandidateDigits && cnpjBuscaDigits === cnpjCandidateDigits) {
    score += 90
  }

  if (String(candidate?.ativo) !== 'false') score += 5

  return score
}

export const resolveVoucherTxtCredential = async ({
  accessToken,
  adquirente,
  empresaNome,
  ec,
  cnpj
}: {
  accessToken?: string
  adquirente: string
  empresaNome?: string
  ec?: string
  cnpj?: string
}) => {
  const meta = getVoucherTxtAcquirerMeta(adquirente)
  const adquirenteNormalizado = normalizeVoucherTxtIdentifier(adquirente || meta.id) || meta.id
  const empresaNormalizada = normalizeText(empresaNome)
  const ecNormalizado = normalizeText(ec)
  const cnpjNormalizado = normalizeDigits(cnpj)

  if (!empresaNormalizada) {
    throw createError({
      statusCode: 400,
      statusMessage: `Selecione uma empresa para localizar o cadastro da ${meta.label}.`
    })
  }

  if (!ecNormalizado) {
    throw createError({
      statusCode: 400,
      statusMessage: `Nao foi possivel identificar o EC da empresa para localizar o cadastro da ${meta.label}.`
    })
  }

  const supabase = createSupabaseServerClient(accessToken)
  const { data, error } = await supabase
    .from(CREDENCIAIS_TABLE)
    .select('id, adquirente, ambiente, ativo, client_id, client_secret_criptografado, empresas, ec, created_at, updated_at')
    .eq('adquirente', adquirenteNormalizado)
    .eq('ativo', true)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(50)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || `Erro ao buscar credencial da ${meta.label}.`
    })
  }

  const records = Array.isArray(data) ? data : []
  const ranked = records
    .map((candidate) => ({
      candidate,
      score: scoreCredentialCandidate({
        candidate,
        empresaNome: empresaNormalizada,
        ec: ecNormalizado,
        cnpj: cnpjNormalizado
      })
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)

  const resolved = ranked[0]?.candidate || null

  if (!resolved) {
    throw createError({
      statusCode: 404,
      statusMessage: `Nenhum cadastro ativo da ${meta.label} foi encontrado para a empresa ${empresaNormalizada} com EC ${ecNormalizado}.`
    })
  }

  if (!normalizeText(resolved.client_id)) {
    throw createError({
      statusCode: 400,
      statusMessage: `O cadastro da ${meta.label} da empresa ${empresaNormalizada} com EC ${ecNormalizado} nao possui ${meta.credentialFieldLabel} em client_id.`
    })
  }

  return resolved
}
