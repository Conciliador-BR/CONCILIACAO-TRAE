import { createSupabaseServerClient } from '../../utils/redeIntegration'
import { requireAdminAccess } from '../../utils/adminAccess'
import { buildCadastroSenhasSelect, isCadastroSenhasEcMissingError } from '../../utils/cadastroSenhas'

const normalizeText = (value: unknown) => String(value ?? '').trim()

const normalizeEc = (value: unknown) => {
  const text = normalizeText(value)
  if (!text) return null

  const numeric = Number(text)
  return Number.isFinite(numeric) ? numeric : text
}

const normalizeId = (value: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const mapInputSenha = (senha: any) => ({
  id: normalizeId(senha?.id),
  empresaId: normalizeId(senha?.empresaId),
  empresa: normalizeText(senha?.empresa),
  ec: normalizeEc(senha?.ec),
  adquirente: normalizeText(senha?.adquirente),
  portal: normalizeText(senha?.portal),
  banco: normalizeText(senha?.banco),
  agencia: normalizeText(senha?.agencia),
  conta: normalizeText(senha?.conta),
  login: normalizeText(senha?.login),
  senha: String(senha?.senha ?? ''),
  temSenha: Boolean(senha?.temSenha)
})

type MappedSenha = ReturnType<typeof mapInputSenha>

const buildCompositeKey = (senha: any) => [
  normalizeText(senha?.empresa).toLowerCase(),
  String(normalizeEc(senha?.ec) ?? ''),
  normalizeText(senha?.adquirente).toLowerCase(),
  normalizeText(senha?.portal).toLowerCase(),
  normalizeText(senha?.login).toLowerCase()
].join('|')

const buildScopeKey = (senha: any) => [
  normalizeText(senha?.empresa).toLowerCase(),
  String(normalizeEc(senha?.ec) ?? '')
].join('|')

const validateSenha = (senha: any) => {
  const errors = []

  if (!senha.empresa) errors.push('Empresa e obrigatoria')
  if (senha.ec === null) errors.push('EC e obrigatorio')
  if (!senha.login) errors.push('Login e obrigatorio')
  if (!senha.senha && !senha.temSenha) errors.push('Senha e obrigatoria')

  return errors
}

const loadEmpresasById = async (supabase: any, empresaIds: number[]) => {
  if (!empresaIds.length) return new Map()

  const { data, error } = await supabase
    .from('empresas')
    .select('id, nome_empresa, matriz_ec')
    .in('id', empresaIds)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao buscar dados da empresa selecionada.'
    })
  }

  return new Map(
    (Array.isArray(data) ? data : []).map((empresa: any) => [
      Number(empresa.id),
      {
        id: Number(empresa.id),
        nome: normalizeText(empresa.nome_empresa),
        ec: normalizeEc(empresa.matriz_ec)
      }
    ])
  )
}

const enrichSenhaWithEmpresa = (senha: any, empresasById: Map<number, any>) => {
  if (!senha.empresaId) return senha

  const empresa = empresasById.get(senha.empresaId)
  if (!empresa) return senha

  return {
    ...senha,
    empresa: empresa.nome,
    ec: empresa.ec
  }
}

const assertCadastroSenhasEcColumn = async (supabase: any) => {
  const { error } = await supabase
    .from('cadastro_senhas')
    .select(buildCadastroSenhasSelect({ includeEc: true }))
    .limit(1)

  if (!error) return

  if (isCadastroSenhasEcMissingError(error)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A coluna cadastro_senhas.ec ainda nao existe neste banco. Aplique a migration "supabase/migrations/admin_ensure_cadastro_senhas_ec.sql" antes de salvar senhas por empresa + EC.'
    })
  }

  throw createError({
    statusCode: 500,
    statusMessage: error.message || 'Erro ao validar estrutura da tabela cadastro_senhas.'
  })
}

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const supabase = createSupabaseServerClient(accessToken)
  const body = await readBody(event)
  const rawSenhas = Array.isArray(body?.senhas) ? body.senhas : []

  if (!rawSenhas.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nenhuma senha valida foi enviada.'
    })
  }

  await assertCadastroSenhasEcColumn(supabase)

  const mappedSenhas: MappedSenha[] = rawSenhas.map(mapInputSenha)
  const empresaIds = [
    ...new Set(
      mappedSenhas
        .map((senha) => senha.empresaId)
        .filter((id): id is number => id !== null)
    )
  ]
  const empresasById = await loadEmpresasById(supabase, empresaIds)

  const senhasByKey = new Map<string, any>()
  for (const senha of mappedSenhas) {
    const senhaEnriquecida = enrichSenhaWithEmpresa(senha, empresasById)
    senhasByKey.set(buildCompositeKey(senhaEnriquecida), senhaEnriquecida)
  }

  const senhas = [...senhasByKey.values()]
  const errors: string[] = []

  senhas.forEach((senha, index) => {
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

  const empresas = [...new Set(senhas.map((senha) => senha.empresa).filter(Boolean))]
  const ecs = [...new Set(senhas.map((senha) => senha.ec).filter((ec) => ec !== null))]

  const { data: existingRows, error: fetchError } = await supabase
    .from('cadastro_senhas')
    .select('id, empresa, ec, adquirente, portal, banco, agencia, conta, login, senha')
    .in('empresa', empresas)
    .in('ec', ecs)

  if (fetchError) {
    throw createError({
      statusCode: 500,
      statusMessage: fetchError.message || 'Erro ao buscar senhas atuais.'
    })
  }

  const existing = Array.isArray(existingRows) ? existingRows : []
  const existingById = new Map(existing.map((item: any) => [Number(item.id), item]))
  const existingByKey = new Map(existing.map((item: any) => [buildCompositeKey(item), item]))
  const keepIds = new Set<number>()
  const targetScopes = new Set(senhas.map((senha) => buildScopeKey(senha)))

  for (const senha of senhas) {
    const currentById = senha.id ? existingById.get(Number(senha.id)) : null
    const current = currentById || existingByKey.get(buildCompositeKey(senha))

    const payload = {
      empresa: senha.empresa,
      ec: senha.ec,
      adquirente: senha.adquirente,
      portal: senha.portal,
      banco: senha.banco,
      agencia: senha.agencia,
      conta: senha.conta,
      login: senha.login,
      senha: senha.senha || current?.senha || ''
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
    } else {
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
  }

  const staleIds = existing
    .filter((item: any) => targetScopes.has(buildScopeKey(item)))
    .map((item: any) => Number(item.id))
    .filter((id: number) => Number.isFinite(id) && !keepIds.has(id))

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
    processadas: senhas.length,
    sucesso: senhas.length,
    falha: 0,
    erros: []
  }
})
