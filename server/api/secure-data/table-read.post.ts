import { createClient } from '@supabase/supabase-js'
import { extractBearerToken, getConfiguredAdminEmails } from '../../utils/adminAccess'
import { getSupabaseAdminClient } from '../../utils/supabaseAdmin'

const normalizeIdentifier = (value: unknown) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, '_')
  .replace(/-/g, '_')
  .replace(/[^a-z0-9_]/g, '')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '')

const normalizeProvider = (value: unknown) => {
  const normalized = normalizeIdentifier(value)
  const aliases: Record<string, string> = {
    pagbank: 'pagseguro',
    safrapay: 'safra'
  }
  return aliases[normalized] || normalized
}

const parseList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(normalizeProvider).filter(Boolean)
  }

  const text = String(value || '').trim()
  if (!text) return []

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeProvider).filter(Boolean)
    }
  } catch {}

  return text
    .split(/[;,\n|/]+/)
    .map(normalizeProvider)
    .filter(Boolean)
}

const normalizeBank = (value: unknown) => {
  const normalized = normalizeIdentifier(value)
  const aliases: Record<string, string> = {
    banco_do_nordeste: 'nordeste',
    banco_nordeste: 'nordeste',
    banco_do_brasil: 'brasil'
  }
  return aliases[normalized] || normalized
}

const buildAllowedTables = (empresa: any) => {
  const empresaNorm = normalizeIdentifier(empresa?.nome_empresa)
  if (!empresaNorm) return []

  const providers = Array.from(new Set([
    ...parseList(empresa?.autorizadoras),
    ...parseList(empresa?.vouchers_cadastrados),
    'azulzinha'
  ]))
  const banks = parseList(empresa?.bancos).map(normalizeBank)
  const tables = new Set<string>()

  providers.forEach((provider) => {
    tables.add(`vendas_${empresaNorm}_${provider}`)
    tables.add(`recebimento_${empresaNorm}_${provider}`)
  })

  banks.forEach((bank) => {
    tables.add(`banco_${bank}_${empresaNorm}`)
  })

  tables.add(`vendas_pix_${empresaNorm}`)
  tables.add(`recebimento_pix_${empresaNorm}`)

  return Array.from(tables)
}

const applyMatrizFilter = (query: any, matrizValue: unknown, matrizColumn = 'matriz') => {
  const matrizLimpa = String(matrizValue ?? '').replace(/[^\d]/g, '')
  const matrizNumero = Number(matrizLimpa)

  if (matrizLimpa && !Number.isNaN(matrizNumero)) {
    return query.or(`${matrizColumn}.eq.${matrizLimpa},${matrizColumn}.eq.${matrizNumero}`)
  }

  return query.eq(matrizColumn, String(matrizValue ?? ''))
}

export default defineEventHandler(async (event) => {
  const accessToken = extractBearerToken(event)

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessao expirada. Faca login novamente.'
    })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl
  const supabaseAnonKey = config.public?.supabaseAnonKey

  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configuracao do Supabase nao encontrada no servidor.'
    })
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken)

  if (authError || !authData?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessao invalida. Faca login novamente.'
    })
  }

  const body = await readBody(event)
  const table = normalizeIdentifier(body?.table)
  const columns = String(body?.columns || '*').trim() || '*'
  const from = Math.max(0, Number(body?.from || 0))
  const to = Math.max(from, Number(body?.to ?? from + 999))
  const existsOnly = Boolean(body?.existsOnly)
  const filters = body?.filters && typeof body.filters === 'object' ? body.filters : {}

  if (!table || !/^[a-z0-9_]+$/.test(table)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tabela invalida para leitura.'
    })
  }

  const userEmail = String(authData.user.email || '').trim().toLowerCase()
  const adminEmails = getConfiguredAdminEmails()
  const isAdmin = adminEmails.includes(userEmail)

  if (!isAdmin) {
    const adminClient = getSupabaseAdminClient()
    const { data: empresasPermitidas, error: empresasError } = await adminClient
      .from('empresas')
      .select('nome_empresa, autorizadoras, vouchers_cadastrados, bancos')
      .eq('email', userEmail)

    if (empresasError) throw empresasError

    const tabelasPermitidas = new Set(
      (empresasPermitidas || []).flatMap(buildAllowedTables)
    )

    if (!tabelasPermitidas.has(table)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Voce nao tem permissao para ler esta tabela.'
      })
    }
  }

  const adminClient = getSupabaseAdminClient()

  try {
    if (existsOnly) {
      const { error } = await adminClient
        .from(table)
        .select('id', { count: 'exact', head: true })
        .limit(1)

      if (error) {
        if (String(error?.message || '').toLowerCase().includes('does not exist') || error?.code === '42P01') {
          return { exists: false }
        }
        throw error
      }

      return { exists: true }
    }

    let query = adminClient
      .from(table)
      .select(columns)
      .range(from, to)

    if (filters.empresa) {
      query = query.ilike('empresa', String(filters.empresa))
    }

    if (filters.matriz) {
      query = applyMatrizFilter(query, filters.matriz)
    }

    if (Array.isArray(filters.nsus) && filters.nsus.length > 0) {
      query = query.in('nsu', filters.nsus)
    } else if (filters.nsu) {
      query = query.eq('nsu', filters.nsu)
    }

    const dateColumn = String(filters.dateColumn || '').trim()
    if (filters.dataInicial && dateColumn) {
      query = query.gte(dateColumn, filters.dataInicial)
    }
    if (filters.dataFinal && dateColumn) {
      query = query.lte(dateColumn, filters.dataFinal)
    }

    if (filters.eq && typeof filters.eq === 'object') {
      for (const [column, value] of Object.entries(filters.eq)) {
        if (!column) continue
        query = query.eq(column, value as any)
      }
    }

    if (filters.ilike && typeof filters.ilike === 'object') {
      for (const [column, value] of Object.entries(filters.ilike)) {
        if (!column || value == null || value === '') continue
        query = query.ilike(column, String(value))
      }
    }

    if (Array.isArray(filters.orderBy)) {
      for (const item of filters.orderBy) {
        const column = String(item?.column || '').trim()
        if (!column) continue
        query = query.order(column, { ascending: item?.ascending !== false })
      }
    }

    const { data, error } = await query

    if (error) {
      if (String(error?.message || '').toLowerCase().includes('does not exist') || error?.code === '42P01') {
        return { data: [] }
      }
      throw error
    }

    return {
      data: Array.isArray(data) ? data : []
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: String(error?.message || 'Erro ao ler dados da tabela.')
    })
  }
})
