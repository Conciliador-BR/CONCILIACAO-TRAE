import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const shellQuote = (value: string) => `'${String(value || '').replace(/'/g, `'\\''`)}'`
const toPosixPath = (value: string) => String(value || '').replace(/\\/g, '/')

const ensureNonEmptyPath = (value: string, label: string) => {
  const normalized = toPosixPath(String(value || '').trim())
  if (!normalized) {
    throw createError({
      statusCode: 500,
      statusMessage: `O caminho ${label} da Alelo ficou vazio na configuracao do servidor.`
    })
  }
  return normalized
}

export type AleloRemoteFile = {
  fileName: string
  brand: 'ALELO' | 'NAIP'
  referenceDate: string
  cnpj: string
}

export type AleloProcessedFile = AleloRemoteFile & {
  size: number
  modifiedAt: string
  fullPath: string
  cnpjFolder: string
}

export type AleloProcessedFileContent = {
  fileName: string
  content: string
}

export const normalizeAleloCnpj = (value: unknown) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits || digits.length > 14) return ''
  return digits.padStart(14, '0')
}

export const parseAleloRemoteFileName = (fileName: string): AleloRemoteFile | null => {
  const safeName = path.posix.basename(String(fileName || '').trim())
  if (!safeName || !/^[a-zA-Z0-9._-]+$/.test(safeName)) return null

  const parsed = path.posix.parse(safeName)
  if (parsed.ext && parsed.ext.toLowerCase() !== '.txt') return null

  const parts = parsed.name.split('_')
  const brand = String(parts[2] || '').toUpperCase()
  const referenceDate = String(parts[0] || '')
  const cnpj = normalizeAleloCnpj(parts[5])

  if (!/^\d{8}$/.test(referenceDate)) return null
  if (brand !== 'ALELO' && brand !== 'NAIP') return null
  if (!/^\d{14}$/.test(String(parts[5] || '')) || !cnpj) return null

  return {
    fileName: safeName,
    brand,
    referenceDate,
    cnpj
  }
}

export const selectAleloRemoteFiles = (fileNames: string[], cnpj: unknown) => {
  const normalizedCnpj = normalizeAleloCnpj(cnpj)
  if (!normalizedCnpj) return []

  return Array.from(new Set((fileNames || []).map(item => String(item || '').trim())))
    .map(parseAleloRemoteFileName)
    .filter((item): item is AleloRemoteFile => !!item && item.cnpj === normalizedCnpj)
}

export const getAleloRuntimeConfig = () => {
  const config = useRuntimeConfig()
  const basePath = ensureNonEmptyPath(String(config.aleloBasePath || '/opt/conciliadora/Alelo'), 'basePath')
  const processadosPath = ensureNonEmptyPath(`${basePath}/processados`, 'processadosPath')
  const processadosCnpjPath = ensureNonEmptyPath(`${processadosPath}/cnpj`, 'processadosCnpjPath')
  const logsPath = ensureNonEmptyPath(`${basePath}/logs`, 'logsPath')

  return {
    serverHost: String(config.public?.serverInfraHost || '').trim(),
    sshUser: String(config.serverInfraSshUser || 'ubuntu').trim() || 'ubuntu',
    sshPrivateKeyPath: String(config.serverInfraSshPrivateKeyPath || '').trim(),
    basePath,
    processadosPath,
    processadosCnpjPath,
    logsPath,
    sftpHost: String(config.aleloSftpHost || 'sftp.alelo.hubdeintegracao.com.br').trim(),
    sftpPort: Number(config.aleloSftpPort || 8222) || 8222,
    sftpUser: String(config.aleloSftpUser || 'economic_card').trim(),
    sftpRemoteDir: toPosixPath(String(config.aleloSftpRemoteDir || '/').trim() || '/'),
    sftpProcessedDir: toPosixPath(String(config.aleloSftpProcessedDir || 'PROCESSADOS').trim() || 'PROCESSADOS'),
    sftpPasswordFile: toPosixPath(String(config.aleloSftpPasswordFile || '/home/ubuntu/.config/conciliadora/alelo_sftp_password').trim())
  }
}

const assertAleloRuntimeConfig = () => {
  const config = getAleloRuntimeConfig()

  if (!config.serverHost) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configure NUXT_PUBLIC_SERVER_INFRA_HOST para acessar o servidor da conciliadora.'
    })
  }

  if (!config.sshPrivateKeyPath) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configure SERVER_INFRA_SSH_PRIVATE_KEY_PATH para acessar o servidor da conciliadora.'
    })
  }

  return config
}

const runAleloServerCommand = async (remoteScript: string, timeout = 180000) => {
  const config = assertAleloRuntimeConfig()
  const remoteCommand = `bash -lc ${shellQuote(remoteScript)}`
  const args = [
    '-i', config.sshPrivateKeyPath,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
    `${config.sshUser}@${config.serverHost}`,
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
    if (String(error?.code || '').toUpperCase() === 'ENAMETOOLONG') {
      throw createError({
        statusCode: 500,
        statusMessage: 'Falha ao executar comando da Alelo no servidor: comando SSH excedeu o limite de tamanho (ENAMETOOLONG). Reduza a quantidade de arquivos selecionados e tente novamente.'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: String(error?.stderr || error?.stdout || error?.message || 'Falha ao executar comando da Alelo no servidor.').trim()
    })
  }
}

const buildEnsureAleloStructureScript = () => {
  const config = getAleloRuntimeConfig()
  return [
    config.basePath,
    config.processadosPath,
    config.processadosCnpjPath,
    config.logsPath
  ].map(item => `mkdir -p ${shellQuote(item)}`).join(' && ')
}

const buildAssertSftpReadyScript = () => {
  const config = getAleloRuntimeConfig()
  return [
    'command -v sshpass >/dev/null 2>&1 || { echo "sshpass nao esta instalado no servidor."; exit 41; }',
    `test -s ${shellQuote(config.sftpPasswordFile)} || { echo "Arquivo de senha SFTP da Alelo nao configurado."; exit 42; }`
  ].join('\n')
}

const buildSftpCommand = (batchFile: string) => {
  const config = getAleloRuntimeConfig()
  return `SSHPASS="$(cat ${shellQuote(config.sftpPasswordFile)})" sshpass -e sftp -o StrictHostKeyChecking=accept-new -o HostKeyAlgorithms=+ssh-rsa -o BatchMode=no -b ${batchFile} -P ${config.sftpPort} ${shellQuote(`${config.sftpUser}@${config.sftpHost}`)}`
}

const parseRemoteFileList = (stdout: string) => {
  return String(stdout || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('__REMOTE__|'))
    .map(line => line.split('|')[1] || '')
    .filter(Boolean)
}

const parseProcessedFileList = (stdout: string): AleloProcessedFile[] => {
  return String(stdout || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('__PROCESSED__|'))
    .map((line) => {
      const [, fileName, size, modifiedAt, fullPath, cnpjFolder] = line.split('|')
      const parsed = parseAleloRemoteFileName(fileName || '')
      if (!parsed) return null

      return {
        ...parsed,
        size: Number(size || 0) || 0,
        modifiedAt: String(modifiedAt || '').trim(),
        fullPath: String(fullPath || '').trim(),
        cnpjFolder: String(cnpjFolder || '').trim()
      }
    })
    .filter((item): item is AleloProcessedFile => !!item)
}

const parseTransferResults = (stdout: string) => {
  return String(stdout || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('__TRANSFERRED__|'))
    .map((line) => {
      const [, status, brand, fileName, cnpj, fullPath] = line.split('|')
      return {
        status: String(status || '').trim(),
        brand: String(brand || '').trim(),
        fileName: String(fileName || '').trim(),
        cnpj: String(cnpj || '').trim(),
        fullPath: String(fullPath || '').trim()
      }
    })
}

export const ensureAleloServerStructure = async () => {
  const config = getAleloRuntimeConfig()
  await runAleloServerCommand(buildEnsureAleloStructureScript())
  return config
}

export const listAleloRemoteFiles = async () => {
  const config = getAleloRuntimeConfig()
  const remoteScript = `
set -e
${buildEnsureAleloStructureScript()}
${buildAssertSftpReadyScript()}
TMP_BATCH="/tmp/alelo_list_$$.txt"
cat > "$TMP_BATCH" <<'EOF'
cd ${config.sftpRemoteDir}
ls -1
EOF
set +e
OUTPUT="$(${buildSftpCommand('"$TMP_BATCH"')} 2>&1)"
EXIT_CODE=$?
set -e
rm -f "$TMP_BATCH"
if [ "$EXIT_CODE" -ne 0 ]; then
  printf '%s\\n' "$OUTPUT"
  exit "$EXIT_CODE"
fi
printf '%s\\n' "$OUTPUT" | while IFS= read -r line; do
  case "$line" in
    ""|"sftp>"*|"Connected to "*|"Changing to: "*)
      continue
      ;;
    *)
      echo "__REMOTE__|$line"
      ;;
  esac
done
`

  const { stdout } = await runAleloServerCommand(remoteScript, 120000)
  return parseRemoteFileList(stdout)
}

export const listAleloProcessedFiles = async (cnpj: unknown) => {
  const config = getAleloRuntimeConfig()
  const normalizedCnpj = normalizeAleloCnpj(cnpj)
  if (!normalizedCnpj) return []

  const targetDirectory = path.posix.join(config.processadosCnpjPath, normalizedCnpj)
  const remoteScript = `
set -e
${buildEnsureAleloStructureScript()}
mkdir -p ${shellQuote(targetDirectory)}
find ${shellQuote(targetDirectory)} -maxdepth 1 -type f | sort | while IFS= read -r fullpath; do
  file_name="$(basename "$fullpath")"
  size="$(stat -c %s "$fullpath")"
  modified_at="$(stat -c %y "$fullpath")"
  echo "__PROCESSED__|$file_name|$size|$modified_at|$fullpath|${normalizedCnpj}"
done
`

  const { stdout } = await runAleloServerCommand(remoteScript, 120000)
  return parseProcessedFileList(stdout)
}

export const readAleloLogTail = async (lines = 120) => {
  const config = getAleloRuntimeConfig()
  const safeLines = Number.isFinite(lines) ? Math.max(10, Math.min(200, Number(lines))) : 120
  const remoteScript = `
set -e
${buildEnsureAleloStructureScript()}
LOG_FILE="${config.logsPath}/alelo_$(date +%Y%m%d).log"
if [ -f "$LOG_FILE" ]; then
  tail -n ${safeLines} "$LOG_FILE"
fi
`

  const { stdout } = await runAleloServerCommand(remoteScript, 120000)
  return String(stdout || '').trim()
}

export const readAleloProcessedFiles = async (
  fileNames: string[],
  cnpj: unknown
): Promise<AleloProcessedFileContent[]> => {
  const config = getAleloRuntimeConfig()
  const normalizedCnpj = normalizeAleloCnpj(cnpj)

  if (!normalizedCnpj) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um CNPJ valido para ler os arquivos da Alelo.'
    })
  }

  const selectedNames = Array.from(new Set((fileNames || []).map(item => String(item || '').trim())))
    .filter((fileName) => {
      const parsed = parseAleloRemoteFileName(fileName)
      return parsed?.cnpj === normalizedCnpj
    })

  if (selectedNames.length === 0) return []

  const targetDirectory = path.posix.join(config.processadosCnpjPath, normalizedCnpj)
  const chunks: string[][] = []
  for (let i = 0; i < selectedNames.length; i += 20) {
    chunks.push(selectedNames.slice(i, i + 20))
  }

  const results: AleloProcessedFileContent[] = []

  for (const chunk of chunks) {
    const readBlocks = chunk.map((fileName) => {
      const fullPath = path.posix.join(targetDirectory, fileName)
      return `
test -f ${shellQuote(fullPath)} || { echo "Arquivo Alelo nao encontrado: ${fileName}" >&2; exit 44; }
printf '__ALELO_FILE__|%s|' ${shellQuote(fileName)}
base64 -w 0 ${shellQuote(fullPath)}
printf '\\n'
`
    }).join('\n')
    const remoteScript = `
set -e
${buildEnsureAleloStructureScript()}
${readBlocks}
`

    const { stdout } = await runAleloServerCommand(remoteScript, 300000)

    results.push(
      ...String(stdout || '')
        .split(/\r?\n/)
        .filter(line => line.startsWith('__ALELO_FILE__|'))
        .map((line) => {
          const [, fileName, encodedContent] = line.split('|')
          return {
            fileName: String(fileName || '').trim(),
            content: Buffer.from(String(encodedContent || ''), 'base64').toString('utf8')
          }
        })
    )
  }

  return results
}

export const transferAleloRemoteFiles = async ({
  entries,
  cnpj
}: {
  entries: AleloRemoteFile[]
  cnpj: unknown
}) => {
  const config = getAleloRuntimeConfig()
  const normalizedCnpj = normalizeAleloCnpj(cnpj)

  if (!normalizedCnpj) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um CNPJ valido para transferir os arquivos da Alelo.'
    })
  }

  const selected = (entries || []).filter(item => item.cnpj === normalizedCnpj)
  if (selected.length === 0) return []

  const targetDirectory = path.posix.join(config.processadosCnpjPath, normalizedCnpj)
  const remoteProcessedDirectory = path.posix.join(config.sftpProcessedDir, normalizedCnpj)

  const startScript = `
set -e
${buildEnsureAleloStructureScript()}
${buildAssertSftpReadyScript()}
mkdir -p ${shellQuote(targetDirectory)}
LOG_FILE="${config.logsPath}/alelo_$(date +%Y%m%d).log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Inicio transferencia Alelo/NAIP para CNPJ ${normalizedCnpj}" >> "$LOG_FILE"
`

  await runAleloServerCommand(startScript, 120000)

  const allResults: Array<ReturnType<typeof parseTransferResults>[number]> = []

  for (const [index, entry] of selected.entries()) {
    const localPath = path.posix.join(targetDirectory, entry.fileName)
    const partialPath = `${localPath}.part`
    const lockDirectory = `${localPath}.lock`
    const downloadBatch = `/tmp/alelo_download_$$_${index}.txt`
    const moveBatch = `/tmp/alelo_move_$$_${index}.txt`

    const remoteScript = `
set -e
${buildEnsureAleloStructureScript()}
${buildAssertSftpReadyScript()}
mkdir -p ${shellQuote(targetDirectory)}
LOG_FILE="${config.logsPath}/alelo_$(date +%Y%m%d).log"
if ! mkdir ${shellQuote(lockDirectory)} 2>/dev/null; then
  echo "__TRANSFERRED__|concorrente|${entry.brand}|${entry.fileName}|${normalizedCnpj}|${localPath}"
  exit 0
fi
trap "rm -rf ${shellQuote(lockDirectory)} ${shellQuote(partialPath)} ${shellQuote(downloadBatch)} ${shellQuote(moveBatch)}" EXIT
STATUS="existente"
if [ ! -e ${shellQuote(localPath)} ]; then
  rm -f ${shellQuote(partialPath)}
  cat > ${shellQuote(downloadBatch)} <<'EOF'
cd ${config.sftpRemoteDir}
get ${entry.fileName} ${partialPath}
EOF
  ${buildSftpCommand(shellQuote(downloadBatch))} >> "$LOG_FILE" 2>&1
  rm -f ${shellQuote(downloadBatch)}
  test -s ${shellQuote(partialPath)}
  mv -n ${shellQuote(partialPath)} ${shellQuote(localPath)}
  if [ -e ${shellQuote(partialPath)} ]; then
    rm -f ${shellQuote(partialPath)}
  else
    STATUS="baixado"
  fi
fi
cat > ${shellQuote(moveBatch)} <<'EOF'
cd ${config.sftpRemoteDir}
-mkdir ${config.sftpProcessedDir}
-mkdir ${remoteProcessedDirectory}
-rename ${entry.fileName} ${remoteProcessedDirectory}/${entry.fileName}
-rm ${entry.fileName}
EOF
${buildSftpCommand(shellQuote(moveBatch))} >> "$LOG_FILE" 2>&1
rm -f ${shellQuote(moveBatch)}
echo "__TRANSFERRED__|$STATUS|${entry.brand}|${entry.fileName}|${normalizedCnpj}|${localPath}"
`

    const { stdout } = await runAleloServerCommand(remoteScript, 600000)
    allResults.push(...parseTransferResults(stdout))
  }

  const endScript = `
set -e
${buildEnsureAleloStructureScript()}
LOG_FILE="${config.logsPath}/alelo_$(date +%Y%m%d).log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fim transferencia Alelo/NAIP para CNPJ ${normalizedCnpj}" >> "$LOG_FILE"
`

  await runAleloServerCommand(endScript, 120000)
  return allResults
}
