/**
 * Dados do cabecalho de um arquivo EDI de conciliacao.
 *
 * Datas seguem o formato AAAAMMDD e horarios seguem HHMMSS, conforme padroes
 * usados em layouts Software Express e derivados.
 */
export interface EdiHeader {
  versaoLayout: string
  dataGeracao: string
  horaGeracao: string
  nomeAdministradora: string
  idRemetente?: string
  idDestinatario?: string
}

/**
 * Registro CV - comprovante de venda.
 *
 * Representa uma transacao capturada no arquivo EDI, incluindo os dados da
 * parcela quando o layout detalhar parcelamento.
 */
export interface EdiTransaction {
  cnpjLoja: string
  nsuHost: string
  dataTransacao: string
  horaTransacao: string
  dataPagamento: string
  tipoLancamento: number
  tipoProduto: string
  meioCaptura: string
  valorBruto: number
  valorDesconto: number
  valorOutrosDescontos?: number
  valorLiquido: number
  cartaoMascarado: string
  parcela: number
  totalParcelas: number
  nsuHostParcela?: string
  valorBrutoParcela?: number
  valorDescontoParcela?: number
  valorOutrosDescontosParcela?: number
  valorLiquidoParcela?: number
  banco?: string
  agencia?: string
  contaCorrente?: string
  autorizacao: string
  codigoBandeira?: string
  codigoProduto?: string
  idLoteAntecipado?: string
}

/**
 * Registro AJ - ajustes financeiros vinculados a uma venda original.
 */
export interface EdiAdjustment {
  cnpjLoja: string
  nsuHostOriginal: string
  dataTransacaoOriginal: string
  nsuAjuste: string
  dataAjuste: string
  tipoAjuste: 'CREDITO' | 'DEBITO'
  codigoAjuste: string
  descricaoMotivo: string
  valorBruto: number
  valorDesconto: number
  valorLiquido: number
}

/**
 * Resultado padronizado de parse de um arquivo EDI.
 */
export interface ParsedEdiResult {
  header: EdiHeader | null
  transacoes: EdiTransaction[]
  ajustes: EdiAdjustment[]
  totalRegistros: number
  totalValorCredito: number
  totalValorDebito: number
}

/**
 * Contrato base para qualquer parser de layout EDI.
 */
export interface IEdiLayoutParser {
  layoutId: string
  parse(fileContent: string): ParsedEdiResult
}
