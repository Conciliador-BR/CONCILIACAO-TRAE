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

export const buildUpbrasilVendasFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiVendasFromParsedFiles({
    files,
    empresa,
    ec,
    adquirente: 'upbrasil',
    adquirenteLabel: 'UP BRASIL'
  })
}

export const buildUpbrasilRecebimentosFromParsedFiles = async ({
  files,
  empresa,
  ec
}: BuildInput) => {
  return buildEdiRecebimentosFromParsedFiles({
    files,
    empresa,
    ec,
    adquirente: 'upbrasil',
    adquirenteLabel: 'UP BRASIL'
  })
}
