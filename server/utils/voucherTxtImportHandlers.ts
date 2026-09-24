import { requireAdminAccess } from './adminAccess'
import { resolveVoucherTxtCredential } from './voucherTxtCredentialLookup'
import { buildComprocardRecebimentosFromParsedFiles, buildComprocardVendasFromParsedFiles } from './comprocardLayoutTxt'
import { buildLecardRecebimentosFromParsedFiles, buildLecardVendasFromParsedFiles } from './lecardLayoutTxt'
import { buildUpbrasilRecebimentosFromParsedFiles, buildUpbrasilVendasFromParsedFiles } from './upbrasilLayoutTxt'
import { getVoucherTxtAcquirerMeta, ensureVoucherTxtStructure, listVoucherTxtFiles, listVoucherTxtProcessadosFiles, moveVoucherTxtFilesToProcessados, readVoucherTxtLogTail, readVoucherTxtProcessadosFiles } from './voucherTxtRemote'
import { getVoucherTxtFileMatchToken, normalizeVoucherTxtCnpj, normalizeVoucherTxtIdentifier } from './voucherTxtShared'

type ParsedFile = {
  fileName: string
  content: string
  referenceDate?: string
  modifiedAt?: string
  fullPath?: string
  relativePath?: string
  cnpjFolder?: string
  originalStem?: string
  downloadTimestamp?: string
}

const SALES_BUILDERS = {
  comprocard: buildComprocardVendasFromParsedFiles,
  upbrasil: buildUpbrasilVendasFromParsedFiles,
  lecard: buildLecardVendasFromParsedFiles
}

const RECEIPTS_BUILDERS = {
  comprocard: buildComprocardRecebimentosFromParsedFiles,
  upbrasil: buildUpbrasilRecebimentosFromParsedFiles,
  lecard: buildLecardRecebimentosFromParsedFiles
}

const parseDateInput = (value: string) => {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
  return text.replace(/-/g, '')
}

const matchesCredentialValue = (file: any, credentialToken: string) => {
  const token = String(credentialToken || '').trim()
  if (!token) return false

  const source = `${file?.fileName || ''} ${file?.originalStem || ''}`
  const normalizedSource = getVoucherTxtFileMatchToken(source)

  if (!normalizedSource) return false

  if (/^\d+$/.test(token)) {
    const numericParts = String(source || '').match(/\d+/g) || [] as string[]
    return numericParts.includes(token)
  }

  return normalizedSource.includes(token)
}

const filterVoucherTxtFiles = ({
  arquivos,
  cnpj,
  dataInicial,
  dataFinal,
  fileNames,
  credentialValue
}: {
  arquivos: any[]
  cnpj: string
  dataInicial: string
  dataFinal: string
  fileNames: string[]
  credentialValue?: string
}) => {
  const explicitNames = new Set((fileNames || []).map((item) => String(item || '').trim()).filter(Boolean))
  let filtered = (arquivos || []).filter((item) => {
    const fileName = String(item?.fileName || '')
    const referenceDate = String(item?.referenceDate || '')
    const cnpjFolderRaw = String(item?.cnpjFolder || '').trim().toLowerCase()
    const cnpjFolder = normalizeVoucherTxtCnpj(item?.cnpjFolder)
    const isInboxCnpjFolder = cnpjFolderRaw === 'cnpj'
    const originalStem = String(item?.originalStem || '')
    const start = parseDateInput(dataInicial)
    const end = parseDateInput(dataFinal)

    if (!fileName.toLowerCase().endsWith('.txt')) return false
    if (explicitNames.size > 0 && !explicitNames.has(fileName)) return false
    if (cnpj && cnpjFolder && cnpjFolder !== cnpj) return false
    if (cnpj && !cnpjFolder && !isInboxCnpjFolder && !originalStem.includes(cnpj)) return false
    if (start && referenceDate && referenceDate < start) return false
    if (end && referenceDate && referenceDate > end) return false
    if ((start || end) && !referenceDate) return false
    return true
  })

  const credentialToken = getVoucherTxtFileMatchToken(credentialValue)

  if (credentialToken) {
    return filtered.filter((item) => matchesCredentialValue(item, credentialToken))
  }

  return filtered
}

const serializeSelectedFiles = (arquivos: any[]) => {
  return (arquivos || []).map((item) => ({
    fileName: item.fileName,
    referenceDate: item.referenceDate,
    downloadTimestamp: item.downloadTimestamp,
    fullPath: item.fullPath,
    relativePath: item.relativePath,
    cnpjFolder: item.cnpjFolder
  }))
}

export const createVoucherTxtStatusHandler = (adquirente: string) => defineEventHandler(async (event) => {
  const meta = getVoucherTxtAcquirerMeta(adquirente)
  const { accessToken } = await requireAdminAccess(event)
  const query = getQuery(event)
  const empresaNome = String(query?.empresaNome || '').trim()
  const ec = String(query?.ec || '').trim()
  const cnpj = String(query?.cnpj || '').trim()

  let credencial = null
  let erroCredencial = ''

  if (empresaNome || ec || cnpj) {
    try {
      credencial = await resolveVoucherTxtCredential({
        accessToken,
        adquirente: meta.id,
        empresaNome,
        ec,
        cnpj
      })
    } catch (error: any) {
      erroCredencial = String(error?.statusMessage || error?.message || `Falha ao localizar o cadastro da ${meta.label}.`)
    }
  }

  let config = null
  try {
    config = await ensureVoucherTxtStructure(meta.id, cnpj)
  } catch (error: any) {
    return {
      config: null,
      lookup: {
        adquirente: meta.id,
        label: meta.label,
        credentialFieldLabel: meta.credentialFieldLabel,
        empresaNome,
        ec,
        encontrouCredencial: !!credencial,
        remoteFileName: String(credencial?.client_id || '').trim(),
        credencialId: credencial?.id || null
      },
      resumo: {
        totalArquivosServidor: 0,
        totalArquivosProcessados: 0
      },
      remoteFiles: [],
      downloadedFiles: [],
      processedFiles: [],
      logTail: '',
      erros: {
        estrutura: String(error?.statusMessage || error?.message || `Falha ao preparar estrutura da ${meta.label}.`),
        credencial: erroCredencial,
        remoto: '',
        downloads: '',
        log: ''
      }
    }
  }

  const [filesResult, processedResult, logResult] = await Promise.allSettled([
    listVoucherTxtFiles(meta.id, cnpj),
    listVoucherTxtProcessadosFiles(meta.id, cnpj),
    readVoucherTxtLogTail(meta.id, 120)
  ])

  const downloadedFiles = filesResult.status === 'fulfilled' ? filesResult.value : []
  const processedFiles = processedResult.status === 'fulfilled' ? processedResult.value : []
  const logTail = logResult.status === 'fulfilled' ? logResult.value : ''
  const credentialValue = String(credencial?.client_id || '').trim()
  const filteredDownloadedFiles = credentialValue
    ? filterVoucherTxtFiles({
      arquivos: downloadedFiles,
      cnpj: normalizeVoucherTxtCnpj(cnpj),
      dataInicial: '',
      dataFinal: '',
      fileNames: [],
      credentialValue
    })
    : downloadedFiles
  const filteredProcessedFiles = credentialValue
    ? filterVoucherTxtFiles({
      arquivos: processedFiles,
      cnpj: normalizeVoucherTxtCnpj(cnpj),
      dataInicial: '',
      dataFinal: '',
      fileNames: [],
      credentialValue
    })
    : processedFiles

  return {
    config: config ? {
      label: config.label,
      basePath: config.basePath,
      downloadsPath: config.downloadsPath,
      downloadsInboxPath: config.downloadsInboxPath,
      processadosPath: config.processadosPath,
      processadosCnpjPath: config.processadosCnpjPath,
      logsPath: config.logsPath,
      serverHost: config.serverHost,
      sshUser: config.sshUser
    } : null,
    lookup: {
      adquirente: meta.id,
      label: meta.label,
      credentialFieldLabel: meta.credentialFieldLabel,
      empresaNome,
      ec,
      encontrouCredencial: !!credencial,
      remoteFileName: credentialValue,
      credencialId: credencial?.id || null
    },
    resumo: {
      totalArquivosServidor: filteredDownloadedFiles.length,
      totalArquivosProcessados: filteredProcessedFiles.length
    },
    remoteFiles: filteredDownloadedFiles,
    downloadedFiles: filteredDownloadedFiles,
    processedFiles: filteredProcessedFiles,
    logTail,
    erros: {
      estrutura: '',
      credencial: erroCredencial,
      remoto: filesResult.status === 'rejected' ? String(filesResult.reason?.statusMessage || filesResult.reason?.message || `Falha ao listar arquivos da ${meta.label}.`) : '',
      downloads: '',
      log: logResult.status === 'rejected' ? String(logResult.reason?.statusMessage || logResult.reason?.message || `Falha ao ler log da ${meta.label}.`) : ''
    }
  }
})

export const createVoucherTxtBaixarHandler = (adquirente: string) => defineEventHandler(async (event) => {
  const meta = getVoucherTxtAcquirerMeta(adquirente)
  const { accessToken } = await requireAdminAccess(event)

  const body = await readBody(event)
  const empresaNome = String(body?.empresaNome || '').trim()
  const ec = String(body?.ec || '').trim()
  const cnpj = normalizeVoucherTxtCnpj(body?.cnpj)
  const dataInicial = String(body?.dataInicial || '').trim()
  const dataFinal = String(body?.dataFinal || '').trim()

  await ensureVoucherTxtStructure(meta.id, cnpj)

  const credencial = await resolveVoucherTxtCredential({
    accessToken,
    adquirente: meta.id,
    empresaNome,
    ec,
    cnpj
  })

  const downloadedFiles = await listVoucherTxtFiles(meta.id, cnpj)
  const arquivosSelecionados = filterVoucherTxtFiles({
    arquivos: downloadedFiles,
    cnpj,
    dataInicial: '',
    dataFinal: '',
    fileNames: [],
    credentialValue: String(credencial?.client_id || '').trim()
  })

  if (arquivosSelecionados.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `Nenhum arquivo ${meta.label} encontrado com o identificador cadastrado (${String(credencial?.client_id || '').trim() || '-'}).`
    })
  }

  const arquivosMovidos = await moveVoucherTxtFilesToProcessados({
    adquirente: meta.id,
    cnpj,
    fileNames: arquivosSelecionados.map((item) => item.fileName),
    files: arquivosSelecionados.map((item) => ({
      fileName: item.fileName,
      fullPath: item.fullPath
    }))
  })

  if (arquivosMovidos.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: `Nenhum arquivo ${meta.label} foi movido para processados. Verifique permissao e existencia dos arquivos em downloads/cnpj.`
    })
  }

  const [downloadedFilesAtualizados, processedFiles, logTail] = await Promise.all([
    listVoucherTxtFiles(meta.id, cnpj),
    listVoucherTxtProcessadosFiles(meta.id, cnpj),
    readVoucherTxtLogTail(meta.id, 120)
  ])

  return {
    filtro: {
      adquirente: meta.id,
      empresaNome,
      ec,
      cnpj,
      dataInicial,
      dataFinal,
      credentialValue: String(credencial?.client_id || '').trim()
    },
    lookup: {
      credencialId: credencial?.id || null,
      remoteFileName: String(credencial?.client_id || '').trim(),
      credentialFieldLabel: meta.credentialFieldLabel
    },
    resumo: {
      totalArquivosServidor: downloadedFilesAtualizados.length,
      totalArquivosProcessados: processedFiles.length,
      totalSelecionados: arquivosSelecionados.length,
      totalMovidos: arquivosMovidos.length
    },
    arquivosSelecionados: serializeSelectedFiles(arquivosSelecionados),
    arquivosMovidos,
    downloadedFiles: downloadedFilesAtualizados,
    processedFiles,
    logTail
  }
})

export const createVoucherTxtProcessarHandler = ({
  adquirente,
  tipo
}: {
  adquirente: string
  tipo: 'vendas' | 'recebimentos'
}) => defineEventHandler(async (event) => {
  const meta = getVoucherTxtAcquirerMeta(adquirente)
  const { accessToken } = await requireAdminAccess(event)
  const body = await readBody(event)

  const empresa = String(body?.empresa || '').trim()
  const ec = String(body?.ec || '').trim()
  const cnpj = normalizeVoucherTxtCnpj(body?.cnpj)
  const dataInicial = String(body?.dataInicial || '').trim()
  const dataFinal = String(body?.dataFinal || '').trim()
  const fileNames = Array.isArray(body?.fileNames) ? body.fileNames : []

  if (!empresa) {
    throw createError({ statusCode: 400, statusMessage: 'Nao foi possivel identificar a empresa selecionada.' })
  }

  if (!ec) {
    throw createError({ statusCode: 400, statusMessage: 'A empresa selecionada nao possui EC/matriz preenchida.' })
  }

  if (!cnpj) {
    throw createError({ statusCode: 400, statusMessage: `Informe um CNPJ valido para processar arquivos da ${meta.label}.` })
  }

  const credencial = await resolveVoucherTxtCredential({
    accessToken,
    adquirente: meta.id,
    empresaNome: empresa,
    ec,
    cnpj
  })

  await ensureVoucherTxtStructure(meta.id, cnpj)
  const processedFiles = await listVoucherTxtProcessadosFiles(meta.id, cnpj)
  const arquivosSelecionados = filterVoucherTxtFiles({
    arquivos: processedFiles,
    cnpj,
    dataInicial,
    dataFinal,
    fileNames,
    credentialValue: String(credencial?.client_id || '').trim()
  })

  if (arquivosSelecionados.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `Nenhum arquivo ${meta.label} foi encontrado para o filtro informado.`
    })
  }

  const arquivosLidos = await readVoucherTxtProcessadosFiles(meta.id, arquivosSelecionados.map((item) => item.fileName), cnpj)
  const filesByName = new Map(arquivosSelecionados.map((item) => [String(item.fileName || '').trim(), item]))
  const mergedFiles: ParsedFile[] = arquivosLidos.map((item) => {
    const metaItem = filesByName.get(String(item.fileName || '').trim()) || {}
    return {
      fileName: item.fileName,
      content: item.content,
      referenceDate: metaItem.referenceDate,
      modifiedAt: metaItem.modifiedAt,
      fullPath: metaItem.fullPath,
      relativePath: metaItem.relativePath,
      cnpjFolder: metaItem.cnpjFolder,
      originalStem: metaItem.originalStem,
      downloadTimestamp: metaItem.downloadTimestamp
    }
  })

  const builderMap = tipo === 'vendas' ? SALES_BUILDERS : RECEIPTS_BUILDERS
  const builder = builderMap[normalizeVoucherTxtIdentifier(meta.id) as keyof typeof builderMap]
  const resultado = await builder({
    files: mergedFiles,
    empresa,
    ec
  } as any)

  if (!Array.isArray(resultado?.registros) || resultado.registros.length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: `Os arquivos ${meta.label} selecionados nao geraram ${tipo} validos para importar.`
    })
  }

  const arquivosParaMover = Array.isArray(resultado?.arquivosComRegistros) && resultado.arquivosComRegistros.length > 0
    ? resultado.arquivosComRegistros
    : arquivosSelecionados.map((item) => item.fileName)
  const arquivosParaMoverSet = new Set(arquivosParaMover.map((item: any) => String(item || '').trim()).filter(Boolean))
  const arquivosSelecionadosParaMover = arquivosSelecionados.filter((item) => arquivosParaMoverSet.has(String(item?.fileName || '').trim()))

  const arquivosMovidos = await moveVoucherTxtFilesToProcessados({
    adquirente: meta.id,
    cnpj,
    fileNames: arquivosParaMover,
    files: arquivosSelecionadosParaMover.map((item) => ({
      fileName: item.fileName,
      fullPath: item.fullPath
    }))
  })

  return {
    filtro: {
      empresa,
      ec,
      cnpj,
      dataInicial,
      dataFinal,
      adquirente: meta.id
    },
    arquivosSelecionados: serializeSelectedFiles(arquivosSelecionados),
    arquivosMovidos,
    ...resultado
  }
})
