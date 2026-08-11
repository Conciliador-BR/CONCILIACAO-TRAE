const collectMessages = (error) => {
  const values = [
    error?.message,
    error?.statusMessage,
    error?.error_description,
    error?.details,
    error?.hint,
    error?.data?.message,
    error?.data?.error,
    error?.response?._data?.message,
    error?.response?._data?.error
  ]

  return values
    .map(value => String(value || '').trim())
    .filter(Boolean)
}

export const extractSupabaseErrorMessage = (error) => {
  const [message = 'Erro desconhecido ao consultar o Supabase.'] = collectMessages(error)
  return message
}

export const isMissingRelationError = (error) => {
  const code = String(error?.code || error?.data?.code || '').trim().toUpperCase()
  const message = collectMessages(error).join(' ').toLowerCase()

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (message.includes('relation') && message.includes('does not exist')) ||
    message.includes('could not find the table') ||
    message.includes('schema cache') && message.includes('table')
  )
}

export const isMissingColumnError = (error, columnName = '') => {
  const code = String(error?.code || error?.data?.code || '').trim().toUpperCase()
  const message = collectMessages(error).join(' ')
  const messageLower = message.toLowerCase()
  const column = String(columnName || '').trim()
  const columnLower = column.toLowerCase()

  if (column) {
    return (
      messageLower.includes(`column "${columnLower}"`) ||
      messageLower.includes(`column '${columnLower}'`) ||
      messageLower.includes(`column ${columnLower}`) ||
      messageLower.includes(`could not find the '${columnLower}' column`) ||
      messageLower.includes(`could not find the "${columnLower}" column`) ||
      (messageLower.includes(columnLower) && messageLower.includes('does not exist'))
    )
  }

  return code === '42703' || code === 'PGRST204' || (messageLower.includes('column') && messageLower.includes('does not exist'))
}
