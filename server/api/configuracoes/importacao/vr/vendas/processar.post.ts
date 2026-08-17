import { requireAdminAccess } from '../../../../../utils/adminAccess'
import { buildVrVendasFromParsedFiles } from '../../../../../utils/vrLayout16ap'
import { listVrDownloadedFiles, normalizeVrCnpj, readVrDownloadedFiles } from '../../../../../utils/vrRemoteSftp'

const parseDateInput = (value: string) => {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
  return text.replace(/-/g, '')
}

const filtrarArquivos = ({
  arquivos,
  cnpj,
  dataInicial,
  dataFinal,
  fileNames
}: {
  arquivos: Array<{ fileName: string, originalStem?: string, referenceDate?: string }>
  cnpj: string
  dataInicial: string
  dataFinal: string
  fileNames: string[]
}) => {
  const nomesExplicitamenteSelecionados = new Set((fileNames || []).map(item => String(item || '').trim()).filter(Boolean))
  if (nomesExplicitamenteSelecionados.size > 0) {
    return arquivos.filter(item => nomesExplicitamenteSelecionados.has(String(item.fileName || '').trim()))
  }

  const start = parseDateInput(dataInicial)
  const end = parseDateInput(dataFinal)

  return arquivos.filter((arquivo) => {
    const fileName = String(arquivo.fileName || '')
    const originalStem = String(arquivo.originalStem || '')
    const referenceDate = String(arquivo.referenceDate || '')

    if (!fileName.toLowerCase().endsWith('.txt')) return false
    if (cnpj && !originalStem.includes(cnpj)) return false
    if (start && referenceDate && referenceDate < start) return false
    if (end && referenceDate && referenceDate > end) return false
    if ((start || end) && !referenceDate) return false
    return true
  })
}

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const body = await readBody(event)

  const empresa = String(body?.empresa || '').trim()
  const ec = String(body?.ec || '').trim()
  const cnpj = normalizeVrCnpj(body?.cnpj)
  const dataInicial = String(body?.dataInicial || '').trim()
  const dataFinal = String(body?.dataFinal || '').trim()
  const fileNames = Array.isArray(body?.fileNames) ? body.fileNames : []

  if (!empresa) {
    throw createError({ statusCode: 400, statusMessage: 'Nao foi possivel identificar a empresa selecionada.' })
  }

  if (!ec) {
    throw createError({ statusCode: 400, statusMessage: 'A empresa selecionada nao possui EC/matriz preenchida.' })
  }

  const downloadedFiles = await listVrDownloadedFiles()
  const arquivosSelecionados = filtrarArquivos({
    arquivos: downloadedFiles,
    cnpj,
    dataInicial,
    dataFinal,
    fileNames
  })

  if (arquivosSelecionados.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Nenhum arquivo VR baixado foi encontrado para o filtro informado.'
    })
  }

  const arquivosLidos = await readVrDownloadedFiles(arquivosSelecionados.map(item => item.fileName))
  const resultado = buildVrVendasFromParsedFiles({
    files: arquivosLidos,
    empresa,
    ec
  })

  if (resultado.registros.length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Os arquivos VR selecionados nao possuem vendas do tipo previsao (registro V com tipo P).'
    })
  }

  return {
    filtro: {
      empresa,
      ec,
      cnpj,
      dataInicial,
      dataFinal
    },
    arquivosSelecionados: arquivosSelecionados.map(item => ({
      fileName: item.fileName,
      referenceDate: item.referenceDate,
      downloadTimestamp: item.downloadTimestamp,
      fullPath: item.fullPath
    })),
    ...resultado
  }
})
