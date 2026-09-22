const debugCounters = new Map()

export const normalizarSegmentoTabelaPix = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export const parsePixBRL = (value, round2) => {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const raw = String(value).trim()
  if (!raw) return 0

  const normalized = raw
    .replace(/\s/g, '')
    .replace(/[^0-9,.-]/g, '')

  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)

  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return 0
  return round2(parsed)
}

export const normalizarChavePix = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export const criarRowKeyPix = (prefix) => {
  const nextId = debugCounters.get(prefix) || 0
  debugCounters.set(prefix, nextId + 1)
  return `${prefix}-${Date.now()}-${nextId}`
}

export const clonarPixRows = (linhas = []) => {
  return (linhas || []).map((linha) => ({
    ...linha,
    _db_ids: Array.isArray(linha?._db_ids) ? [...linha._db_ids] : []
  }))
}

export const getPixDebugEndpoint = () => {
  if (!process.client) return ''

  const configured = String(useRuntimeConfig().public?.debugEventEndpoint || '').trim()
  if (!configured) return ''

  try {
    const endpoint = new URL(configured, window.location.origin)
    const isLoopback = ['127.0.0.1', 'localhost', '::1'].includes(endpoint.hostname)

    if (endpoint.protocol !== 'https:' && !isLoopback) {
      return ''
    }

    return endpoint.toString()
  } catch {
    return ''
  }
}

export const createPixDebugReporter = ({ sessionId, runId = 'pre-fix' }) => {
  return (hypothesisId, location, msg, data = {}) => {
    const endpoint = getPixDebugEndpoint()
    if (!endpoint) return

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        runId,
        hypothesisId,
        location,
        msg,
        data,
        ts: Date.now()
      })
    }).catch(() => {})
  }
}
