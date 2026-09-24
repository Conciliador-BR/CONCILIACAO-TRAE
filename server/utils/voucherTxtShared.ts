import path from 'node:path'

type TxtMatrix = Array<Array<string | number | Date>>

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30))

export const normalizeVoucherTxtIdentifier = (value: unknown) => {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export const normalizeVoucherTxtText = (value: unknown) => {
  if (value == null) return ''
  return String(value)
    .replace(/\u00A0/g, ' ')
    .replace(/[\u0000-\u001F]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export const normalizeVoucherTxtCnpj = (value: unknown) => String(value || '').replace(/\D/g, '')

export const parseVoucherTxtValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  let text = String(value).replace(/\u00A0/g, ' ').trim()
  text = text.replace(/R\$/gi, '').replace(/%/g, '').replace(/\s/g, '')

  const hasComma = text.includes(',')
  const hasDot = text.includes('.')

  if (hasComma && hasDot) {
    const lastComma = text.lastIndexOf(',')
    const lastDot = text.lastIndexOf('.')
    text = lastComma > lastDot
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/,/g, '')
  } else if (hasComma) {
    const parts = text.split(',')
    const integerPart = parts[0] || ''
    const decimalPart = parts[1] || ''
    text = parts.length === 2 && decimalPart.length <= 2
      ? `${integerPart.replace(/\./g, '')}.${decimalPart}`
      : text.replace(/,/g, '')
  }

  const parsed = parseFloat(text)
  return Number.isFinite(parsed) ? parsed : 0
}

export const excelSerialToIsoDate = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const ms = Math.round(value) * 86400000
  const date = new Date(EXCEL_EPOCH.getTime() + ms)
  const yyyy = String(date.getUTCFullYear()).padStart(4, '0')
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const parseVoucherTxtDate = (value: unknown) => {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'number') return excelSerialToIsoDate(value)
  if (Object.prototype.toString.call(value) === '[object Date]') {
    const date = value as Date
    const yyyy = String(date.getFullYear()).padStart(4, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const text = String(value).trim().replace(/\s+/g, ' ')
  const firstChunk = text.split(/[T\s]+/)[0] || ''

  const matchSlash = firstChunk.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (matchSlash) {
    const [, dd, mm, yyyy] = matchSlash
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
  }

  const matchIso = firstChunk.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = String(parsed.getFullYear()).padStart(4, '0')
    const mm = String(parsed.getMonth() + 1).padStart(2, '0')
    const dd = String(parsed.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  return null
}

export const formatVoucherTxtDisplayDate = (value: unknown) => {
  const iso = parseVoucherTxtDate(value)
  if (!iso) return ''
  const [yyyy, mm, dd] = iso.split('-')
  return `${dd}/${mm}/${yyyy}`
}

export const detectVoucherTxtHeaderRow = (matrix: TxtMatrix, candidates: string[], minHits = 2, maxLines = 30) => {
  const normalizedCandidates = candidates.map(normalizeVoucherTxtText)
  let bestIndex = 0
  let bestScore = -1

  for (let index = 0; index < Math.min(maxLines, matrix.length); index += 1) {
    const row = matrix[index] || []
    const normalizedRow = row.map((cell) => normalizeVoucherTxtText(cell))
    const hits = normalizedCandidates.filter((candidate) => normalizedRow.includes(candidate)).length

    if (hits > bestScore) {
      bestScore = hits
      bestIndex = index
    }

    if (hits >= minHits) {
      return { idx: index, headersNorm: normalizedRow }
    }
  }

  const fallbackRow = matrix[bestIndex] || []
  return {
    idx: bestIndex,
    headersNorm: fallbackRow.map((cell) => normalizeVoucherTxtText(cell))
  }
}

export const findVoucherTxtColumnIndex = (headersNorm: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeVoucherTxtText)

  for (const alias of normalizedAliases) {
    const index = headersNorm.indexOf(alias)
    if (index >= 0) return index
  }

  for (const alias of normalizedAliases) {
    const index = headersNorm.findIndex((header) => header.includes(alias))
    if (index >= 0) return index
  }

  return -1
}

const detectDelimiter = (content: string) => {
  const lines = String(content || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)

  const delimiters = [';', '\t', '|', ',']
  let selected = ''
  let bestScore = 0

  delimiters.forEach((delimiter) => {
    const score = lines.reduce((total, line) => total + (line.split(delimiter).length > 1 ? line.split(delimiter).length : 0), 0)
    if (score > bestScore) {
      bestScore = score
      selected = delimiter
    }
  })

  return bestScore > 0 ? selected : ''
}

const parseTxtWithXlsx = async (content: string, delimiter: string): Promise<TxtMatrix> => {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(content, {
    type: 'string',
    raw: false,
    cellDates: true,
    dateNF: 'dd/mm/yyyy',
    FS: delimiter
  })
  const firstSheetName = workbook.SheetNames?.[0]
  if (!firstSheetName) return []
  const worksheet = workbook.Sheets[firstSheetName]
  if (!worksheet) return []
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    dateNF: 'dd/mm/yyyy',
    defval: ''
  }) as TxtMatrix
}

export const parseVoucherTxtMatrix = async (content: string): Promise<TxtMatrix> => {
  const normalizedContent = String(content || '').replace(/^\uFEFF/, '')
  if (!normalizedContent.trim()) return []

  const delimiter = detectDelimiter(normalizedContent)
  if (delimiter) {
    const matrix = await parseTxtWithXlsx(normalizedContent, delimiter)
    if (matrix.length > 0) return matrix
  }

  return normalizedContent
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const cells = line.split(/\s{2,}/).map((cell) => cell.trim())
      return cells.length > 0 ? cells : [line.trim()]
    })
}

export const extractVoucherTxtReferenceDate = (fileName: string, modifiedAt?: string) => {
  const normalizedFileName = String(fileName || '')
  const ymdMatch = normalizedFileName.match(/(20\d{2})(\d{2})(\d{2})/)
  if (ymdMatch) return `${ymdMatch[1]}${ymdMatch[2]}${ymdMatch[3]}`

  const modifiedDate = parseVoucherTxtDate(modifiedAt)
  if (!modifiedDate) return ''
  return modifiedDate.replace(/-/g, '')
}

export const formatVoucherTxtDownloadTimestamp = (modifiedAt?: string) => {
  const text = String(modifiedAt || '').trim()
  if (!text) return ''

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return ''

  const yyyy = String(date.getFullYear()).padStart(4, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`
}

export const getVoucherTxtOriginalStem = (fileName: string) => {
  return path.posix.parse(String(fileName || '').trim()).name || ''
}

export const getVoucherTxtFileMatchToken = (value: unknown) => {
  return normalizeVoucherTxtText(value).replace(/[^A-Z0-9]/g, '')
}

