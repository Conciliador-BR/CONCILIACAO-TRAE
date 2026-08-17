import { requireAdminAccess } from '../../../../../utils/adminAccess'
import {
  ensureVrRemoteStructure,
  listVrDownloadedFiles,
  listVrRemoteFiles,
  readVrLogTail
} from '../../../../../utils/vrRemoteSftp'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)

  let config = null
  try {
    config = await ensureVrRemoteStructure()
  } catch (error: any) {
    return {
      config: null,
      resumo: {
        totalArquivosRemotos: 0,
        totalArquivosBaixados: 0
      },
      remoteFiles: [],
      downloadedFiles: [],
      logTail: '',
      erros: {
        estrutura: String(error?.statusMessage || error?.message || 'Falha ao preparar estrutura VR.'),
        remoto: '',
        downloads: '',
        log: ''
      }
    }
  }

  const [remoteFilesResult, downloadedFilesResult, logResult] = await Promise.allSettled([
    listVrRemoteFiles(),
    listVrDownloadedFiles(),
    readVrLogTail(120)
  ])

  const remoteFiles = remoteFilesResult.status === 'fulfilled' ? remoteFilesResult.value : []
  const downloadedFiles = downloadedFilesResult.status === 'fulfilled' ? downloadedFilesResult.value : []
  const logTail = logResult.status === 'fulfilled' ? logResult.value : ''

  return {
    config: config ? {
      oracleHost: config.oracleHost,
      oracleSshUser: config.oracleSshUser,
      basePath: config.basePath,
      downloadsPath: config.downloadsPath,
      processadosPath: config.processadosPath,
      exportsPath: config.exportsPath,
      logsPath: config.logsPath,
      sftpHost: config.sftpHost,
      sftpPort: config.sftpPort,
      sftpUser: config.sftpUser,
      sftpRemoteDir: config.sftpRemoteDir,
      sftpPrivateKeyPath: config.sftpPrivateKeyPath,
      fixedRemoteName: config.fixedRemoteName
    } : null,
    resumo: {
      totalArquivosRemotos: remoteFiles.length,
      totalArquivosBaixados: downloadedFiles.filter(item => String(item.fileName || '').toLowerCase().endsWith('.txt')).length
    },
    remoteFiles,
    downloadedFiles,
    logTail,
    erros: {
      estrutura: '',
      remoto: remoteFilesResult.status === 'rejected' ? String(remoteFilesResult.reason?.statusMessage || remoteFilesResult.reason?.message || 'Falha ao listar arquivos remotos.') : '',
      downloads: downloadedFilesResult.status === 'rejected' ? String(downloadedFilesResult.reason?.statusMessage || downloadedFilesResult.reason?.message || 'Falha ao listar downloads locais.') : '',
      log: logResult.status === 'rejected' ? String(logResult.reason?.statusMessage || logResult.reason?.message || 'Falha ao ler log da VR.') : ''
    }
  }
})
