import { requireAdminAccess } from './adminAccess'
import {
  ensureAleloServerStructure,
  listAleloProcessedFiles,
  normalizeAleloCnpj,
  readAleloProcessedFiles
} from './aleloRemoteSftp'
import {
  buildAleloRecebimentosFromParsedFiles,
  buildAleloVendasFromParsedFiles
} from './aleloLayoutTxt'

const parseDateInput = (value: unknown) => {
  const text = String(value || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text.replace(/-/g, '') : ''
}

export const createAleloProcessarHandler = (
  type: 'vendas' | 'recebimentos'
) => defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const body = await readBody(event)
  const empresa = String(body?.empresa || '').trim()
  const ec = String(body?.ec || '').trim()
  const cnpj = normalizeAleloCnpj(body?.cnpj)
  const initialDate = parseDateInput(body?.dataInicial)
  const finalDate = parseDateInput(body?.dataFinal)
  const requestedNames = new Set(
    (Array.isArray(body?.fileNames) ? body.fileNames : [])
      .map((item: unknown) => String(item || '').trim())
      .filter(Boolean)
  )

  if (!empresa) {
    throw createError({ statusCode: 400, statusMessage: 'Nao foi possivel identificar a empresa selecionada.' })
  }
  if (!ec) {
    throw createError({ statusCode: 400, statusMessage: 'A empresa selecionada nao possui EC/matriz preenchida.' })
  }
  if (!cnpj) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um CNPJ valido para processar arquivos da Alelo.' })
  }

  await ensureAleloServerStructure()
  const processedFiles = await listAleloProcessedFiles(cnpj)
  const selectedFiles = processedFiles.filter((file) => {
    if (requestedNames.size > 0 && !requestedNames.has(file.fileName)) return false
    if (initialDate && file.referenceDate < initialDate) return false
    if (finalDate && file.referenceDate > finalDate) return false
    return true
  })

  if (selectedFiles.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Nenhum arquivo Alelo/NAIP foi encontrado para o CNPJ e periodo informados.'
    })
  }

  const contents = await readAleloProcessedFiles(
    selectedFiles.map(file => file.fileName),
    cnpj
  )
  const metadataByName = new Map(selectedFiles.map(file => [file.fileName, file]))
  const sourceFiles = contents.map((file) => ({
    ...file,
    referenceDate: metadataByName.get(file.fileName)?.referenceDate,
    modifiedAt: metadataByName.get(file.fileName)?.modifiedAt
  }))
  const builder = type === 'vendas'
    ? buildAleloVendasFromParsedFiles
    : buildAleloRecebimentosFromParsedFiles
  const result = await builder({ files: sourceFiles, empresa, ec })

  if (result.registros.length === 0) {
    const detail = type === 'recebimentos'
      ? 'Somente pagamentos com status 003 (efetivado) sao importados.'
      : 'Somente movimentos 01 (venda) dos extratos 01 e 04 sao importados.'
    throw createError({
      statusCode: 422,
      statusMessage: `Os arquivos Alelo/NAIP selecionados nao geraram ${type} validos. ${detail}`
    })
  }

  return {
    filtro: {
      empresa,
      ec,
      cnpj,
      dataInicial: String(body?.dataInicial || '').trim(),
      dataFinal: String(body?.dataFinal || '').trim(),
      adquirente: 'alelo'
    },
    arquivosSelecionados: selectedFiles,
    ...result
  }
})
