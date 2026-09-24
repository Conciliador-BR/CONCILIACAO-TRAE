import { requireAdminAccess } from '../../../../../utils/adminAccess'
import {
  ensureAleloServerStructure,
  listAleloProcessedFiles,
  listAleloRemoteFiles,
  normalizeAleloCnpj,
  readAleloLogTail,
  selectAleloRemoteFiles,
  transferAleloRemoteFiles
} from '../../../../../utils/aleloRemoteSftp'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  await ensureAleloServerStructure()

  const body = await readBody(event)
  const empresaNome = String(body?.empresaNome || '').trim()
  const ec = String(body?.ec || '').trim()
  const cnpj = normalizeAleloCnpj(body?.cnpj)

  if (!cnpj) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Selecione uma empresa com CNPJ valido antes de transferir arquivos Alelo.'
    })
  }

  const remoteFileNames = await listAleloRemoteFiles()
  const selectedFiles = selectAleloRemoteFiles(remoteFileNames, cnpj)
  const transfers = await transferAleloRemoteFiles({
    entries: selectedFiles,
    cnpj
  })

  const [processedFiles, remainingRemoteFileNames, logTail] = await Promise.all([
    listAleloProcessedFiles(cnpj),
    listAleloRemoteFiles(),
    readAleloLogTail(120)
  ])
  const remainingRemoteFiles = selectAleloRemoteFiles(remainingRemoteFileNames, cnpj)

  return {
    lookup: {
      adquirente: 'alelo',
      empresaNome,
      ec,
      cnpj
    },
    resumo: {
      totalSelecionados: selectedFiles.length,
      totalTransferidos: transfers.length,
      totalBaixados: transfers.filter(item => item.status === 'baixado').length,
      totalPulados: transfers.filter(item => item.status !== 'baixado').length,
      totalArquivosRemotos: remainingRemoteFiles.length,
      totalArquivosProcessados: processedFiles.length
    },
    selectedFiles,
    transfers,
    remoteFiles: remainingRemoteFiles,
    processedFiles,
    logTail
  }
})
