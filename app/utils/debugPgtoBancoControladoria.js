const DEFAULT_SESSION_ID = 'tabelas-pgto-banco-controladoria'
const ENABLED_STORAGE_KEY = 'debug:tabelas_pgto_banco_controladoria:enabled'

const getDebugEndpoint = () => {
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

export const getPgtoBancoDebugSessionId = () => DEFAULT_SESSION_ID

export const isPgtoBancoDebugEnabled = () => {
  if (!process.client) return false
  const flag = window.localStorage.getItem(ENABLED_STORAGE_KEY)
  return flag !== 'false'
}

export const logPgtoBancoDebug = ({
  runId = 'default',
  hypothesisId = 'GEN',
  location,
  msg,
  data = {}
}) => {
  if (!process.client || !isPgtoBancoDebugEnabled()) return
  const endpoint = getDebugEndpoint()
  if (!endpoint) return

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: DEFAULT_SESSION_ID,
      runId,
      hypothesisId,
      location,
      msg,
      data,
      ts: Date.now()
    })
  }).catch(() => {})
}
