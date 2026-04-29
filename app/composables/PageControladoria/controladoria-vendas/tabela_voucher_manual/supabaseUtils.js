export const isMissingColumnError = (err, columnName) => {
  const msg = String(err?.message || '')
  return msg.includes(`column "${columnName}"`) || msg.includes(`column '${columnName}'`)
}

export const normalizarEcNumerico = (value) => {
  if (value == null) return null
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

export const isMissingRelationError = (err) => {
  const code = String(err?.code || '')
  const msg = String(err?.message || '')
  return code === '42P01' || msg.toLowerCase().includes('does not exist')
}

export const criarVerificarTabelaExiste = ({ supabase }) => {
  const tabelaExisteCache = new Map()
  const tabelasEmpresaCache = new Map()
  const normalizarIdentificador = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  const verificarTabelaExiste = async (tableName) => {
    if (tabelaExisteCache.has(tableName)) {
      return tabelaExisteCache.get(tableName)
    }
    try {
      const { error: err } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (!err) {
        tabelaExisteCache.set(tableName, true)
        return true
      }

      const msg = String(err?.message || '')
      const code = String(err?.code || '')
      if (msg.includes('does not exist') || msg.includes('relation') || code === 'PGRST116' || isMissingRelationError(err)) {
        tabelaExisteCache.set(tableName, false)
        return false
      }

      tabelaExisteCache.set(tableName, false)
      return false
    } catch {
      tabelaExisteCache.set(tableName, false)
      return false
    }
  }

  const listarOperadorasComTabela = async (empresa, tipo = 'vendas') => {
    const empresaNorm = normalizarIdentificador(empresa)
    if (!empresaNorm) return []
    const tipoNorm = String(tipo || 'vendas').toLowerCase() === 'recebimento' ? 'recebimento' : 'vendas'
    const cacheKey = `${tipoNorm}:${empresaNorm}`
    if (tabelasEmpresaCache.has(cacheKey)) {
      return tabelasEmpresaCache.get(cacheKey)
    }

    try {
      const { data, error } = await supabase.rpc('admin_list_tables_for_company', {
        p_empresa: String(empresa || '')
      })
      if (error || !Array.isArray(data)) {
        tabelasEmpresaCache.set(cacheKey, [])
        return []
      }

      const prefixo = `${tipoNorm}_${empresaNorm}_`
      const operadoras = data
        .map(item => String(item?.table_name || ''))
        .filter(tableName => tableName.startsWith(prefixo))
        .map(tableName => tableName.slice(prefixo.length))
        .filter(Boolean)

      const unicas = [...new Set(operadoras)]
      tabelasEmpresaCache.set(cacheKey, unicas)
      return unicas
    } catch {
      tabelasEmpresaCache.set(cacheKey, [])
      return []
    }
  }

  return { verificarTabelaExiste, listarOperadorasComTabela }
}
