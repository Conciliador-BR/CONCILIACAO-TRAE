import { requireAdminAccess } from '../../../../../utils/adminAccess'
import {
  ensureVrRemoteStructure,
  listVrDownloadedFiles,
  listVrRemoteFiles,
  readVrLogTail
} from '../../../../../utils/vrRemoteSftp'
import { resolveVrCredential } from '../../../../../utils/vrCredentialLookup'

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  const query = getQuery(event)
  const adquirente = String(query?.adquirente || 'vr').trim() || 'vr'
  const empresaNome = String(query?.empresaNome || '').trim()
  const ec = String(query?.ec || '').trim()

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
        credencial: '',
        remoto: '',
        downloads: '',
        log: ''
      }
    }
  }

  let credencialVr = null
  let erroCredencial = ''

  if (empresaNome || ec) {
    try {
      credencialVr = await resolveVrCredential({
        accessToken,
        adquirente,
        empresaNome,
        ec
      })
    } catch (error: any) {
      erroCredencial = String(error?.statusMessage || error?.message || 'Falha ao localizar o cadastro da VR.')
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
      downloadsCnpjPath: config.downloadsCnpjPath,
      processadosPath: config.processadosPath,
      exportsPath: config.exportsPath,
      logsPath: config.logsPath,
      sftpHost: config.sftpHost,
      sftpPort: config.sftpPort,
      sftpUser: config.sftpUser,
      sftpRemoteDir: config.sftpRemoteDir,
      sftpPrivateKeyPath: config.sftpPrivateKeyPath
    } : null,
    lookup: {
      adquirente,
      empresaNome,
      ec,
      encontrouCredencial: !!credencialVr,
      remoteFileName: String(credencialVr?.client_id || '').trim(),
      credencialId: credencialVr?.id || null
    },
    resumo: {
      totalArquivosRemotos: remoteFiles.length,
      totalArquivosBaixados: downloadedFiles.filter(item => String(item.fileName || '').toLowerCase().endsWith('.txt')).length
    },
    remoteFiles,
    downloadedFiles,
    logTail,
    erros: {
      estrutura: '',
      credencial: erroCredencial,
      remoto: remoteFilesResult.status === 'rejected' ? String(remoteFilesResult.reason?.statusMessage || remoteFilesResult.reason?.message || 'Falha ao listar arquivos remotos.') : '',
      downloads: downloadedFilesResult.status === 'rejected' ? String(downloadedFilesResult.reason?.statusMessage || downloadedFilesResult.reason?.message || 'Falha ao listar downloads locais.') : '',
      log: logResult.status === 'rejected' ? String(logResult.reason?.statusMessage || logResult.reason?.message || 'Falha ao ler log da VR.') : ''
    }
  }
})
