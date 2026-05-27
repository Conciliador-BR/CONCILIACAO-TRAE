export const normalizarParaArquivo = (texto) => {
  if (!texto) return 'Todas_as_Empresas'

  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export const sleep = (ms = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const getBodyLayoutClass = (layout) => {
  if (layout === 'analise') return 'pdf-layout-analise'
  if (layout === 'recebimentos') return 'pdf-layout-recebimentos'
  return 'pdf-layout-vendas'
}

export const isPdfTargetReady = (target) => {
  if (!target) return false
  if (target.getAttribute('data-export-loading') === 'true') return false
  if (target.querySelector('.animate-spin')) return false

  const hasContent = Boolean(
    target.querySelector('table, canvas, .rounded-2xl, .rounded-lg, .shadow-xl, .shadow-sm')
  )

  const textLength = String(target.textContent || '')
    .replace(/\s+/g, '')
    .trim()
    .length

  return hasContent && textLength > 120
}

export const waitForPdfTarget = async ({
  targetId,
  timeoutMs = 20000,
  settleMs = 800
}) => {
  const startedAt = Date.now()

  while ((Date.now() - startedAt) < timeoutMs) {
    const target = document.getElementById(targetId)

    if (isPdfTargetReady(target)) {
      await sleep(settleMs)
      return target
    }

    await sleep(180)
  }

  const fallbackTarget = document.getElementById(targetId)
  if (fallbackTarget) {
    await sleep(settleMs)
    return fallbackTarget
  }

  return null
}

export const waitForPrintCompletion = () => {
  return new Promise((resolve) => {
    let finished = false

    const finalize = () => {
      if (finished) return
      finished = true
      window.removeEventListener('afterprint', handleAfterPrint)
      window.removeEventListener('focus', handleFocus)
      resolve()
    }

    const handleAfterPrint = () => {
      setTimeout(finalize, 80)
    }

    const handleFocus = () => {
      setTimeout(finalize, 180)
    }

    window.addEventListener('afterprint', handleAfterPrint)
    window.addEventListener('focus', handleFocus)

    setTimeout(finalize, 30000)
    window.print()
  })
}
