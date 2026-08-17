import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const shellQuote = (value: string) => `'${String(value || '').replace(/'/g, `'\\''`)}'`
const sftpBatchValue = (value: string) => String(value || '').replace(/\r?\n/g, '').trim()

const toPosixPath = (value: string) => String(value || '').replace(/\\/g, '/')
const ensureNonEmptyPath = (value: string, label: string) => {
  const normalized = toPosixPath(String(value || '').trim())
  if (!normalized) {
    throw createError({
      statusCode: 500,
      statusMessage: `O caminho ${label} da VR ficou vazio na configuracao do servidor.`
    })
  }
  return normalized
}

const parseDateInput = (value: string) => {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  return text.replace(/-/g, '')
}

export const normalizeVrCnpj = (value: unknown) => String(value || '').replace(/\D/g, '')

export const extractVrReferenceDate = (fileName: string) => {
  const match = String(fileName || '').match(/_(\d{8})(?:_|\.|$)/)
  return match?.[1] || ''
}

export const buildVrSafeDownloadName = (remoteFileName: string, downloadTimestamp: string) => {
  const parsed = path.posix.parse(String(remoteFileName || '').trim())
  const ext = parsed.ext || '.txt'
  const baseName = parsed.name || 'arquivo_vr'
  const referenceDate = extractVrReferenceDate(remoteFileName)
  const referenceSuffix = referenceDate ? `__ref_${referenceDate}` : ''
  return `${baseName}${referenceSuffix}__download_${downloadTimestamp}${ext}`
}

export const parseVrSafeDownloadName = (fileName: string) => {
  const parsed = path.posix.parse(String(fileName || '').trim())
  const name = parsed.name || ''
  const match = name.match(/^(.*?)(?:__ref_(\d{8}))?__download_(\d{8}_\d{6})$/)

  if (!match) {
    return {
      originalStem: name,
      referenceDate: '',
      downloadTimestamp: '',
      isSafeName: false
    }
  }

  return {
    originalStem: match[1] || '',
    referenceDate: match[2] || '',
    downloadTimestamp: match[3] || '',
    isSafeName: true
  }
}

const getVrRuntimeConfig = () => {
  const config = useRuntimeConfig()
  const basePath = ensureNonEmptyPath(String(config.vrBasePath || '/opt/conciliadora/vr').trim() || '/opt/conciliadora/vr', 'basePath')
  const downloadsPath = ensureNonEmptyPath(`${basePath}/downloads`, 'downloadsPath')
  const processadosPath = ensureNonEmptyPath(`${basePath}/processados`, 'processadosPath')
  const exportsPath = ensureNonEmptyPath(`${basePath}/exports`, 'exportsPath')
  const logsPath = ensureNonEmptyPath(`${basePath}/logs`, 'logsPath')

  return {
    oracleHost: String(config.public?.vrOracleHost || config.public?.serverInfraHost || '').trim(),
    oracleSshUser: String(config.vrOracleSshUser || config.serverInfraSshUser || 'ubuntu').trim() || 'ubuntu',
    oracleSshPrivateKeyPath: String(config.vrOracleSshPrivateKeyPath || config.serverInfraSshPrivateKeyPath || '').trim(),
    basePath,
    downloadsPath,
    processadosPath,
    exportsPath,
    logsPath,
    sftpHost: String(config.vrSftpHost || 'sftp.vr.com.br').trim() || 'sftp.vr.com.br',
    sftpPort: Number(config.vrSftpPort || 22) || 22,
    sftpUser: String(config.vrSftpUser || 'ftpeconomiccard').trim() || 'ftpeconomiccard',
    sftpRemoteDir: toPosixPath(String(config.vrSftpRemoteDir || '/down').trim() || '/down'),
    sftpPrivateKeyPath: toPosixPath(String(config.vrSftpPrivateKeyPath || '/home/ubuntu/.ssh/vr_sftp_rsa').trim() || '/home/ubuntu/.ssh/vr_sftp_rsa'),
    fixedRemoteName: String(config.vrSftpFixedRemoteName || 'VR_ECONOMICCARD_10478994000100.txt').trim() || 'VR_ECONOMICCARD_10478994000100.txt'
  }
}

const assertVrRuntimeConfig = () => {
  const config = getVrRuntimeConfig()

  if (!config.oracleHost) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configure NUXT_PUBLIC_VR_ORACLE_HOST ou NUXT_PUBLIC_SERVER_INFRA_HOST para acessar o Oracle.'
    })
  }

  if (!config.oracleSshPrivateKeyPath) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configure VR_ORACLE_SSH_PRIVATE_KEY_PATH ou SERVER_INFRA_SSH_PRIVATE_KEY_PATH para acessar o Oracle.'
    })
  }

  return config
}

const runVrRemoteCommand = async (remoteScript: string, timeout = 180000) => {
  const config = assertVrRuntimeConfig()
  const remoteCommand = `bash -lc ${shellQuote(remoteScript)}`
  const args = [
    '-i', config.oracleSshPrivateKeyPath,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
    `${config.oracleSshUser}@${config.oracleHost}`,
    remoteCommand
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
      statusMessage: String(error?.stderr || error?.stdout || error?.message || 'Falha ao executar comando remoto no Oracle.').trim()
    })
  }
}

const buildEnsureVrStructureScript = () => {
  const config = getVrRuntimeConfig()
  const paths = [
    { label: 'basePath', value: config.basePath },
    { label: 'downloadsPath', value: config.downloadsPath },
    { label: 'processadosPath', value: config.processadosPath },
    { label: 'exportsPath', value: config.exportsPath },
    { label: 'logsPath', value: config.logsPath }
  ]

  paths.forEach((item) => {
    if (!String(item.value || '').trim()) {
      throw createError({
        statusCode: 500,
        statusMessage: `O caminho ${item.label} da VR ficou vazio antes de executar o mkdir remoto.`
      })
    }
  })

  return paths
    .map(item => `mkdir -p ${shellQuote(item.value)}`)
    .join(' && ')
}

const parseRemoteFileList = (stdout: string) => {
  return String(stdout || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('__FILE__|'))
    .map((line) => {
      const [, fileName] = line.split('|')
      return String(fileName || '').trim()
    })
    .filter(Boolean)
}

const parseDownloadedFileList = (stdout: string) => {
  return String(stdout || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('__DOWNLOADED__|'))
    .map((line) => {
      const [, fileName, size, modifiedAt, fullPath] = line.split('|')
      const parsedSafe = parseVrSafeDownloadName(fileName)
      return {
        fileName,
        size: Number(size || 0) || 0,
        modifiedAt: String(modifiedAt || '').trim(),
        fullPath: String(fullPath || '').trim(),
        referenceDate: parsedSafe.referenceDate,
        downloadTimestamp: parsedSafe.downloadTimestamp,
        originalStem: parsedSafe.originalStem,
        isSafeName: parsedSafe.isSafeName
      }
    })
}

const parseDownloadResult = (stdout: string) => {
  return String(stdout || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('__RESULT__|'))
    .map((line) => {
      const [, status, remoteName, localName, fullPath] = line.split('|')
      return {
        status: String(status || '').trim(),
        remoteName: String(remoteName || '').trim(),
        localName: String(localName || '').trim(),
        fullPath: String(fullPath || '').trim()
      }
    })
}

export const ensureVrRemoteStructure = async () => {
  const config = getVrRuntimeConfig()
  await runVrRemoteCommand(buildEnsureVrStructureScript())
  return config
}

export const listVrRemoteFiles = async () => {
  const config = getVrRuntimeConfig()
  const remoteScript = `
set -e
${buildEnsureVrStructureScript()}
TMP_BATCH="/tmp/vr_list_$$.txt"
cat > "$TMP_BATCH" <<'EOF'
cd ${config.sftpRemoteDir}
ls -1
EOF
set +e
OUTPUT="$(sftp -o StrictHostKeyChecking=no -o BatchMode=yes -b "$TMP_BATCH" -P ${config.sftpPort} -i ${shellQuote(config.sftpPrivateKeyPath)} ${shellQuote(`${config.sftpUser}@${config.sftpHost}`)} 2>&1)"
EXIT_CODE=$?
set -e
rm -f "$TMP_BATCH"
printf '%s\\n' "$OUTPUT" | while IFS= read -r line; do
  case "$line" in
    ""|"sftp>"*|"Fetching "*|"Connected to "*|"Changing to: "*)
      continue
      ;;
    *)
      echo "__FILE__|$line"
      ;;
  esac
done
if [ "$EXIT_CODE" -ne 0 ]; then
  echo "__ERROR__|$OUTPUT"
  exit "$EXIT_CODE"
fi
`

  const { stdout } = await runVrRemoteCommand(remoteScript, 120000)
  return parseRemoteFileList(stdout)
}

export const listVrDownloadedFiles = async () => {
  const config = getVrRuntimeConfig()
  const remoteScript = `
set -e
${buildEnsureVrStructureScript()}
find ${shellQuote(config.downloadsPath)} -maxdepth 1 -type f \\( -iname '*.txt' -o -iname '*.csv' -o -iname '*.json' \\) -printf '__DOWNLOADED__|%f|%s|%TY-%Tm-%TdT%TH:%TM:%TS|%p\\n' | sort
`
  const { stdout } = await runVrRemoteCommand(remoteScript, 120000)
  return parseDownloadedFileList(stdout)
}

export const readVrLogTail = async (lines = 80) => {
  const config = getVrRuntimeConfig()
  const safeLines = Number.isFinite(lines) ? Math.max(10, Math.min(200, Number(lines))) : 80
  const remoteScript = `
set -e
${buildEnsureVrStructureScript()}
LATEST_LOG="$(find ${shellQuote(config.logsPath)} -maxdepth 1 -type f -name 'vr_*.log' | sort | tail -n 1)"
if [ -z "$LATEST_LOG" ]; then
  exit 0
fi
tail -n ${safeLines} "$LATEST_LOG"
`
  const { stdout } = await runVrRemoteCommand(remoteScript, 120000)
  return String(stdout || '').trim()
}

const shouldIncludeRemoteVrFile = ({
  fileName,
  cnpj,
  dataInicial,
  dataFinal,
  fixedRemoteName
}: {
  fileName: string
  cnpj?: string
  dataInicial?: string
  dataFinal?: string
  fixedRemoteName?: string
}) => {
  const normalizedName = String(fileName || '').trim()
  const normalizedCnpj = normalizeVrCnpj(cnpj)
  const normalizedFixed = String(fixedRemoteName || '').trim()
  const refDate = extractVrReferenceDate(normalizedName)
  const start = parseDateInput(String(dataInicial || ''))
  const end = parseDateInput(String(dataFinal || ''))

  if (normalizedFixed && normalizedName === normalizedFixed) {
    return true
  }

  if (normalizedCnpj && !normalizedName.includes(normalizedCnpj)) {
    return false
  }

  if (start && end && refDate) {
    return refDate >= start && refDate <= end
  }

  if (start && end && !refDate) {
    return false
  }

  return true
}

export const buildVrRemoteSelection = ({
  remoteFiles,
  downloadedFiles,
  cnpj,
  dataInicial,
  dataFinal,
  fixedRemoteName,
  overwrite = false
}: {
  remoteFiles: string[]
  downloadedFiles: Array<{ fileName: string, originalStem?: string, referenceDate?: string }>
  cnpj?: string
  dataInicial?: string
  dataFinal?: string
  fixedRemoteName?: string
  overwrite?: boolean
}) => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '_')
  const matches = remoteFiles.filter((fileName) => shouldIncludeRemoteVrFile({
    fileName,
    cnpj,
    dataInicial,
    dataFinal,
    fixedRemoteName
  }))

  const selected = matches.map((remoteName) => {
    const localName = buildVrSafeDownloadName(remoteName, timestamp)
    const parsedLocal = parseVrSafeDownloadName(localName)
    const alreadyDownloaded = downloadedFiles.some((downloaded) => {
      const sameStem = String(downloaded.originalStem || '') === parsedLocal.originalStem
      const sameReference = String(downloaded.referenceDate || '') === parsedLocal.referenceDate
      return sameStem && sameReference
    })

    return {
      remoteName,
      localName,
      shouldDownload: overwrite || !alreadyDownloaded,
      skippedReason: overwrite || !alreadyDownloaded ? '' : 'arquivo_ja_existente'
    }
  })

  return {
    timestamp,
    selected
  }
}

export const downloadVrRemoteFiles = async ({
  entries,
  overwrite = false
}: {
  entries: Array<{ remoteName: string, localName: string, shouldDownload?: boolean }>
  overwrite?: boolean
}) => {
  const config = getVrRuntimeConfig()
  const filteredEntries = entries.filter(entry => overwrite || entry.shouldDownload !== false)

  if (filteredEntries.length === 0) {
    return []
  }

  const batchCommands = filteredEntries
    .map((entry) => `get ${sftpBatchValue(entry.remoteName)} ${sftpBatchValue(entry.localName)}`)
    .join('\n')

  const resultLines = filteredEntries
    .map((entry) => `echo "__RESULT__|baixado|${entry.remoteName}|${entry.localName}|${config.downloadsPath}/${entry.localName}"`)
    .join('\n')

  const remoteScript = `
set -e
${buildEnsureVrStructureScript()}
LOG_FILE="${config.logsPath}/vr_$(date +%Y%m%d).log"
TMP_BATCH="/tmp/vr_download_$$.txt"
cat > "$TMP_BATCH" <<'EOF'
cd ${config.sftpRemoteDir}
lcd ${config.downloadsPath}
${batchCommands}
EOF
{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Inicio download VR"
  sftp -o StrictHostKeyChecking=no -o BatchMode=yes -b "$TMP_BATCH" -P ${config.sftpPort} -i ${shellQuote(config.sftpPrivateKeyPath)} ${shellQuote(`${config.sftpUser}@${config.sftpHost}`)}
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fim download VR"
} >> "$LOG_FILE" 2>&1
rm -f "$TMP_BATCH"
${resultLines}
`

  const { stdout } = await runVrRemoteCommand(remoteScript, 300000)
  return parseDownloadResult(stdout)
}

export const readVrDownloadedFiles = async (fileNames: string[]) => {
  const config = getVrRuntimeConfig()
  const normalizedNames = Array.from(new Set((fileNames || []).map(name => String(name || '').trim()).filter(Boolean)))

  if (normalizedNames.length === 0) {
    return []
  }

  const validations = normalizedNames
    .map((name) => {
      const fullPath = `${config.downloadsPath}/${name}`
      return [
        `if [ ! -f ${shellQuote(fullPath)} ]; then echo "__MISSING__|${name}"; exit 21; fi`,
        `echo "__FILE__|${name}"`,
        `base64 -w 0 ${shellQuote(fullPath)}`,
        `echo ""`,
        `echo "__END_FILE__|${name}"`
      ].join('\n')
    })
    .join('\n')

  const remoteScript = `
set -e
${buildEnsureVrStructureScript()}
${validations}
`

  const { stdout } = await runVrRemoteCommand(remoteScript, 300000)
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
