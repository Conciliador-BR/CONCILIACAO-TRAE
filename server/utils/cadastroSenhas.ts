const extractMessage = (error: any) => {
  return String(
    error?.data?.statusMessage
    || error?.statusMessage
    || error?.message
    || ''
  )
}

export const isCadastroSenhasEcMissingError = (error: any) => {
  const message = extractMessage(error)
  return /column\s+cadastro_senhas\.ec\s+does not exist/i.test(message)
}

export const buildCadastroSenhasSelect = ({
  includeEc = true,
  includeSenha = false,
  includeCreatedAt = false
}: {
  includeEc?: boolean
  includeSenha?: boolean
  includeCreatedAt?: boolean
} = {}) => {
  const columns = [
    'id',
    'empresa',
    includeEc ? 'ec' : null,
    'adquirente',
    'portal',
    'banco',
    'agencia',
    'conta',
    'login',
    includeSenha ? 'senha' : null,
    includeCreatedAt ? 'created_at' : null
  ].filter(Boolean)

  return columns.join(', ')
}
