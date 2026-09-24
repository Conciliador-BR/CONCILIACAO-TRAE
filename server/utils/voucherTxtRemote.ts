import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  extractVoucherTxtReferenceDate,
  formatVoucherTxtDownloadTimestamp,
  getVoucherTxtOriginalStem,
  normalizeVoucherTxtCnpj,
  normalizeVoucherTxtIdentifier
} from './voucherTxtShared'

const execFileAsync = promisify(execFile)
const shellDoubleQuote = (value: string) => `"${String(value || '').replace(/(["\\$`])/g, '\\$1')}"`
const DOWNLOADS_INBOX_FOLDER = 'cnpj'

const ACQUIRER_META: Record<string, {
  id: string
  label: string
  folderName: string
  credentialFieldLabel: string
}> = {
  comprocard: {
    id: 'comprocard',
    label: 'Comprocard',
    folderName: 'Comprocard',
    credentialFieldLabel: 'codigo'
  },
  upbrasil: {
    id: 'upbrasil',
    label: 'Up Brasil',
    folderName: 'UpBrasil',
    credentialFieldLabel: 'nome do arquivo'
  },
  lecard: {
    id: 'lecard',
    label: 'LeCard',
    folderName: 'Lecard',
    credentialFieldLabel: 'nome do arquivo'
  }
}

export const getVoucherTxtAcquirerMeta = (adquirente: string) => {
  const normalized = normalizeVoucherTxtIdentifier(adquirente)
  const meta = ACQUIRER_META[normalized]

  if (!meta) {
    throw createError({
      statusCode: 400,
      statusMessage: `Adquirente ${String(adquirente || '').trim() || '-'} ainda nao suportada para importacao automatica por TXT.`
    })
  }

  return meta
}

const getRuntimeConfig = (adquirente: string) => {
  const meta = getVoucherTxtAcquirerMeta(adquirente)
  const config = useRuntimeConfig()
  const basePath = `/opt/conciliadora/${meta.folderName}`

  return {
    ...meta,
    sshUser: String(config.serverInfraSshUser || 'ubuntu').trim() || 'ubuntu',
    sshPrivateKeyPath: String(config.serverInfraSshPrivateKeyPath || '').trim(),
    serverHost: String(config.public?.serverInfraHost || '').trim(),
    basePath,
    downloadsPath: `${basePath}/downloads`,
    downloadsInboxPath: `${basePath}/downloads/${DOWNLOADS_INBOX_FOLDER}`,
    processadosPath: `${basePath}/processados`,
    processadosCnpjPath: `${basePath}/processados/${DOWNLOADS_INBOX_FOLDER}`,
    logsPath: `${basePath}/logs`
  }
}

const assertRuntimeConfig = (adquirente: string) => {
  const config = getRuntimeConfig(adquirente)

  if (!config.serverHost) {
    throw createError({
      statusCode: 500,
      statusMessage: `Configure NUXT_PUBLIC_SERVER_INFRA_HOST para acessar os arquivos da ${config.label}.`
    })
  }

  if (!config.sshPrivateKeyPath) {
    throw createError({
      statusCode: 500,
      statusMessage: `Configure SERVER_INFRA_SSH_PRIVATE_KEY_PATH para acessar os arquivos da ${config.label}.`
    })
  }

  return config
}

const runRemoteCommand = async (adquirente: string, remoteScript: string, timeout = 180000) => {
  const config = assertRuntimeConfig(adquirente)
  const args = [
    '-i', config.sshPrivateKeyPath,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
    `${config.sshUser}@${config.serverHost}`,
    'bash',
    '-lc',
    String(remoteScript || '')
  ]

  try {
    const { stdout, stderr } = await execFileAsync('ssh', args, {
      timeout,
      windowsHide: true,
      maxBuffer: 50 * 1024 * 1024
    })

    return {
      stdout: String(stdout || ''),
      stderr: String(stderr || '')
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: String(error?.stderr || error?.stdout || error?.message || `Falha ao executar comando remoto da ${config.label}.`).trim()
    })
  }
}

const buildEnsureStructureScript = (adquirente: string, cnpj?: string) => {
  const config = getRuntimeConfig(adquirente)
  const normalizedCnpj = normalizeVoucherTxtCnpj(cnpj)
  const paths = [
    config.basePath,
    config.downloadsPath,
    config.downloadsInboxPath,
    config.processadosPath,
    config.processadosCnpjPath,
    config.logsPath
  ]

  if (normalizedCnpj) {
    paths.push(
      path.posix.join(config.processadosCnpjPath, normalizedCnpj)
    )
  }

  return paths
    .filter(Boolean)
    .map(item => `mkdir -p ${shellDoubleQuote(item)}`)
    .join('; ')
}

const parseFileListOutput = (stdout: string) => {
  return String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('__FILE__|'))
    .map((line) => {
      const parts = line.split('|')
      const fileName = parts[1] || ''
      const size = parts[2] || '0'
      const modifiedAt = parts[3] || ''
      const fullPath = parts[4] || ''
      const relativePath = parts[5] || ''
      const cnpjFolder = parts[6] || ''
      return {
        fileName: String(fileName || '').trim(),
        size: Number(size || 0) || 0,
        modifiedAt: String(modifiedAt || '').trim(),
        fullPath: String(fullPath || '').trim(),
        relativePath: String(relativePath || '').trim(),
        cnpjFolder: String(cnpjFolder || '').trim(),
        originalStem: getVoucherTxtOriginalStem(fileName),
        referenceDate: extractVoucherTxtReferenceDate(fileName, modifiedAt),
        downloadTimestamp: formatVoucherTxtDownloadTimestamp(modifiedAt)
      }
    })
}

const parseMoveResults = (stdout: string) => {
  return String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      return line.startsWith('__MOVED__|')
        || line.startsWith('__DEDUPLICATED__|')
        || line.startsWith('__CONFLICT__|')
    })
    .map((line) => {
      const [marker, fileName, fromPath, toPath] = line.split('|')
      return {
        status: marker === '__DEDUPLICATED__'
          ? 'duplicado_removido'
          : marker === '__CONFLICT__'
            ? 'conflito'
            : 'movido',
        fileName: String(fileName || '').trim(),
        fromPath: String(fromPath || '').trim(),
        toPath: String(toPath || '').trim()
      }
    })
}

const buildListFilesScript = ({
  adquirente,
  searchPath,
  cnpj,
  cnpjFolderLabel
}: {
  adquirente: string
  searchPath: string
  cnpj?: string
  cnpjFolderLabel?: string
}) => {
  const normalizedCnpj = normalizeVoucherTxtCnpj(cnpj)
  const config = getRuntimeConfig(adquirente)
  const folderLabel = String(cnpjFolderLabel || '').trim()
  return `
set -e;
${buildEnsureStructureScript(adquirente, normalizedCnpj)}
find ${shellDoubleQuote(searchPath)} -maxdepth 1 -type f -iname '*.txt' | sort | while IFS= read -r fullpath; do
  file_name="$(basename "$fullpath")"
  relative_path="\${fullpath#${config.basePath}/}"
  cnpj_folder=${shellDoubleQuote(folderLabel)}
  size="$(stat -c %s "$fullpath")"
  modified_at="$(stat -c %y "$fullpath")"
  echo "__FILE__|$file_name|$size|$modified_at|$fullpath|$relative_path|$cnpj_folder"
done
`
}

export const ensureVoucherTxtStructure = async (adquirente: string, cnpj?: string) => {
  const config = getRuntimeConfig(adquirente)
  await runRemoteCommand(adquirente, buildEnsureStructureScript(adquirente, cnpj))
  return config
}

export const listVoucherTxtFiles = async (adquirente: string, cnpj?: string) => {
  const config = getRuntimeConfig(adquirente)
  const searchPath = config.downloadsInboxPath
  const remoteScript = buildListFilesScript({ adquirente, searchPath, cnpj, cnpjFolderLabel: DOWNLOADS_INBOX_FOLDER })
  const { stdout } = await runRemoteCommand(adquirente, remoteScript, 120000)
  return parseFileListOutput(stdout)
}

export const listVoucherTxtProcessadosFiles = async (adquirente: string, cnpj: string) => {
  const config = getRuntimeConfig(adquirente)
  const normalizedCnpj = normalizeVoucherTxtCnpj(cnpj)

  if (!normalizedCnpj) return []

  const searchPath = path.posix.join(config.processadosCnpjPath, normalizedCnpj)
  const remoteScript = buildListFilesScript({ adquirente, searchPath, cnpj: normalizedCnpj, cnpjFolderLabel: normalizedCnpj })
  const { stdout } = await runRemoteCommand(adquirente, remoteScript, 120000)
  return parseFileListOutput(stdout)
}

export const readVoucherTxtLogTail = async (adquirente: string, lines = 80) => {
  const config = getRuntimeConfig(adquirente)
  const safeLines = Number.isFinite(lines) ? Math.max(10, Math.min(200, Number(lines))) : 80
  const remoteScript = `
set -e;
${buildEnsureStructureScript(adquirente)}
LATEST_LOG="$(find ${shellDoubleQuote(config.logsPath)} -maxdepth 1 -type f -name ${shellDoubleQuote(`${config.id}_*.log`)} | sort | tail -n 1)"
if [ -z "$LATEST_LOG" ]; then
  exit 0
fi
tail -n ${safeLines} "$LATEST_LOG"
`

  const { stdout } = await runRemoteCommand(adquirente, remoteScript, 120000)
  return String(stdout || '').trim()
}

export const readVoucherTxtFiles = async (adquirente: string, fileNames: string[], cnpj?: string) => {
  const config = getRuntimeConfig(adquirente)
  const normalizedCnpj = normalizeVoucherTxtCnpj(cnpj)
  const searchPath = config.downloadsInboxPath
  return readVoucherTxtFilesFromSearchPath({
    adquirente,
    fileNames,
    cnpj: normalizedCnpj,
    searchPath
  })
}

const readVoucherTxtFilesFromSearchPath = async ({
  adquirente,
  fileNames,
  cnpj,
  searchPath
}: {
  adquirente: string
  fileNames: string[]
  cnpj?: string
  searchPath: string
}) => {
  const normalizedCnpj = normalizeVoucherTxtCnpj(cnpj)
  const normalizedNames = Array.from(new Set((fileNames || []).map((item) => String(item || '').trim()).filter(Boolean)))

  if (normalizedNames.length === 0) return []

  const validations = normalizedNames
    .map((name) => {
      return [
        `FULL_PATH="$(find ${shellDoubleQuote(searchPath)} -maxdepth 1 -type f -name ${shellDoubleQuote(name)} | sort | head -n 1)"`,
        `if [ -z "$FULL_PATH" ] || [ ! -f "$FULL_PATH" ]; then echo "__MISSING__|${name}"; exit 21; fi`,
        `echo "__FILE__|${name}"`,
        `base64 -w 0 "$FULL_PATH"`,
        `echo ""`,
        `echo "__END_FILE__|${name}"`
      ].join('\n')
    })
    .join('\n')

  const remoteScript = `
set -e;
${buildEnsureStructureScript(adquirente, normalizedCnpj)}
${validations}
`

  const { stdout } = await runRemoteCommand(adquirente, remoteScript, 300000)
  const lines = String(stdout || '').split(/\r?\n/)
  const results: Array<{ fileName: string, content: string }> = []
  let currentFileName = ''
  let base64Buffer = ''

  for (const rawLine of lines) {
    const line = String(rawLine || '').trim()
    if (!line) continue

    if (line.startsWith('__FILE__|')) {
      currentFileName = line.split('|')[1] || ''
      base64Buffer = ''
      continue
    }

    if (line.startsWith('__END_FILE__|')) {
      if (currentFileName) {
        results.push({
          fileName: currentFileName,
          content: Buffer.from(base64Buffer, 'base64').toString('utf-8')
        })
      }
      currentFileName = ''
      base64Buffer = ''
      continue
    }

    if (currentFileName) {
      base64Buffer += line
    }
  }

  return results
}

export const readVoucherTxtProcessadosFiles = async (adquirente: string, fileNames: string[], cnpj: string) => {
  const config = getRuntimeConfig(adquirente)
  const normalizedCnpj = normalizeVoucherTxtCnpj(cnpj)

  if (!normalizedCnpj) return []

  return readVoucherTxtFilesFromSearchPath({
    adquirente,
    fileNames,
    cnpj: normalizedCnpj,
    searchPath: path.posix.join(config.processadosCnpjPath, normalizedCnpj)
  })
}

export const moveVoucherTxtFilesToProcessados = async ({
  adquirente,
  cnpj,
  fileNames,
  files
}: {
  adquirente: string
  cnpj: string
  fileNames: string[]
  files?: Array<{ fileName?: string, fullPath?: string }>
}) => {
  const config = getRuntimeConfig(adquirente)
  const normalizedCnpj = normalizeVoucherTxtCnpj(cnpj)
  const sourceFiles = Array.isArray(files) && files.length > 0
    ? files
      .map((item) => ({
        fileName: String(item?.fileName || '').trim(),
        fullPath: String(item?.fullPath || '').trim()
      }))
      .filter((item) => item.fileName && item.fullPath)
    : Array.from(new Set((fileNames || []).map((item) => String(item || '').trim()).filter(Boolean)))
      .map((fileName) => ({ fileName, fullPath: '' }))

  if (!normalizedCnpj) {
    throw createError({
      statusCode: 400,
      statusMessage: `Informe um CNPJ valido para mover os arquivos processados da ${config.label}.`
    })
  }

  if (sourceFiles.length === 0) return []

  const sourceDir = config.downloadsInboxPath
  const targetDir = path.posix.join(config.processadosCnpjPath, normalizedCnpj)
  const moveCommands = sourceFiles.map((file) => {
    const name = file.fileName
    const explicitSourcePath = file.fullPath
    const sourcePathCommand = explicitSourcePath
      ? `SOURCE_PATH=${shellDoubleQuote(explicitSourcePath)}`
      : `SOURCE_PATH="$(find ${shellDoubleQuote(sourceDir)} -maxdepth 1 -type f -name ${shellDoubleQuote(name)} | sort | head -n 1)"`

    return [
      sourcePathCommand,
      `if [ -n "$SOURCE_PATH" ] && [ -f "$SOURCE_PATH" ] && [ "\${SOURCE_PATH#${sourceDir}/}" != "$SOURCE_PATH" ]; then`,
      `  TARGET_PATH=${shellDoubleQuote(path.posix.join(targetDir, name))}`,
      `  SOURCE_HASH="$(sha256sum "$SOURCE_PATH" | awk '{print $1}')"`,
      `  DUPLICATE_PATH="$(find ${shellDoubleQuote(targetDir)} -maxdepth 1 -type f -iname '*.txt' -print0 | while IFS= read -r -d '' candidate; do`,
      `    CANDIDATE_HASH="$(sha256sum "$candidate" | awk '{print $1}')"`,
      `    if [ "$CANDIDATE_HASH" = "$SOURCE_HASH" ]; then printf '%s' "$candidate"; break; fi`,
      `  done)"`,
      `  if [ -n "$DUPLICATE_PATH" ]; then`,
      `    rm -f -- "$SOURCE_PATH"`,
      `    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Duplicado removido ${name}; conteudo ja existe em $DUPLICATE_PATH" >> "$LOG_FILE"`,
      `    echo "__DEDUPLICATED__|${name}|$SOURCE_PATH|$DUPLICATE_PATH"`,
      `  elif [ -e "$TARGET_PATH" ]; then`,
      `    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Conflito ${name}: destino existente possui conteudo diferente" >> "$LOG_FILE"`,
      `    echo "__CONFLICT__|${name}|$SOURCE_PATH|$TARGET_PATH"`,
      `  else`,
      `    mv -n -- "$SOURCE_PATH" "$TARGET_PATH"`,
      `    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Movido ${name} para $TARGET_PATH" >> "$LOG_FILE"`,
      `    echo "__MOVED__|${name}|$SOURCE_PATH|$TARGET_PATH"`,
      `  fi`,
      `else`,
      `  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Ignorado ${name}: arquivo nao encontrado em ${sourceDir}" >> "$LOG_FILE"`,
      `  echo "__SKIP__|${name}"`,
      `fi`
    ].join('\n')
  }).join('\n')

  const remoteScript = `
set -e;
${buildEnsureStructureScript(adquirente, normalizedCnpj)}
mkdir -p ${shellDoubleQuote(targetDir)}
exec 9>${shellDoubleQuote(path.posix.join(targetDir, '.dedupe.lock'))}
flock -x 9
LOG_FILE="${config.logsPath}/${config.id}_$(date +%Y%m%d).log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Inicio movimentacao ${config.label}" >> "$LOG_FILE"
${moveCommands}
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fim movimentacao ${config.label}" >> "$LOG_FILE"
`

  const { stdout } = await runRemoteCommand(adquirente, remoteScript, 300000)
  return parseMoveResults(stdout)
}
