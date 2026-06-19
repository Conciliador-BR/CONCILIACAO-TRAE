import { promises as fs } from 'node:fs'
import path from 'node:path'

const DEFAULT_STATUS_DIRS = ['inbox', 'processando', 'processados', 'erro']
const DEFAULT_SUPPORT_DIRS = ['logs', 'backups']

export const normalizeInfraSegment = (value: unknown) => {
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

const toDisplayPath = (targetPath: string) => String(targetPath || '').replace(/\\/g, '/')

export const getInfraRuntimeConfig = () => {
  const config = useRuntimeConfig()
  const configuredStatusDirs = String(config.serverInfraStatusDirs || '')
    .split(',')
    .map(item => normalizeInfraSegment(item))
    .filter(Boolean)

  const statusDirs = configuredStatusDirs.length > 0 ? configuredStatusDirs : DEFAULT_STATUS_DIRS
  const basePath = String(config.serverInfraBasePath || '/opt/conciliadora').trim() || '/opt/conciliadora'

  return {
    basePath,
    statusDirs,
    supportDirs: DEFAULT_SUPPORT_DIRS,
    serverHost: String(config.public?.serverInfraHost || '').trim(),
    sshPublicKeyPath: String(config.public?.serverInfraSshPublicKeyPath || '').trim()
  }
}

const ensurePathInsideBase = (targetPath: string, basePath: string) => {
  const relative = path.relative(basePath, targetPath)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tentativa de acesso fora da base permitida do servidor.'
    })
  }
}

export const resolveInfraPath = (...segments: string[]) => {
  const { basePath } = getInfraRuntimeConfig()
  const baseAbsolutePath = path.resolve(basePath)
  const sanitizedSegments = segments
    .map(segment => normalizeInfraSegment(segment))
    .filter(Boolean)

  const targetPath = path.resolve(baseAbsolutePath, ...sanitizedSegments)
  ensurePathInsideBase(targetPath, baseAbsolutePath)

  return targetPath
}

export const buildInfraDisplayPath = (...segments: string[]) => {
  const { basePath } = getInfraRuntimeConfig()
  return toDisplayPath(path.posix.join(toDisplayPath(basePath), ...segments.map(segment => normalizeInfraSegment(segment)).filter(Boolean)))
}

const directoryExists = async (targetPath: string) => {
  try {
    const stats = await fs.stat(targetPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

const readChildDirectories = async (targetPath: string) => {
  if (!(await directoryExists(targetPath))) {
    return []
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

export const ensureInfraBaseStructure = async () => {
  const { basePath, supportDirs } = getInfraRuntimeConfig()
  const baseAbsolutePath = path.resolve(basePath)

  await fs.mkdir(baseAbsolutePath, { recursive: true })

  for (const dir of supportDirs) {
    await fs.mkdir(resolveInfraPath(dir), { recursive: true })
  }

  return {
    baseAbsolutePath
  }
}

export const createEmpresaStructure = async ({ adquirente, empresa }: { adquirente: string, empresa: string }) => {
  const { statusDirs } = getInfraRuntimeConfig()
  const adquirenteSlug = normalizeInfraSegment(adquirente)
  const empresaSlug = normalizeInfraSegment(empresa)

  if (!adquirenteSlug || !empresaSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Adquirente e empresa precisam ser validos para criar a estrutura.'
    })
  }

  await ensureInfraBaseStructure()

  const companyPath = resolveInfraPath(adquirenteSlug, empresaSlug)
  const alreadyExists = await directoryExists(companyPath)

  if (alreadyExists) {
    throw createError({
      statusCode: 409,
      statusMessage: `A pasta ${buildInfraDisplayPath(adquirenteSlug, empresaSlug)} ja existe no servidor.`
    })
  }

  await fs.mkdir(companyPath, { recursive: true })

  for (const statusDir of statusDirs) {
    await fs.mkdir(resolveInfraPath(adquirenteSlug, empresaSlug, statusDir), { recursive: true })
  }

  return {
    adquirenteSlug,
    empresaSlug,
    companyPath: buildInfraDisplayPath(adquirenteSlug, empresaSlug),
    createdPaths: statusDirs.map(statusDir => buildInfraDisplayPath(adquirenteSlug, empresaSlug, statusDir))
  }
}

export const renameInfraNode = async ({
  tipo,
  adquirenteAtual,
  empresaAtual,
  novoNome
}: {
  tipo: 'adquirente' | 'empresa',
  adquirenteAtual?: string,
  empresaAtual?: string,
  novoNome: string
}) => {
  await ensureInfraBaseStructure()

  const newSlug = normalizeInfraSegment(novoNome)
  if (!newSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um novo nome valido para renomear a pasta.'
    })
  }

  let currentPath = ''
  let nextPath = ''
  let currentDisplayPath = ''

  if (tipo === 'adquirente') {
    const adquirenteSlug = normalizeInfraSegment(adquirenteAtual)

    currentPath = resolveInfraPath(adquirenteSlug)
    nextPath = resolveInfraPath(newSlug)
    currentDisplayPath = buildInfraDisplayPath(adquirenteSlug)
  } else {
    const adquirenteSlug = normalizeInfraSegment(adquirenteAtual)
    const empresaSlug = normalizeInfraSegment(empresaAtual)

    currentPath = resolveInfraPath(adquirenteSlug, empresaSlug)
    nextPath = resolveInfraPath(adquirenteSlug, newSlug)
    currentDisplayPath = buildInfraDisplayPath(adquirenteSlug, empresaSlug)
  }

  if (!(await directoryExists(currentPath))) {
    throw createError({
      statusCode: 404,
      statusMessage: `A pasta ${currentDisplayPath} nao foi encontrada no servidor.`
    })
  }

  if (await directoryExists(nextPath)) {
    throw createError({
      statusCode: 409,
      statusMessage: `Ja existe uma pasta com o nome ${newSlug} no destino selecionado.`
    })
  }

  await fs.rename(currentPath, nextPath)

  return {
    newSlug,
    oldPath: toDisplayPath(currentDisplayPath),
    newPath: toDisplayPath(nextPath)
  }
}

export const removeInfraNode = async ({
  tipo,
  adquirente,
  empresa
}: {
  tipo: 'adquirente' | 'empresa',
  adquirente?: string,
  empresa?: string
}) => {
  await ensureInfraBaseStructure()

  const adquirenteSlug = normalizeInfraSegment(adquirente)
  const empresaSlug = normalizeInfraSegment(empresa)
  const targetPath = tipo === 'adquirente'
    ? resolveInfraPath(adquirenteSlug)
    : resolveInfraPath(adquirenteSlug, empresaSlug)

  if (!(await directoryExists(targetPath))) {
    throw createError({
      statusCode: 404,
      statusMessage: 'A pasta selecionada nao foi encontrada para exclusao.'
    })
  }

  await fs.rm(targetPath, { recursive: true, force: false })

  return {
    removedPath: toDisplayPath(targetPath)
  }
}

export const listInfraTree = async () => {
  const config = getInfraRuntimeConfig()
  const baseAbsolutePath = path.resolve(config.basePath)
  const rootExists = await directoryExists(baseAbsolutePath)

  const supportDirs = await Promise.all(
    config.supportDirs.map(async (dir) => ({
      name: dir,
      path: buildInfraDisplayPath(dir),
      exists: await directoryExists(resolveInfraPath(dir))
    }))
  )

  if (!rootExists) {
    return {
      ...config,
      basePath: toDisplayPath(config.basePath),
      rootExists,
      supportDirs,
      summary: {
        totalAdquirentes: 0,
        totalEmpresas: 0,
        totalPastasStatusExistentes: 0,
        totalPastasStatusEsperadas: 0
      },
      items: []
    }
  }

  const adquirentes = (await readChildDirectories(baseAbsolutePath))
    .filter(dir => !config.supportDirs.includes(dir) && dir !== '_arquivados')

  const items = await Promise.all(adquirentes.map(async (adquirente) => {
    const empresas = await readChildDirectories(resolveInfraPath(adquirente))

    const empresasDetalhes = await Promise.all(empresas.map(async (empresa) => {
      const existingChildren = await readChildDirectories(resolveInfraPath(adquirente, empresa))
      const statusDirs = config.statusDirs.map((statusDir) => ({
        name: statusDir,
        exists: existingChildren.includes(statusDir),
        path: buildInfraDisplayPath(adquirente, empresa, statusDir)
      }))

      return {
        key: `${adquirente}/${empresa}`,
        label: empresa,
        path: buildInfraDisplayPath(adquirente, empresa),
        statusDirs,
        missingStatusDirs: statusDirs.filter(status => !status.exists).map(status => status.name)
      }
    }))

    return {
      key: adquirente,
      label: adquirente,
      path: buildInfraDisplayPath(adquirente),
      empresas: empresasDetalhes,
      totalEmpresas: empresasDetalhes.length
    }
  }))

  const totalEmpresas = items.reduce((total, item) => total + item.totalEmpresas, 0)
  const totalPastasStatusExistentes = items
    .flatMap(item => item.empresas)
    .flatMap(empresa => empresa.statusDirs)
    .filter(status => status.exists)
    .length

  return {
    ...config,
    basePath: toDisplayPath(config.basePath),
    rootExists,
    supportDirs,
    summary: {
      totalAdquirentes: items.length,
      totalEmpresas,
      totalPastasStatusExistentes,
      totalPastasStatusEsperadas: totalEmpresas * config.statusDirs.length
    },
    items
  }
}
