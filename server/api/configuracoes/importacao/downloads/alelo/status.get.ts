import { requireAdminAccess } from '../../../../../utils/adminAccess'
import {
  ensureAleloServerStructure,
  listAleloProcessedFiles,
  listAleloRemoteFiles,
  normalizeAleloCnpj,
  readAleloLogTail,
  selectAleloRemoteFiles
} from '../../../../../utils/aleloRemoteSftp'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const query = getQuery(event)
  const empresaNome = String(query?.empresaNome || '').trim()
  const ec = String(query?.ec || '').trim()
  const cnpj = normalizeAleloCnpj(query?.cnpj)

  let config = null
  try {
    config = await ensureAleloServerStructure()
  } catch (error: any) {
    return {
      config: null,
      lookup: { adquirente: 'alelo', empresaNome, ec, cnpj },
      resumo: {
        totalArquivosRemotos: 0,
        totalArquivosProcessados: 0
      },
      remoteFiles: [],
      processedFiles: [],
      logTail: '',
      erros: {
        estrutura: String(error?.statusMessage || error?.message || 'Falha ao preparar estrutura Alelo.'),
        remoto: '',
        processados: '',
        log: ''
      }
    }
  }

  const [remoteResult, processedResult, logResult] = await Promise.allSettled([
    listAleloRemoteFiles(),
    listAleloProcessedFiles(cnpj),
    readAleloLogTail(120)
  ])

  const remoteFileNames = remoteResult.status === 'fulfilled' ? remoteResult.value : []
  const remoteFiles = selectAleloRemoteFiles(remoteFileNames, cnpj)
  const processedFiles = processedResult.status === 'fulfilled' ? processedResult.value : []
  const logTail = logResult.status === 'fulfilled' ? logResult.value : ''

  return {
    config: {
      serverHost: config.serverHost,
      basePath: config.basePath,
      processadosPath: config.processadosPath,
      processadosCnpjPath: config.processadosCnpjPath,
      logsPath: config.logsPath,
      sftpHost: config.sftpHost,
      sftpPort: config.sftpPort,
      sftpUser: config.sftpUser,
      sftpRemoteDir: config.sftpRemoteDir,
      sftpProcessedDir: config.sftpProcessedDir
    },
    lookup: {
      adquirente: 'alelo',
      empresaNome,
      ec,
      cnpj
    },
    resumo: {
      totalArquivosRemotos: remoteFiles.length,
      totalArquivosProcessados: processedFiles.length
    },
    remoteFiles,
    processedFiles,
    logTail,
    erros: {
      estrutura: '',
      remoto: remoteResult.status === 'rejected'
        ? String(remoteResult.reason?.statusMessage || remoteResult.reason?.message || 'Falha ao listar arquivos no SFTP Alelo.')
        : '',
      processados: processedResult.status === 'rejected'
        ? String(processedResult.reason?.statusMessage || processedResult.reason?.message || 'Falha ao listar arquivos Alelo processados.')
        : '',
      log: logResult.status === 'rejected'
        ? String(logResult.reason?.statusMessage || logResult.reason?.message || 'Falha ao ler log Alelo.')
        : ''
    }
  }
})
