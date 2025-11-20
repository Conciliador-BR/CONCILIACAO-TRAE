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

export const useRecebimentosOperadoraCielo = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

  async function getXLSX() {
    const mod = await import('xlsx')
    return mod
  }

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'cielo') {
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
      data_recebimento: ['DATA DE PAGAMENTO','DATA PAGAMENTO','DATA RECEBIMENTO'],
      modalidade: ['FORMA DE PAGAMENTO','MODALIDADE'],
      nsu: ['NSU/DOC','NSU','DOC'],
      valor_bruto: ['VALOR BRUTO'],
      valor_liquido: ['VALOR LIQUIDO','VALOR LÍQUIDO'],
      despesa_mdr: ['TAXA/TARIFA','TAXA TARIFA','TARIFA','MDR'],
      taxa_mdr: ['TAXA TOTAL (%)','TAXA TOTAL','% TAXAS'],
      numero_parcelas: ['QUANTIDADE TOTAL DE PARCELAS','TOTAL PARCELAS','PARCELAS'],
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
          adquirente: 'CIELO'
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
            case 'taxa_mdr': r.taxa_mdr = formatarPercentual(valor); break
            case 'numero_parcelas': r.numero_parcelas = formatarInteiro(valor); break
            case 'modalidade': r.modalidade = valor != null ? String(valor).trim().toUpperCase() : ''; break
            case 'bandeira': r.bandeira = valor != null ? String(valor).trim().toUpperCase() : ''; break
            case 'nsu': r.nsu = valor != null ? String(valor).trim() : ''; break
            default: break
          }
        }
        const modNorm = normalizar(r.modalidade).toLowerCase()
        if (modNorm.includes('debito a vista')) r.modalidade = 'DEBITO'
        else if (modNorm.includes('credito a vista')) r.modalidade = 'CREDITO'
        else if (modNorm.includes('credito parcelado loja')) r.modalidade = 'PARCELADO'
        r.despesa_mdr = Math.abs(r.despesa_mdr || 0)
        if (!r.taxa_mdr && (r.valor_bruto && r.valor_bruto !== 0)) r.taxa_mdr = r.despesa_mdr / r.valor_bruto
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
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
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
    const candidatos = ['DATA DA VENDA','DATA DE PAGAMENTO','FORMA DE PAGAMENTO','NSU/DOC','VALOR BRUTO','VALOR LIQUIDO','TAXA/TARIFA','TAXA TOTAL (%)','QUANTIDADE TOTAL DE PARCELAS','BANDEIRA']
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