import { requireAdminAccess } from '../../../../../utils/adminAccess'
import {
  buildVrRemoteSelection,
  downloadVrRemoteFiles,
  ensureVrRemoteStructure,
  filterVrDownloadedFiles,
  filterVrRemoteFiles,
  listVrDownloadedFiles,
  listVrRemoteFiles,
  normalizeVrCnpj,
  readVrLogTail
} from '../../../../../utils/vrRemoteSftp'
import { resolveVrCredential } from '../../../../../utils/vrCredentialLookup'

export default defineEventHandler(async (event) => {
  const { accessToken } = await requireAdminAccess(event)
  await ensureVrRemoteStructure()

  const body = await readBody(event)
  const adquirente = String(body?.adquirente || 'vr').trim() || 'vr'
  const empresaNome = String(body?.empresaNome || '').trim()
  const ec = String(body?.ec || '').trim()
  const cnpj = normalizeVrCnpj(body?.cnpj)
  const dataInicial = String(body?.dataInicial || '').trim()
  const dataFinal = String(body?.dataFinal || '').trim()

  const credencialVr = await resolveVrCredential({
    accessToken,
    adquirente,
    empresaNome,
    ec
  })

  const remoteFileName = String(credencialVr?.client_id || '').trim()

  const [remoteFiles, downloadedFilesAntes] = await Promise.all([
    listVrRemoteFiles(),
    listVrDownloadedFiles()
  ])
  const filteredRemoteFiles = filterVrRemoteFiles({
    remoteFiles,
    cnpj,
    dataInicial,
    dataFinal,
    fixedRemoteName: remoteFileName
  })

  const selecao = buildVrRemoteSelection({
    remoteFiles: filteredRemoteFiles,
    downloadedFiles: downloadedFilesAntes,
    cnpj,
    dataInicial,
    dataFinal,
    fixedRemoteName: remoteFileName
  })

  const entriesParaBaixar = selecao.selected.filter(item => item.shouldDownload)
  const entriesPulados = selecao.selected.filter(item => !item.shouldDownload)

  let downloadsExecutados: Array<{ status: string, remoteName: string, localName: string, fullPath: string }> = []
  if (entriesParaBaixar.length > 0) {
    downloadsExecutados = await downloadVrRemoteFiles({
      entries: entriesParaBaixar,
      cnpj
    })
  }

  const [downloadedFilesDepois, logTail] = await Promise.all([
    listVrDownloadedFiles(),
    readVrLogTail(120)
  ])
  const filteredDownloadedFilesDepois = filterVrDownloadedFiles({
    downloadedFiles: downloadedFilesDepois,
    cnpj,
    dataInicial,
    dataFinal
  })

  return {
    filtro: {
      adquirente,
      empresaNome,
      ec,
      cnpj,
      dataInicial,
      dataFinal,
      remoteFileName
    },
    lookup: {
      credencialId: credencialVr?.id || null,
      remoteFileName
    },
    resumo: {
      totalArquivosRemotos: filteredRemoteFiles.length,
      totalSelecionados: selecao.selected.length,
      totalBaixados: downloadsExecutados.length,
      totalPulados: entriesPulados.length,
      totalDownloadsLocais: filteredDownloadedFilesDepois.length
    },
    arquivosSelecionados: selecao.selected,
    downloadsExecutados,
    arquivosPulados: entriesPulados,
    remoteFiles: filteredRemoteFiles,
    downloadedFiles: filteredDownloadedFilesDepois,
    logTail
  }
})
