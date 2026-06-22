import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const DEFAULT_STATUS_DIRS = ['inbox', 'processando', 'processados', 'erro']
const DEFAULT_SUPPORT_DIRS = ['logs', 'backups']
const execFileAsync = promisify(execFile)

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
const shellQuote = (value: string) => `'${String(value || '').replace(/'/g, `'\\''`)}'`

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
    sshUser: String(config.serverInfraSshUser || 'ubuntu').trim() || 'ubuntu',
    sshPrivateKeyPath: String(config.serverInfraSshPrivateKeyPath || '').trim(),
    serverHost: String(config.public?.serverInfraHost || '').trim(),
    sshPublicKeyPath: String(config.public?.serverInfraSshPublicKeyPath || '').trim()
  }
}

export const buildInfraDisplayPath = (...segments: string[]) => {
  const { basePath } = getInfraRuntimeConfig()
  return toDisplayPath(path.posix.join(toDisplayPath(basePath), ...segments.map(segment => normalizeInfraSegment(segment)).filter(Boolean)))
}

const validateInfraRuntimeConfig = () => {
  const config = getInfraRuntimeConfig()

  if (!config.serverHost) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configure NUXT_PUBLIC_SERVER_INFRA_HOST para conectar ao servidor remoto.'
    })
  }

  if (!config.sshPrivateKeyPath) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configure SERVER_INFRA_SSH_PRIVATE_KEY_PATH com a chave privada usada para acessar a Oracle.'
    })
  }

  return config
}

const buildRemotePath = (...segments: string[]) => {
  const { basePath } = getInfraRuntimeConfig()
  const sanitizedSegments = segments
    .map(segment => normalizeInfraSegment(segment))
    .filter(Boolean)

  return toDisplayPath(path.posix.join(toDisplayPath(basePath), ...sanitizedSegments))
}

const runRemoteCommand = async (remoteScript: string) => {
  const config = validateInfraRuntimeConfig()
  const args = [
    '-i', config.sshPrivateKeyPath,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
    `${config.sshUser}@${config.serverHost}`,
    'bash',
    '-lc',
    remoteScript
  ]

  try {
    const { stdout, stderr } = await execFileAsync('ssh', args, {
      timeout: 30000,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    })

    return {
      stdout: String(stdout || ''),
      stderr: String(stderr || '')
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error?.stderr?.trim() || error?.message || 'Falha ao executar comando SSH no servidor remoto.'
    })
  }
}

const buildEnsureBaseScript = () => {
  const config = getInfraRuntimeConfig()
  const commands = [
    `mkdir -p ${shellQuote(config.basePath)}`
  ]

  for (const dir of config.supportDirs) {
    commands.push(`mkdir -p ${shellQuote(buildRemotePath(dir))}`)
  }

  return commands.join(' && ')
}

const parseListOutput = (stdout: string) => {
  const config = getInfraRuntimeConfig()
  const lines = stdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const itemsMap = new Map<string, any>()
  const supportDirs = []

  for (const line of lines) {
    const parts = line.split('|')
    const tag = parts[0]

    if (tag === '__SUPPORT__') {
      supportDirs.push({
        name: parts[1],
        exists: parts[2] === '1',
        path: parts[3]
      })
      continue
    }

    if (tag === '__ADQ__') {
      itemsMap.set(parts[1], {
        key: parts[1],
        label: parts[1],
        path: parts[2],
        empresas: [],
        totalEmpresas: 0
      })
      continue
    }

    if (tag === '__EMP__') {
      const adquirente = parts[1]
      const empresa = parts[2]
      const path = parts[3]
      const parent = itemsMap.get(adquirente)

      if (!parent) continue

      parent.empresas.push({
        key: `${adquirente}/${empresa}`,
        label: empresa,
        path,
        statusDirs: [],
        missingStatusDirs: []
      })
      parent.totalEmpresas = parent.empresas.length
      continue
    }

    if (tag === '__STATUS__') {
      const adquirente = parts[1]
      const empresa = parts[2]
      const statusName = parts[3]
      const exists = parts[4] === '1'
      const path = parts[5]
      const parent = itemsMap.get(adquirente)
      const empresaItem = parent?.empresas?.find((item: any) => item.label === empresa)

      if (!empresaItem) continue

      empresaItem.statusDirs.push({
        name: statusName,
        exists,
        path
      })
    }
  }

  const items = Array.from(itemsMap.values()).sort((left, right) => left.label.localeCompare(right.label))
  for (const adquirente of items) {
    adquirente.empresas.sort((left: any, right: any) => left.label.localeCompare(right.label))
    for (const empresa of adquirente.empresas) {
      empresa.statusDirs.sort((left: any, right: any) => config.statusDirs.indexOf(left.name) - config.statusDirs.indexOf(right.name))
      empresa.missingStatusDirs = config.statusDirs.filter(status => !empresa.statusDirs.some((item: any) => item.name === status && item.exists))
    }
  }

  const totalEmpresas = items.reduce((total, item) => total + item.totalEmpresas, 0)
  const totalPastasStatusExistentes = items
    .flatMap(item => item.empresas)
    .flatMap(empresa => empresa.statusDirs)
    .filter(status => status.exists)
    .length

  return {
    ...config,
    basePath: toDisplayPath(config.basePath),
    rootExists: true,
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

export const ensureInfraBaseStructure = async () => {
  await runRemoteCommand(buildEnsureBaseScript())
  return {
    basePath: getInfraRuntimeConfig().basePath
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

  const companyPath = buildRemotePath(adquirenteSlug, empresaSlug)
  const commands = [
    buildEnsureBaseScript(),
    `if [ -d ${shellQuote(companyPath)} ]; then echo "__EXISTS__"; exit 9; fi`,
    ...statusDirs.map(statusDir => `mkdir -p ${shellQuote(buildRemotePath(adquirenteSlug, empresaSlug, statusDir))}`),
    `echo "__CREATED__|${companyPath}"`
  ]

  try {
    await runRemoteCommand(commands.join(' && '))
  } catch (error: any) {
    if (String(error?.statusMessage || '').includes('__EXISTS__')) {
      throw createError({
        statusCode: 409,
        statusMessage: `A pasta ${companyPath} ja existe no servidor remoto.`
      })
    }

    throw error
  }

  return {
    adquirenteSlug,
    empresaSlug,
    companyPath,
    createdPaths: statusDirs.map(statusDir => buildRemotePath(adquirenteSlug, empresaSlug, statusDir))
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
  const newSlug = normalizeInfraSegment(novoNome)
  if (!newSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um novo nome valido para renomear a pasta.'
    })
  }

  const currentPath = tipo === 'adquirente'
    ? buildRemotePath(String(adquirenteAtual || ''))
    : buildRemotePath(String(adquirenteAtual || ''), String(empresaAtual || ''))
  const nextPath = tipo === 'adquirente'
    ? buildRemotePath(newSlug)
    : buildRemotePath(String(adquirenteAtual || ''), newSlug)

  const commands = [
    buildEnsureBaseScript(),
    `if [ ! -d ${shellQuote(currentPath)} ]; then echo "__NOT_FOUND__"; exit 11; fi`,
    `if [ -d ${shellQuote(nextPath)} ]; then echo "__CONFLICT__"; exit 12; fi`,
    `mv ${shellQuote(currentPath)} ${shellQuote(nextPath)}`,
    `echo "__RENAMED__|${nextPath}"`
  ]

  try {
    await runRemoteCommand(commands.join(' && '))
  } catch (error: any) {
    const message = String(error?.statusMessage || '')
    if (message.includes('__NOT_FOUND__')) {
      throw createError({
        statusCode: 404,
        statusMessage: `A pasta ${currentPath} nao foi encontrada no servidor remoto.`
      })
    }
    if (message.includes('__CONFLICT__')) {
      throw createError({
        statusCode: 409,
        statusMessage: `Ja existe uma pasta com o nome ${newSlug} no destino selecionado.`
      })
    }
    throw error
  }

  return {
    newSlug,
    oldPath: currentPath,
    newPath: nextPath
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
  const targetPath = tipo === 'adquirente'
    ? buildRemotePath(String(adquirente || ''))
    : buildRemotePath(String(adquirente || ''), String(empresa || ''))

  const commands = [
    buildEnsureBaseScript(),
    `if [ ! -d ${shellQuote(targetPath)} ]; then echo "__NOT_FOUND__"; exit 13; fi`,
    `rm -rf ${shellQuote(targetPath)}`,
    `echo "__REMOVED__|${targetPath}"`
  ]

  try {
    await runRemoteCommand(commands.join(' && '))
  } catch (error: any) {
    if (String(error?.statusMessage || '').includes('__NOT_FOUND__')) {
      throw createError({
        statusCode: 404,
        statusMessage: 'A pasta selecionada nao foi encontrada para exclusao no servidor remoto.'
      })
    }
    throw error
  }

  return {
    removedPath: targetPath
  }
}

export const listInfraTree = async () => {
  const config = getInfraRuntimeConfig()
  const statusChecks = config.statusDirs
    .map((statusDir) => `      if [ -d "$empresa_path/${statusDir}" ]; then exists=1; else exists=0; fi; echo "__STATUS__|$adq|$empresa|${statusDir}|$exists|$empresa_path/${statusDir}"`)
    .join('\n')

  const remoteScript = `
set -e
BASE=${shellQuote(config.basePath)}
mkdir -p "$BASE"
${config.supportDirs.map(dir => `mkdir -p "$BASE/${dir}"`).join('\n')}
${config.supportDirs.map(dir => `if [ -d "$BASE/${dir}" ]; then echo "__SUPPORT__|${dir}|1|$BASE/${dir}"; else echo "__SUPPORT__|${dir}|0|$BASE/${dir}"; fi`).join('\n')}
for adq_path in "$BASE"/*; do
  [ -d "$adq_path" ] || continue
  adq="$(basename "$adq_path")"
  case "$adq" in
    ${config.supportDirs.join('|')}|_arquivados) continue ;;
  esac
  echo "__ADQ__|$adq|$adq_path"
  for empresa_path in "$adq_path"/*; do
    [ -d "$empresa_path" ] || continue
    empresa="$(basename "$empresa_path")"
    echo "__EMP__|$adq|$empresa|$empresa_path"
${statusChecks}
  done
done
`

  const { stdout } = await runRemoteCommand(remoteScript)
  return parseListOutput(stdout)
}
