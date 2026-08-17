type VrParsedRecord =
  | ReturnType<typeof parseHeaderRecord>
  | ReturnType<typeof parseVendaRecord>
  | ReturnType<typeof parseEstornoRecord>
  | ReturnType<typeof parseAjusteRecord>
  | ReturnType<typeof parseTrailerRecord>

const PRODUCT_CODE_MAP: Record<string, string> = {
  '027': 'VR BENEFICIOS AUX',
  '028': 'VR AUTO',
  '030': 'VR CULTURA',
  '031': 'VR REFEICAO AUX',
  '034': 'CARTAO DA MAMAE',
  '050': 'BANCOVR',
  '051': 'VR COMPRAS',
  '068': 'VR REFEICAO PAT',
  '069': 'VR ALIMENTACAO PAT'
}

const CAPTURE_NETWORK_MAP: Record<string, string> = {
  '03': 'SMARTNET',
  '04': 'CIELO',
  '06': 'ELAVON',
  '07': 'REDE',
  '08': 'GETNET',
  '09': 'VERO',
  '10': 'STONE',
  '11': 'PAGSEGURO',
  '12': 'MUNDIPAGG',
  '22': 'ADYEN'
}

const ADJUSTMENT_CODE_MAP: Record<string, string> = {
  '002': 'VALOR DA ANUIDADE',
  '003': 'TARIFA BANCARIA',
  '004': 'TAXA DE ADESAO',
  '005': 'AJUSTE A CREDITO',
  '006': 'AJUSTE A DEBITO',
  '007': 'AJUSTE A CREDITO ANUIDADE',
  '008': 'AJUSTE A DEBITO ANUIDADE',
  '009': 'AJUSTE A CREDITO COMISSAO',
  '010': 'AJUSTE A DEBITO COMISSAO',
  '011': 'AJUSTE A CREDITO TARIFA BANCARIA',
  '012': 'AJUSTE A DEBITO TARIFA BANCARIA',
  '013': 'AJUSTE A CREDITO TAXA DE ADESAO',
  '014': 'AJUSTE A DEBITO TAXA DE ADESAO',
  '019': 'AJUSTE A DEBITO PACOTE DE SERVICOS',
  '020': 'PACOTE HCM'
}

const sliceField = (line: string, start: number, end: number) => {
  return String(line || '').slice(start - 1, end).trim()
}

const parseIntSafe = (value: string) => {
  const digits = String(value || '').replace(/[^\d-]/g, '')
  if (!digits) return 0
  const parsed = Number.parseInt(digits, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseMoney = (value: string) => {
  const digits = String(value || '').replace(/[^\d-]/g, '')
  if (!digits) return 0
  const parsed = Number.parseInt(digits, 10)
  if (!Number.isFinite(parsed)) return 0
  return parsed / 100
}

const parseDate = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 8) return null
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)
  return `${year}-${month}-${day}`
}

const normalizeText = (value: string) => String(value || '').trim().replace(/\s+/g, ' ')

const parseHeaderRecord = (line: string) => ({
  tipo: 'H' as const,
  versaoLayout: sliceField(line, 2, 4),
  dataGeracaoArquivo: parseDate(sliceField(line, 5, 12)),
  horaGeracaoArquivo: sliceField(line, 13, 18),
  sequenciaMovimento: sliceField(line, 19, 24),
  dataMovimento: parseDate(sliceField(line, 25, 32)),
  nomeAdministradora: normalizeText(sliceField(line, 33, 62)),
  identificacaoDestinatario: sliceField(line, 63, 68),
  tipoProcessamento: sliceField(line, 69, 69),
  numeroRegistro: sliceField(line, 70, 75),
  raw: line
})

const parseVendaRecord = (line: string) => ({
  tipo: 'V' as const,
  cnpjLoja: sliceField(line, 2, 15),
  codigoFiliacao: sliceField(line, 16, 30),
  codigoAutorizacaoVr: sliceField(line, 31, 36),
  numeroTransacao: sliceField(line, 37, 42),
  dataTransacao: parseDate(sliceField(line, 43, 50)),
  horarioTransacao: sliceField(line, 51, 56),
  tipoLancamento: sliceField(line, 57, 57),
  dataPagamento: parseDate(sliceField(line, 58, 65)),
  meioCapturaCodigo: sliceField(line, 66, 66),
  valorBruto: parseMoney(sliceField(line, 67, 77)),
  valorDesconto: parseMoney(sliceField(line, 78, 88)),
  valorLiquido: parseMoney(sliceField(line, 89, 99)),
  numeroCartao: sliceField(line, 100, 115),
  banco: sliceField(line, 116, 118),
  agencia: sliceField(line, 119, 124),
  conta: sliceField(line, 125, 135),
  codigoProduto: sliceField(line, 136, 138),
  codigoRedeCaptura: sliceField(line, 139, 140),
  identificadorUnicoTransacao: sliceField(line, 141, 152),
  numeroParcela: parseIntSafe(sliceField(line, 153, 155)),
  quantidadeParcelas: parseIntSafe(sliceField(line, 156, 158)),
  numeroRegistro: sliceField(line, 159, 164),
  raw: line
})

const parseEstornoRecord = (line: string) => ({
  tipo: 'E' as const,
  cnpjLoja: sliceField(line, 2, 15),
  codigoFiliacaoTransacaoOriginal: sliceField(line, 16, 30),
  codigoAutorizacaoOriginal: sliceField(line, 31, 36),
  numeroTransacaoOriginal: sliceField(line, 37, 42),
  dataTransacaoOriginal: parseDate(sliceField(line, 43, 50)),
  codigoAutorizacaoEstorno: sliceField(line, 51, 56),
  numeroTransacaoEstorno: sliceField(line, 57, 62),
  dataTransacaoEstorno: parseDate(sliceField(line, 63, 70)),
  horarioTransacaoEstorno: sliceField(line, 71, 76),
  dataPagamento: parseDate(sliceField(line, 77, 84)),
  meioCapturaCodigo: sliceField(line, 85, 85),
  valorBruto: parseMoney(sliceField(line, 86, 96)),
  valorDesconto: parseMoney(sliceField(line, 97, 107)),
  valorLiquido: parseMoney(sliceField(line, 108, 118)),
  numeroCartao: sliceField(line, 119, 134),
  banco: sliceField(line, 135, 137),
  agencia: sliceField(line, 138, 143),
  conta: sliceField(line, 144, 154),
  codigoProduto: sliceField(line, 155, 157),
  codigoRedeCaptura: sliceField(line, 158, 159),
  identificadorUnicoOriginal: sliceField(line, 160, 171),
  identificadorUnicoEstorno: sliceField(line, 172, 183),
  numeroParcela: parseIntSafe(sliceField(line, 184, 186)),
  quantidadeParcelas: parseIntSafe(sliceField(line, 187, 189)),
  numeroRegistro: sliceField(line, 190, 195),
  raw: line
})

const parseAjusteRecord = (line: string) => ({
  tipo: 'A' as const,
  cnpjLoja: sliceField(line, 2, 15),
  dataAjuste: parseDate(sliceField(line, 16, 23)),
  dataPagamento: parseDate(sliceField(line, 24, 31)),
  tipoAjuste: sliceField(line, 32, 32),
  codigoAjuste: sliceField(line, 33, 35),
  descricaoAjuste: normalizeText(sliceField(line, 36, 65)),
  valorBruto: parseMoney(sliceField(line, 66, 76)),
  valorDesconto: parseMoney(sliceField(line, 77, 87)),
  valorLiquido: parseMoney(sliceField(line, 88, 98)),
  banco: sliceField(line, 99, 101),
  agencia: sliceField(line, 102, 107),
  conta: sliceField(line, 108, 118),
  codigoProduto: sliceField(line, 119, 121),
  identificadorTransacaoAjuste: sliceField(line, 122, 133),
  numeroRegistro: sliceField(line, 134, 139),
  raw: line
})

const parseTrailerRecord = (line: string) => ({
  tipo: 'T' as const,
  totalGeralRegistros: parseIntSafe(sliceField(line, 2, 7)),
  numeroRegistro: sliceField(line, 8, 13),
  raw: line
})

const parseLine = (line: string): VrParsedRecord | null => {
  const type = sliceField(line, 1, 1)
  if (!type) return null
  if (type === 'H') return parseHeaderRecord(line)
  if (type === 'V') return parseVendaRecord(line)
  if (type === 'E') return parseEstornoRecord(line)
  if (type === 'A') return parseAjusteRecord(line)
  if (type === 'T') return parseTrailerRecord(line)
  return null
}

const getProdutoDescricao = (codigoProduto: string) => PRODUCT_CODE_MAP[String(codigoProduto || '').trim()] || `PRODUTO ${String(codigoProduto || '').trim() || 'NAO INFORMADO'}`
const getRedeCapturaDescricao = (codigoRede: string) => CAPTURE_NETWORK_MAP[String(codigoRede || '').trim()] || `REDE ${String(codigoRede || '').trim() || 'NAO INFORMADA'}`
const getAjusteDescricao = (codigo: string, descricao: string) => normalizeText(descricao) || ADJUSTMENT_CODE_MAP[String(codigo || '').trim()] || `AJUSTE ${String(codigo || '').trim() || 'NAO INFORMADO'}`

const buildCommonSourceFields = ({
  fileName,
  empresa,
  ec
}: {
  fileName: string
  empresa: string
  ec: string
}) => ({
  adquirente: 'VR',
  empresa: String(empresa || '').trim(),
  ec: String(ec || '').trim(),
  matriz: String(ec || '').trim(),
  arquivo_origem: String(fileName || '').trim()
})

const mapVendaRecordToVenda = ({
  record,
  fileName,
  empresa,
  ec
}: {
  record: ReturnType<typeof parseVendaRecord>
  fileName: string
  empresa: string
  ec: string
}) => {
  const produtoDescricao = getProdutoDescricao(record.codigoProduto)
  return {
    ...buildCommonSourceFields({ fileName, empresa, ec }),
    nsu: record.identificadorUnicoTransacao || record.numeroTransacao || record.codigoAutorizacaoVr,
    data_venda: record.dataTransacao,
    data_venda_text: record.dataTransacao,
    previsao_pgto: record.dataPagamento,
    previsao_pgto_text: record.dataPagamento,
    modalidade: produtoDescricao,
    bandeira: produtoDescricao,
    valor_bruto: record.valorBruto,
    despesa: Math.abs(record.valorDesconto || 0),
    despesa_mdr: Math.abs(record.valorDesconto || 0),
    valor_liquido: record.valorLiquido,
    numero_parcelas: record.quantidadeParcelas || 1,
    parcela_atual: record.numeroParcela || 1,
    tipo_lancamento: record.tipoLancamento,
    codigo_filiacao: record.codigoFiliacao,
    codigo_autorizacao_vr: record.codigoAutorizacaoVr,
    rede_captura: getRedeCapturaDescricao(record.codigoRedeCaptura),
    cnpj_loja: record.cnpjLoja,
    banco: record.banco,
    agencia: record.agencia,
    conta: record.conta
  }
}

const mapVendaRecordToRecebimento = ({
  record,
  fileName,
  empresa,
  ec
}: {
  record: ReturnType<typeof parseVendaRecord>
  fileName: string
  empresa: string
  ec: string
}) => {
  const produtoDescricao = getProdutoDescricao(record.codigoProduto)
  return {
    ...buildCommonSourceFields({ fileName, empresa, ec }),
    nsu: record.identificadorUnicoTransacao || record.numeroTransacao || record.codigoAutorizacaoVr,
    data_venda: record.dataTransacao,
    data_recebimento: record.dataPagamento,
    data_pgto: record.dataPagamento,
    modalidade: produtoDescricao,
    bandeira: produtoDescricao,
    valor_bruto: record.valorBruto,
    despesa: Math.abs(record.valorDesconto || 0),
    despesa_mdr: Math.abs(record.valorDesconto || 0),
    valor_liquido: record.valorLiquido,
    numero_parcelas: record.quantidadeParcelas || 1,
    parcela_atual: record.numeroParcela || 1,
    tipo_lancamento: record.tipoLancamento,
    codigo_filiacao: record.codigoFiliacao,
    codigo_autorizacao_vr: record.codigoAutorizacaoVr,
    rede_captura: getRedeCapturaDescricao(record.codigoRedeCaptura),
    cnpj_loja: record.cnpjLoja,
    banco: record.banco,
    agencia: record.agencia,
    conta: record.conta
  }
}

const mapAjusteToRecebimento = ({
  record,
  fileName,
  empresa,
  ec
}: {
  record: ReturnType<typeof parseAjusteRecord>
  fileName: string
  empresa: string
  ec: string
}) => {
  const isCredito = String(record.tipoAjuste || '') === '1'
  const sinal = isCredito ? 1 : -1
  const descricao = getAjusteDescricao(record.codigoAjuste, record.descricaoAjuste)
  const valorBrutoAssinado = (record.valorBruto || 0) * sinal
  const valorLiquidoAssinado = (record.valorLiquido || 0) * sinal

  return {
    ...buildCommonSourceFields({ fileName, empresa, ec }),
    nsu: record.identificadorTransacaoAjuste || `AJUSTE_${record.codigoAjuste}_${record.numeroRegistro}`,
    data_venda: record.dataAjuste,
    data_recebimento: record.dataPagamento,
    data_pgto: record.dataPagamento,
    modalidade: isCredito ? 'AJUSTE CREDITO VR' : 'AJUSTE DEBITO VR',
    bandeira: descricao,
    descricao_ajuste: descricao,
    codigo_ajuste: record.codigoAjuste,
    valor_bruto: valorBrutoAssinado,
    despesa: Math.abs(record.valorDesconto || 0),
    despesa_mdr: Math.abs(record.valorDesconto || 0),
    despesa_extra: !isCredito ? Math.abs(valorLiquidoAssinado) : 0,
    valor_liquido: valorLiquidoAssinado,
    tipo_ajuste: record.tipoAjuste,
    banco: record.banco,
    agencia: record.agencia,
    conta: record.conta,
    cnpj_loja: record.cnpjLoja
  }
}

const summarizeCounts = (records: VrParsedRecord[]) => {
  return records.reduce((acc: Record<string, number>, record) => {
    const key = String(record?.tipo || 'desconhecido')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

export const parseVrLayout16ap = ({
  fileName,
  content
}: {
  fileName: string
  content: string
}) => {
  const lines = String(content || '')
    .split(/\r?\n/)
    .map(line => line.replace(/\r/g, ''))
    .filter(line => String(line || '').trim().length > 0)

  const records = lines
    .map(parseLine)
    .filter(Boolean) as VrParsedRecord[]

  const header = records.find(record => record.tipo === 'H') as ReturnType<typeof parseHeaderRecord> | undefined
  const trailer = records.find(record => record.tipo === 'T') as ReturnType<typeof parseTrailerRecord> | undefined

  return {
    fileName,
    totalLines: lines.length,
    records,
    header: header || null,
    trailer: trailer || null,
    counts: summarizeCounts(records),
    onlyHeaderAndTrailer: records.every(record => record.tipo === 'H' || record.tipo === 'T')
  }
}

export const buildVrVendasFromParsedFiles = ({
  files,
  empresa,
  ec
}: {
  files: Array<{ fileName: string, content: string }>
  empresa: string
  ec: string
}) => {
  const parsedFiles = files.map(file => parseVrLayout16ap(file))
  const vendas = parsedFiles.flatMap((parsedFile) => {
    return parsedFile.records
      .filter((record): record is ReturnType<typeof parseVendaRecord> => record.tipo === 'V')
      .filter(record => record.tipoLancamento === 'P')
      .map(record => mapVendaRecordToVenda({
        record,
        fileName: parsedFile.fileName,
        empresa,
        ec
      }))
  })

  return {
    arquivos: parsedFiles.map(file => ({
      fileName: file.fileName,
      totalLines: file.totalLines,
      counts: file.counts,
      onlyHeaderAndTrailer: file.onlyHeaderAndTrailer
    })),
    registros: vendas,
    resumo: {
      totalArquivos: parsedFiles.length,
      totalRegistros: vendas.length,
      totalBruto: vendas.reduce((sum, item) => sum + Number(item.valor_bruto || 0), 0),
      totalLiquido: vendas.reduce((sum, item) => sum + Number(item.valor_liquido || 0), 0),
      totalDespesa: vendas.reduce((sum, item) => sum + Number(item.despesa_mdr || item.despesa || 0), 0)
    }
  }
}

export const buildVrRecebimentosFromParsedFiles = ({
  files,
  empresa,
  ec
}: {
  files: Array<{ fileName: string, content: string }>
  empresa: string
  ec: string
}) => {
  const parsedFiles = files.map(file => parseVrLayout16ap(file))
  const recebimentos = parsedFiles.flatMap((parsedFile) => {
    const registrosVenda = parsedFile.records
      .filter((record): record is ReturnType<typeof parseVendaRecord> => record.tipo === 'V')
      .filter(record => ['L', 'A'].includes(record.tipoLancamento))
      .map(record => mapVendaRecordToRecebimento({
        record,
        fileName: parsedFile.fileName,
        empresa,
        ec
      }))

    const registrosAjuste = parsedFile.records
      .filter((record): record is ReturnType<typeof parseAjusteRecord> => record.tipo === 'A')
      .map(record => mapAjusteToRecebimento({
        record,
        fileName: parsedFile.fileName,
        empresa,
        ec
      }))

    return [...registrosVenda, ...registrosAjuste]
  })

  return {
    arquivos: parsedFiles.map(file => ({
      fileName: file.fileName,
      totalLines: file.totalLines,
      counts: file.counts,
      onlyHeaderAndTrailer: file.onlyHeaderAndTrailer
    })),
    registros: recebimentos,
    resumo: {
      totalArquivos: parsedFiles.length,
      totalRegistros: recebimentos.length,
      totalBruto: recebimentos.reduce((sum, item) => sum + Number(item.valor_bruto || 0), 0),
      totalLiquido: recebimentos.reduce((sum, item) => sum + Number(item.valor_liquido || 0), 0),
      totalDespesa: recebimentos.reduce((sum, item) => sum + Number(item.despesa_mdr || item.despesa || 0), 0)
    }
  }
}
