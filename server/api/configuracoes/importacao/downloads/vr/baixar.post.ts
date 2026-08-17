import { requireAdminAccess } from '../../../../../utils/adminAccess'
import {
  buildVrRemoteSelection,
  downloadVrRemoteFiles,
  ensureVrRemoteStructure,
  listVrDownloadedFiles,
  listVrRemoteFiles,
  normalizeVrCnpj,
  readVrLogTail
} from '../../../../../utils/vrRemoteSftp'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  await ensureVrRemoteStructure()

  const body = await readBody(event)
  const cnpj = normalizeVrCnpj(body?.cnpj)
  const dataInicial = String(body?.dataInicial || '').trim()
  const dataFinal = String(body?.dataFinal || '').trim()
  const overwrite = !!body?.overwrite
  const fixedRemoteName = String(body?.fixedRemoteName || '').trim()

  const [remoteFiles, downloadedFilesAntes] = await Promise.all([
    listVrRemoteFiles(),
    listVrDownloadedFiles()
  ])

  const selecao = buildVrRemoteSelection({
    remoteFiles,
    downloadedFiles: downloadedFilesAntes,
    cnpj,
    dataInicial,
    dataFinal,
    fixedRemoteName,
    overwrite
  })

  const entriesParaBaixar = selecao.selected.filter(item => item.shouldDownload)
  const entriesPulados = selecao.selected.filter(item => !item.shouldDownload)

  let downloadsExecutados: Array<{ status: string, remoteName: string, localName: string, fullPath: string }> = []
  if (entriesParaBaixar.length > 0) {
    downloadsExecutados = await downloadVrRemoteFiles({
      entries: entriesParaBaixar,
      overwrite
    })
  }

  const [downloadedFilesDepois, logTail] = await Promise.all([
    listVrDownloadedFiles(),
    readVrLogTail(120)
  ])

  return {
    filtro: {
      cnpj,
      dataInicial,
      dataFinal,
      overwrite,
      fixedRemoteName
    },
    resumo: {
      totalArquivosRemotos: remoteFiles.length,
      totalSelecionados: selecao.selected.length,
      totalBaixados: downloadsExecutados.length,
      totalPulados: entriesPulados.length,
      totalDownloadsLocais: downloadedFilesDepois.filter(item => String(item.fileName || '').toLowerCase().endsWith('.txt')).length
    },
    arquivosSelecionados: selecao.selected,
    downloadsExecutados,
    arquivosPulados: entriesPulados,
    downloadedFiles: downloadedFilesDepois,
    logTail
  }
})
