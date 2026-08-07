const DEFAULT_SESSION_ID = 'tabelas-pgto-banco-controladoria'
const ENABLED_STORAGE_KEY = 'debug:tabelas_pgto_banco_controladoria:enabled'
const ENDPOINT = 'http://127.0.0.1:7777/event'

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

  fetch(ENDPOINT, {
    method: 'POST',
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
