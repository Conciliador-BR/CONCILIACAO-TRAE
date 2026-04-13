export const toISODate = (input) => {
  if (!input) return ''
  const s = String(input).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m}-${d}`
  }
  const dt = new Date(s)
  if (Number.isFinite(dt.getTime())) {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return s
}

export const formatDateBR = (input) => {
  const iso = toISODate(input)
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const normalizeBrand = (b) => {
  if (!b) return ''
  const s = String(b).toUpperCase().trim()
  if (s.startsWith('MASTERCARD')) return 'MASTER'
  if (s.startsWith('MASTER')) return 'MASTER'
  if (s.startsWith('VISA')) return 'VISA'
  if (s.startsWith('ELO')) return 'ELO'
  if (s.startsWith('HIPER')) return 'HIPER'
  return s
}

export const toFixed2 = (val) => {
  const n = Number(String(val).replace(',', '.'))
  return Number.isFinite(n) ? n.toFixed(2) : String(val).trim()
}

export const sanitizeNSU = (nsu) => {
  const s = String(nsu || '').trim()
  const digits = s.replace(/\D/g, '')
  return digits.replace(/^0+/, '')
}

export const addMonthsISO = (isoDate, delta) => {
  const s = toISODate(isoDate)
  if (!s) return ''
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setMonth(dt.getMonth() + delta)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export const startOfMonthISO = (isoDate) => {
  const s = toISODate(isoDate)
  if (!s) return ''
  const [y, m] = s.split('-')
  return `${y}-${m}-01`
}

export const endOfMonthISO = (isoDate) => {
  const start = startOfMonthISO(isoDate)
  const nextMonthStart = addMonthsISO(start, 1)
  const dt = new Date(nextMonthStart)
  dt.setDate(dt.getDate() - 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
