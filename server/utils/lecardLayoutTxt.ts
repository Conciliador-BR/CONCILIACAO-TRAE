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

export const buildLecardVendasFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiVendasFromParsedFiles({
    files,
    empresa,
    ec,
    adquirente: 'lecard',
    adquirenteLabel: 'LECARD'
  })
}

export const buildLecardRecebimentosFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiRecebimentosFromParsedFiles({
    files,
    empresa,
    ec,
    adquirente: 'lecard',
    adquirenteLabel: 'LECARD'
  })
}
