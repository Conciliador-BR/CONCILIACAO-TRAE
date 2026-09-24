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

export const buildComprocardVendasFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiVendasFromParsedFiles({
    files,
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
    files,
    empresa,
    ec,
    adquirente: 'comprocard',
    adquirenteLabel: 'COMPROCARD'
  })
}
