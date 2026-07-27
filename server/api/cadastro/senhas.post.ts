import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'
import { buildCadastroSenhasSelect, isCadastroSenhasEcMissingError } from '../../utils/cadastroSenhas'

const normalizeEc = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : String(value).trim()
}

const mapSenha = (senha: any) => ({
  empresa: String(senha?.empresa ?? '').trim(),
  ec: normalizeEc(senha?.ec),
  adquirente: String(senha?.adquirente ?? '').trim(),
  portal: String(senha?.portal ?? '').trim(),
  banco: String(senha?.banco ?? '').trim(),
  agencia: String(senha?.agencia ?? '').trim(),
  conta: String(senha?.conta ?? '').trim(),
  login: String(senha?.login ?? '').trim(),
  senha: String(senha?.senha ?? ''),
  temSenha: !!senha?.temSenha,
  id: Number.isFinite(Number(senha?.id)) ? Number(senha.id) : null
})

const buildCompositeKey = (senha: any, includeEc = true) => {
  const keyParts = [
    String(senha?.empresa ?? '').trim().toLowerCase(),
    String(senha?.adquirente ?? '').trim().toLowerCase(),
    String(senha?.portal ?? '').trim().toLowerCase(),
    String(senha?.login ?? '').trim().toLowerCase()
  ]

  if (includeEc) {
    keyParts.splice(1, 0, String(normalizeEc(senha?.ec) ?? ''))
  }

  return keyParts.join('|')
}

const buildScopeKey = (senha: any, includeEc = true) => {
  const keyParts = [String(senha?.empresa ?? '').trim().toLowerCase()]

  if (includeEc) {
    keyParts.push(String(normalizeEc(senha?.ec) ?? ''))
  }

  return keyParts.join('|')
}

const validateSenha = (senha: any) => {
  const errors = []
  if (!senha.empresa) errors.push('Empresa e obrigatoria')
  if (senha.ec === null || senha.ec === undefined || senha.ec === '') errors.push('EC e obrigatorio')
  if (!senha.login) errors.push('Login e obrigatorio')
  if (!senha.senha && !senha.temSenha) errors.push('Senha e obrigatoria')
  return errors
}

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const supabase = createSupabaseServerClient(accessToken)
  const body = await readBody(event)
  const senhas = Array.isArray(body?.senhas) ? body.senhas : []

  if (!senhas.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nenhuma senha valida foi enviada.'
    })
  }

  const mapped = senhas.map(mapSenha)
  const errors: string[] = []

  mapped.forEach((senha, index) => {
    const validation = validateSenha(senha)
    if (validation.length > 0) {
      errors.push(`Senha ${index + 1}: ${validation.join(', ')}`)
    }
  })

  if (errors.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: errors.join('; ')
    })
  }

  const empresas = [...new Set(mapped.map(item => item.empresa).filter(Boolean))]
  let hasEcColumn = true

  const fetchExistingRows = async (includeEc: boolean) => {
    return await supabase
      .from('cadastro_senhas')
      .select(buildCadastroSenhasSelect({ includeEc, includeSenha: true }))
      .in('empresa', empresas)
  }

  let { data: existingRows, error: fetchError } = await fetchExistingRows(true)

  if (fetchError && isCadastroSenhasEcMissingError(fetchError)) {
    hasEcColumn = false
    const fallbackFetch = await fetchExistingRows(false)
    existingRows = fallbackFetch.data
    fetchError = fallbackFetch.error
  }

  if (fetchError) {
    throw createError({
      statusCode: 500,
      statusMessage: fetchError.message || 'Erro ao buscar senhas atuais.'
    })
  }

  const existing = Array.isArray(existingRows) ? existingRows : []
  const existingById = new Map(existing.map(item => [Number(item.id), item]))
  const existingByKey = new Map(existing.map(item => [buildCompositeKey(item, hasEcColumn), item]))
  const keepIds = new Set<number>()
  const targetScopes = new Set(mapped.map(item => buildScopeKey(item, hasEcColumn)))

  for (const senha of mapped) {
    const compositeKey = buildCompositeKey(senha, hasEcColumn)
    const current = senha.id
      ? existingById.get(Number(senha.id)) || existingByKey.get(compositeKey)
      : existingByKey.get(compositeKey)

    const payload: Record<string, any> = {
      empresa: senha.empresa,
      adquirente: senha.adquirente,
      portal: senha.portal,
      banco: senha.banco,
      agencia: senha.agencia,
      conta: senha.conta,
      login: senha.login,
      senha: senha.senha || current?.senha || ''
    }

    if (hasEcColumn) {
      payload.ec = senha.ec
    }

    if (!payload.senha) {
      throw createError({
        statusCode: 400,
        statusMessage: `A senha do login ${senha.login} precisa ser informada.`
      })
    }

    if (current?.id) {
      const { error: updateError } = await supabase
        .from('cadastro_senhas')
        .update(payload)
        .eq('id', current.id)

      if (updateError) {
        throw createError({
          statusCode: 500,
          statusMessage: updateError.message || 'Erro ao atualizar senha.'
        })
      }

      keepIds.add(Number(current.id))
      continue
    }

    const { data: inserted, error: insertError } = await supabase
      .from('cadastro_senhas')
      .insert(payload)
      .select('id')
      .single()

    if (insertError) {
      throw createError({
        statusCode: 500,
        statusMessage: insertError.message || 'Erro ao inserir senha.'
      })
    }

    if (inserted?.id) {
      keepIds.add(Number(inserted.id))
    }
  }

  const staleIds = existing
    .filter(item => targetScopes.has(buildScopeKey(item, hasEcColumn)))
    .map(item => Number(item.id))
    .filter(id => Number.isFinite(id) && !keepIds.has(id))

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('cadastro_senhas')
      .delete()
      .in('id', staleIds)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: deleteError.message || 'Erro ao remover senhas antigas.'
      })
    }
  }

  return {
    ok: true,
    processadas: mapped.length,
    sucesso: mapped.length,
    falha: 0,
    erros: []
  }
})
