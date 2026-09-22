// Sistema de logs seguro que remove informações sensíveis em produção
export const useSecureLogger = () => {
  // Mover useRuntimeConfig para dentro da função
  const config = useRuntimeConfig()
  const isDevelopment = config.public.nodeEnv === 'development'
  
  // Lista de campos sensíveis que nunca devem ser logados
  const sensitiveFields = [
    'password', 'senha', 'token', 'key', 'secret', 'api_key',
    'valor', 'valor_liquido', 'valor_bruto', 'cpf', 'cnpj',
    'conta', 'agencia', 'banco', 'cartao', 'nsu', 'authorization'
  ]
  
  // Lista de padrões que indicam informações sensíveis
  const sensitivePatterns = [
    /\d{11}/, // CPF
    /\d{14}/, // CNPJ
    /\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/, // Cartão de crédito
    /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // JWT tokens
  ]
  
  // Função para sanitizar objetos removendo campos sensíveis
  const sanitizeData = (data) => {
    if (!data || typeof data !== 'object') {
      // Verificar se é string sensível
      if (typeof data === 'string') {
        for (const pattern of sensitivePatterns) {
          if (pattern.test(data)) {
            return '[REDACTED]'
          }
        }
      }
      return data
    }
    
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item))
    }
    
    const sanitized = {}
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase()
      const isSensitive = sensitiveFields.some(field => keyLower.includes(field))
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeData(value)
      } else {
        sanitized[key] = sanitizeData(value)
      }
    }
    return sanitized
  }
  
  const secureLog = (level, message, data = null) => {
    const shouldLog = isDevelopment || level === 'error' || level === 'warn'
    if (!shouldLog) return
    
    const sanitizedData = data ? sanitizeData(data) : null
    
    switch (level) {
      case 'error':
        console.error('🔒 %s', message, sanitizedData)
        break
      case 'warn':
        console.warn('🔒 %s', message, sanitizedData)
        break
      case 'info':
        console.info('🔒 %s', message, sanitizedData)
        break
      default:
        console.log('🔒 %s', message, sanitizedData)
    }
  }
  
  // Wrapper para console.log que só funciona em desenvolvimento
  const devLog = (message, data = null) => {
    if (isDevelopment) {
      secureLog('log', message, data)
    }
  }
  
  // Wrapper para console.error que sempre funciona mas sanitiza dados
  const secureError = (message, data = null) => {
    secureLog('error', message, data)
  }
  
  // Wrapper para console.warn
  const secureWarn = (message, data = null) => {
    secureLog('warn', message, data)
  }
  
  return {
    log: devLog,
    error: secureError,
    warn: secureWarn,
    info: (message, data = null) => secureLog('info', message, data),
    sanitizeData,
    isDevelopment
  }
}
