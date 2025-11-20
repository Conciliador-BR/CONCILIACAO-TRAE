import { useEmpresas } from '../../useEmpresas'

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30))

function excelSerialToISO(n) {
  if (typeof n !== 'number' || !isFinite(n)) return null
  const ms = Math.round(n) * 86400000
  const d = new Date(EXCEL_EPOCH.getTime() + ms)
  const yyyy = String(d.getUTCFullYear()).padStart(4, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const useRecebimentosOperadoraGetnet = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

  async function getXLSX() {
    const mod = await import('xlsx')
    return mod
  }

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'getnet') {
        throw new Error(`Operadora '${operadora}' não suportada por este processador.`)
      }
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }
      const resultado = processarDados(dados, nomeEmpresa)
      return { sucesso: true, registros: resultado.dados, total: resultado.total, erros: resultado.erros }
    } catch (error) {
      return { sucesso: false, erro: error.message, registros: [], total: 0, erros: [error.message] }
    }
  }

  const processarDados = (dados, nomeEmpresa) => {
    const erros = []
    const out = []
    if (!Array.isArray(dados) || dados.length === 0) {
      return { dados: [], total: 0, erros: ['Arquivo vazio.'] }
    }
    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(dados)
    if (!headersNorm || headersNorm.length === 0) {
      return { dados: [], total: 0, erros: ['Cabeçalhos não encontrados.'] }
    }
    const ALIASES = {
      data_venda: ['DATA DA VENDA','DATA VENDA','DATA'],
      data_recebimento: ['DATA DE VENCIMENTO','DATA VENCIMENTO','DATA RECEBIMENTO'],
      modalidade: ['FORMA DE PAGAMENTO','MODALIDADE','BANDEIRA / MODALIDADE'],
      lancamento: ['LANÇAMENTO','LANCAMENTO'],
      tipo_lancamento: ['TIPO DE LANÇAMENTO','TIPO LANCAMENTO','LANÇAMENTO'],
      nsu: ['NSU','NÚMERO COMPROVANTE DE VENDA (NSU)','NUMERO COMPROVANTE DE VENDA (NSU)'],
      valor_bruto: ['VALOR DA PARCELA','VALOR PARCELA','VALOR BRUTO'],
      valor_liquido: ['VALOR LIQUIDO DA PARCELA','VALOR LÍQUIDO DA PARCELA','VALOR LIQUIDO','VALOR LÍQUIDO'],
      despesa_mdr: ['DESCONTOS','DESCONTO','MDR'],
      numero_parcelas: ['PARCELAS','QUANTIDADE PARCELAS','Nº PARCELAS'],
      bandeira: ['BANDEIRA','ARRANJO']
    }
    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })
    const chavesMin = ['valor_bruto','valor_liquido','nsu']
    const temAlgumaChave = chavesMin.some(k => Object.values(colIndexParaCampo).includes(k))
    if (!temAlgumaChave) {
      return { dados: [], total: 0, erros: ['Nenhuma coluna essencial foi mapeada a partir dos cabeçalhos.'] }
    }
    for (let i = headerRowIdx + 1; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue
      try {
        const r = {
          data_venda: null,
          data_recebimento: null,
          modalidade: '',
          tipo_lancamento: '',
          nsu: '',
          valor_bruto: 0.0,
          valor_liquido: 0.0,
          taxa_mdr: 0.0,
          despesa_mdr: 0.0,
          numero_parcelas: 0,
          bandeira: '',
          valor_antecipacao: 0.0,
          despesa_antecipacao: 0.0,
          valor_liquido_antecipacao: 0.0,
          empresa: nomeEmpresa || '',
          matriz: nomeEmpresa ? getValorMatrizPorEmpresa(nomeEmpresa) : '',
          adquirente: 'GETNET'
        }
        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_venda': r.data_venda = formatarData(valor); break
            case 'data_recebimento': r.data_recebimento = formatarData(valor); break
            case 'valor_bruto':
            case 'valor_liquido':
            case 'despesa_mdr': r[campoDb] = formatarValor(valor); break
            case 'numero_parcelas': r.numero_parcelas = formatarInteiro(valor); break
            case 'modalidade': r.modalidade = valor != null ? String(valor).trim().toUpperCase() : ''; break
            case 'lancamento': r.lancamento = valor != null ? String(valor).trim().toUpperCase() : ''; break
            case 'bandeira': r.bandeira = valor != null ? String(valor).trim().toUpperCase() : ''; break
            case 'tipo_lancamento': r.tipo_lancamento = valor != null ? String(valor).trim().toUpperCase() : ''; break
            case 'nsu': r.nsu = valor != null ? String(valor).trim() : ''; break
            default: break
          }
        }
        // Modalidade deve refletir a coluna "LANÇAMENTO" por padrão
        r.modalidade = r.lancamento || r.modalidade
        if (!r.bandeira && r.modalidade) {
          r.bandeira = r.modalidade
        }
        // Renomear modalidade conforme regras
        const modNorm = normalizar(r.modalidade).toLowerCase()
        const lancNorm = normalizar(r.lancamento).toLowerCase()
        const banNorm = normalizar(r.bandeira).toLowerCase()
        if (lancNorm.includes('compra cartao pre-pago') || lancNorm.includes('compra cartao prepago') || lancNorm.includes('compra cartao pre pago')) {
          if (banNorm.includes('debito')) r.modalidade = 'DEBITO PRÉ-PAGO'
          else if (banNorm.includes('credito')) r.modalidade = 'CREDITO PRÉ-PAGO'
        }
        if (modNorm.includes('debito a vista')) r.modalidade = 'DEBITO'
        else if (modNorm.includes('credito a vista')) r.modalidade = 'CREDITO'
        else if (modNorm.includes('credito parcelado loja')) r.modalidade = 'PARCELADO'
        else if (modNorm.includes('venda') && modNorm.includes('credito') && (modNorm.includes('pre-pago') || modNorm.includes('prepago'))) r.modalidade = 'CREDITO PRÉ-PAGO'
        else if (modNorm.includes('venda') && modNorm.includes('debito') && (modNorm.includes('pre-pago') || modNorm.includes('prepago'))) r.modalidade = 'DEBITO PRÉ-PAGO'
        else if (modNorm.includes('venda') && modNorm.includes('parcelado') && (modNorm.includes('loja') || modNorm.includes('emissor'))) r.modalidade = 'PARCELADO'

        // Filtro por tipo de lançamento
        const tipoNorm = normalizar(r.tipo_lancamento).toLowerCase()
        const isVenda = tipoNorm.includes('vendas') || tipoNorm.includes('venda')
        const isAluguelTarifa = tipoNorm.includes('aluguel') || tipoNorm.includes('tarifa')
        if (!isVenda && !isAluguelTarifa) {
          continue
        }
      
        if (isAluguelTarifa) {
          r.modalidade = r.tipo_lancamento || 'ALUGUEL/TARIFA'
        }

        // Calcular taxa_mdr média
        r.despesa_mdr = Math.abs(r.despesa_mdr || 0)
        if (!r.despesa_mdr && r.valor_bruto && r.valor_liquido) {
          r.despesa_mdr = Math.abs((r.valor_bruto || 0) - (r.valor_liquido || 0))
        }
        r.taxa_mdr = (r.valor_bruto && r.valor_bruto !== 0) ? (r.despesa_mdr / r.valor_bruto) : 0

        const valido = ((r.valor_bruto !== 0) || (r.valor_liquido !== 0))
        if (valido) out.push(r)
      } catch (e) { erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`) }
    }
    return { dados: out, total: out.length, erros }
  }

  const lerArquivo = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await getXLSX()
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheets = workbook.SheetNames
        const alvo = sheets.find(name => normalizar(name).includes('DETALHADO')) || sheets[0]
        const worksheet = workbook.Sheets[alvo]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })
        resolve(jsonData)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

  const normalizar = (s) => {
    if (s == null) return ''
    return s.toString().normalize('NFD').replace(/\u00A0/g,' ').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
  }

  const formatarData = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    if (typeof valor === 'number') return excelSerialToISO(valor)
    const s = String(valor).trim()
    const first = s.split(/[T\s]+/)[0]
    let m = first.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
    if (m) { const [, dd, mm, yyyy] = m; return `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}` }
    m = first.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/)
    if (m) { const [, yyyy, mm, dd] = m; return `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}` }
    const d = new Date(first)
    if (!isNaN(d.getTime())) { const yyyy = String(d.getFullYear()).padStart(4, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0'); return `${yyyy}-${mm}-${dd}` }
    return null
  }

  const formatarValor = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.0
    try {
      if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0.0
      const limpo = String(valor).replace(/\u00A0/g, ' ').replace(/\s/g, '').replace(/R\$/gi, '').replace(/%/g, '').replace(/\./g, '').replace(',', '.')
      const n = parseFloat(limpo)
      return Number.isFinite(n) ? n : 0.0
    } catch { return 0.0 }
  }

  const formatarPercentual = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.0
    try {
      if (typeof valor === 'number') return valor > 1 ? valor / 100 : valor
      const s = String(valor).trim().toLowerCase().replace('%','').replace(',','.')
      const n = parseFloat(s)
      if (!Number.isFinite(n)) return 0.0
      return n > 1 ? n / 100 : n
    } catch { return 0.0 }
  }

  const formatarInteiro = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0
    try {
      if (typeof valor === 'number') return Math.trunc(valor)
      const limpo = String(valor).match(/-?\d+/)?.[0] ?? '0'
      const n = parseInt(limpo, 10)
      return Number.isFinite(n) ? n : 0
    } catch { return 0 }
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas=30) => {
    const candidatos = ['DATA DA VENDA','DATA DE VENCIMENTO','FORMA DE PAGAMENTO','AUTORIZAÇÃO','VALOR DA PARCELA','VALOR LIQUIDO DA PARCELA','DESCONTOS','PARCELAS','BANDEIRA / MODALIDADE','TIPO DE LANÇAMENTO']
    let melhorIdx = -1
    let melhorScore = -1
    const limite = Math.min(maxLinhas, matriz.length)
    for (let i = 0; i < limite; i++) {
      const row = matriz[i] || []
      const norm = row.map(normalizar)
      const hits = candidatos.filter(c => norm.includes(c)).length
      if (hits > melhorScore) { melhorScore = hits; melhorIdx = i }
      if (hits >= 4) return { idx: i, headersNorm: norm }
    }
    const idx = melhorIdx !== -1 ? melhorIdx : 0
    const row = matriz[idx] || []
    return { idx, headersNorm: row.map(normalizar) }
  }

  const findIndexByAliases = (headersNorm, aliases) => {
    for (const a of aliases) { const idx = headersNorm.indexOf(a); if (idx >= 0) return idx }
    for (const a of aliases) { const idx = headersNorm.findIndex(h => h.includes(a)); if (idx >= 0) return idx }
    return -1
  }

  return { processarArquivoComPython }
}