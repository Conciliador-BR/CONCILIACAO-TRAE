export const STATUS_PASTAS_PADRAO = ['inbox', 'processando', 'processados', 'erro']

export const normalizeServidorSlug = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export const buildServidorPathPreview = ({ basePath = '/opt/conciliadora', adquirente = '', empresa = '', status = '' } = {}) => {
  const normalizedBasePath = String(basePath || '/opt/conciliadora')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '') || '/opt/conciliadora'

  const parts = [normalizedBasePath]

  if (adquirente) parts.push(normalizeServidorSlug(adquirente))
  if (empresa) parts.push(normalizeServidorSlug(empresa))
  if (status) parts.push(normalizeServidorSlug(status))

  return parts.join('/').replace(/\/+/g, '/')
}

export const validarCriacaoServidor = ({ adquirente = '', empresa = '' } = {}) => {
  const erros = []

  if (!normalizeServidorSlug(adquirente)) {
    erros.push('Selecione uma adquirente valida.')
  }

  if (!normalizeServidorSlug(empresa)) {
    erros.push('Informe a empresa que sera usada na pasta.')
  }

  return erros
}

export const validarRenomeacaoServidor = ({ selectedNode = null, novoNome = '' } = {}) => {
  const erros = []

  if (!selectedNode) {
    erros.push('Selecione uma pasta para renomear.')
  }

  if (!normalizeServidorSlug(novoNome)) {
    erros.push('Informe um novo nome valido para a pasta.')
  }

  return erros
}
