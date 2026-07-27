import crypto from 'node:crypto'

const ENCRYPTED_PREFIX = 'enc:'
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

const decodeKey = (rawValue: string) => {
  const trimmed = String(rawValue || '').trim()
  if (!trimmed) return null

  const prefixedBase64 = trimmed.startsWith('base64:') ? trimmed.slice(7) : null
  if (prefixedBase64) {
    const decoded = Buffer.from(prefixedBase64, 'base64')
    return decoded.length === 32 ? decoded : null
  }

  const utf8Buffer = Buffer.from(trimmed, 'utf8')
  if (utf8Buffer.length === 32) {
    return utf8Buffer
  }

  const base64Buffer = Buffer.from(trimmed, 'base64')
  if (base64Buffer.length === 32 && base64Buffer.toString('base64').replace(/=+$/g, '') === trimmed.replace(/=+$/g, '')) {
    return base64Buffer
  }

  return null
}

const getEncryptionKey = () => {
  const config = useRuntimeConfig()
  const decoded = decodeKey(String(config.credentialsEncryptionKey || ''))

  if (!decoded) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Defina CREDENTIALS_ENCRYPTION_KEY com 32 bytes em UTF-8 ou Base64 para salvar credenciais da REDE por empresa.'
    })
  }

  return decoded
}

export const isEncryptedSecret = (value: unknown) => {
  return String(value || '').startsWith(ENCRYPTED_PREFIX)
}

export const encryptSecret = (plainText: unknown) => {
  const normalized = String(plainText || '')
  if (!normalized.trim()) return null

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, authTag, encrypted]).toString('base64')}`
}

export const decryptSecret = (payload: unknown) => {
  const normalized = String(payload || '').trim()
  if (!normalized) return ''

  if (!isEncryptedSecret(normalized)) {
    return normalized
  }

  const key = getEncryptionKey()
  const raw = Buffer.from(normalized.slice(ENCRYPTED_PREFIX.length), 'base64')

  if (raw.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw createError({
      statusCode: 500,
      statusMessage: 'O segredo salvo da REDE esta corrompido ou incompleto.'
    })
  }

  const iv = raw.subarray(0, IV_LENGTH)
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
