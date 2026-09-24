import {
  buildEdiRecebimentosFromParsedFiles,
  buildEdiVendasFromParsedFiles,
  type ParsedEdiSourceFile
} from './ediImportBuilders'

type BuildInput = {
  files: ParsedEdiSourceFile[]
  empresa: string
  ec: string
}

type ComprocardFileType = 'vendas' | 'recebimentos' | 'desconhecido'

const classifyComprocardFile = (content: string): ComprocardFileType => {
  let hasSalesRecords = false
  let hasAdjustmentRecords = false

  for (const rawLine of String(content || '').split(/\r?\n/)) {
    const recordType = rawLine.replace(/^\uFEFF/, '').slice(0, 2)

    if (recordType === 'CV') hasSalesRecords = true
    if (recordType === 'AJ') hasAdjustmentRecords = true
  }

  if (hasAdjustmentRecords) return 'recebimentos'
  if (hasSalesRecords) return 'vendas'
  return 'desconhecido'
}

const filterFilesByType = (
  files: ParsedEdiSourceFile[],
  expectedType: Exclude<ComprocardFileType, 'desconhecido'>
) => {
  return (files || []).filter((file) => classifyComprocardFile(file.content) === expectedType)
}

export const buildComprocardVendasFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiVendasFromParsedFiles({
    files: filterFilesByType(files, 'vendas'),
    empresa,
    ec,
    adquirente: 'comprocard',
    adquirenteLabel: 'COMPROCARD'
  })
}

export const buildComprocardRecebimentosFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiRecebimentosFromParsedFiles({
    files: filterFilesByType(files, 'recebimentos'),
    empresa,
    ec,
    adquirente: 'comprocard',
    adquirenteLabel: 'COMPROCARD'
  })
}
