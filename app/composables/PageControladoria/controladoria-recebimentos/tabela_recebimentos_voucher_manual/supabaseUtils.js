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

  return { verificarTabelaExiste }
}

