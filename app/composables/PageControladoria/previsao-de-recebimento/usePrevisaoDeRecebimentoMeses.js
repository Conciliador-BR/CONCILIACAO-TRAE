const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'long'
})

export const parsePrevisaoDate = (value) => {
  if (!value) return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime())
  }

  const text = String(value).trim()
  if (!text) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split('/').map(Number)
    const date = new Date(year, month - 1, day)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const fallback = new Date(text)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export const buildMesesDinamicos = (baseDate = new Date(), quantidade = 4) => {
  const meses = []
  const dataBase = baseDate instanceof Date && !Number.isNaN(baseDate.getTime())
    ? new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
    : new Date()

  for (let index = 0; index < quantidade; index += 1) {
    const date = new Date(dataBase.getFullYear(), dataBase.getMonth() + index, 1)
    meses.push({
      key: `mes_${index}`,
      index,
      month: date.getMonth(),
      year: date.getFullYear(),
      label: String(MONTH_LABEL_FORMATTER.format(date) || '').trim().toUpperCase(),
      sortKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    })
  }

  return meses
}

export const resolveMesKeyByDate = (dateValue, meses = []) => {
  const date = parsePrevisaoDate(dateValue)
  if (!date) return ''

  const month = date.getMonth()
  const year = date.getFullYear()
  const mes = meses.find(item => item.month === month && item.year === year)
  return mes?.key || ''
}
