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

export const useRecebimentosOperadoraSafra = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

  async function getXLSX() {
    const mod = await import('xlsx')
    return mod
  }

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'safra') {
        throw new Error(`Operadora '${operadora}' não suportada por este processador.`)
      }
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }
      const resultado = await processarDados(dados, nomeEmpresa, operadora)
      return { sucesso: true, registros: resultado.dados, total: resultado.total, erros: resultado.erros }
    } catch (error) {
      return { sucesso: false, erro: error.message, registros: [], total: 0, erros: [error.message] }
    }
  }

  const processarDados = async (dados, nomeEmpresa, operadora) => {
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
      data_recebimento: ['DATA DO PAGAMENTO','DATA PAGAMENTO','DATA RECEBIMENTO','DATA DE PAGAMENTO'],
      modalidade: ['PRODUTO','MODALIDADE','FORMA DE PAGAMENTO'],
      nsu: ['NUMERO SEQUENCIAL UNICO','NÚMERO SEQUENCIAL ÚNICO','NSU','N S U'],
      valor_bruto: ['VALOR BRUTO DA VENDA','VALOR BRUTO','VALOR DA VENDA'],
      valor_liquido: ['VALOR LIQUIDO DA VENDA','VALOR LÍQUIDO DA VENDA','VALOR LIQUIDO','VALOR LÍQUIDO'],
      parcelas: ['PARCELAS','N DE PARCELAS','NUMERO PARCELAS','NÚMERO PARCELAS'],
      bandeira: ['BANDEIRA','BANDEIRAS'],
      valor_antecipacao: ['VALOR ANTECIPACAO','VALOR ANTECIPAÇÃO','VALOR DA ANTECIPACAO','VALOR DA ANTECIPAÇÃO','VALOR ANTECIPADO'],
      despesa_antecipacao: ['DESCONTO DE ANTECIPACAO','DESCONTO DE ANTECIPAÇÃO','DESPESA COM ANTECIPACAO','DESPESA COM ANTECIPAÇÃO','DESPESA ANTECIPACAO','DESPESA ANTECIPAÇÃO'],
      valor_liquido_antecipacao: ['VALOR LIQUIDO ANTECIPACAO','VALOR LÍQUIDO ANTECIPAÇÃO','VALOR LIQUIDO RECEBIDO ANTECIPACAO','VALOR LÍQUIDO RECEBIDO ANTECIPAÇÃO']
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
    const inicio = headerRowIdx + 1
    for (let i = inicio; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue
      try {
        const r = {
          data_venda: '0001-01-01',
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
          empresa: '',
          matriz: '',
          adquirente: 'SAFRA'
        }
        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_recebimento': r.data_recebimento = formatarData(valor); break
            case 'valor_bruto':
            case 'valor_liquido':
              r[campoDb] = formatarValor(valor); break
            case 'valor_antecipacao':
              r.valor_antecipacao = formatarValor(valor); break
            case 'despesa_antecipacao': {
              const v = formatarValor(valor)
              r.despesa_antecipacao = Math.abs(v)
              break
            }
            case 'valor_liquido_antecipacao':
              r.valor_liquido_antecipacao = formatarValor(valor); break
            case 'parcelas':
              r.numero_parcelas = formatarInteiro(valor); break
            case 'modalidade':
            case 'bandeira':
              r[campoDb] = valor != null ? String(valor).trim() : ''; break
            case 'nsu':
              r.nsu = valor != null ? String(valor).trim() : ''; break
            default: break
          }
        }
        // Normalizar modalidade para PARCELADO quando crédito com 2 a 6 parcelas
        const modRaw = (r.modalidade || '').toString()
        const modNorm = normalizar(modRaw).toLowerCase()
        const np = parseInt(r.numero_parcelas) || 0
        if (
          modNorm.includes('creditode2a6parcelas') ||
          (modNorm.includes('credito') && modNorm.includes('parcelas')) ||
          (np >= 2 && np <= 6)
        ) {
          r.modalidade = 'PARCELADO'
        }
        const vb = r.valor_bruto || 0
        const vl = r.valor_liquido || 0
        const dm = Math.abs(vb - vl)
        r.despesa_mdr = dm
        r.taxa_mdr = vb && vb !== 0 ? (dm / vb) : 0
        r.valor_antecipacao = r.valor_antecipacao || 0.0
        r.despesa_antecipacao = Math.abs(r.despesa_antecipacao || 0.0)
        r.valor_liquido_antecipacao = r.valor_liquido_antecipacao || 0.0
        if (nomeEmpresa) {
          r.empresa = nomeEmpresa
          r.matriz = getValorMatrizPorEmpresa(nomeEmpresa)
        }
        const valido = (vb !== 0) || (vl !== 0)
        if (valido) out.push(r)
      } catch (e) {
        erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`)
      }
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
    return s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
  }

  const formatarData = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    if (typeof valor === 'number') return excelSerialToISO(valor)
    const s = String(valor).trim()
    const firstChunk = s.split(/[T\s]+/)[0]
    if (firstChunk && /^\d{2}\/\d{2}\/\d{4}$/.test(firstChunk)) {
      const [dia, mes, ano] = firstChunk.split('/')
      return `${ano}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`
    }
    if (firstChunk && /^\d{4}-\d{2}-\d{2}$/.test(firstChunk)) return firstChunk
    const ddmmyyyyH = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
    const yyyymmddH = /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    if (ddmmyyyyH.test(s)) {
      const [, d, m, y] = s.match(ddmmyyyyH)
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
    if (ddmmyyyy.test(s)) {
      const [, d, m, y] = s.match(ddmmyyyy)
      return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
    }
    if (yyyymmddH.test(s)) {
      const [, y, m, d] = s.match(yyyymmddH)
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
    if (yyyymmdd.test(s)) return s
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const yyyy = String(d.getFullYear()).padStart(4, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
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

  const formatarInteiro = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0
    try {
      if (typeof valor === 'number') return Math.trunc(valor)
      const limpo = String(valor).match(/-?\d+/)?.[0] ?? '0'
      const n = parseInt(limpo, 10)
      return Number.isFinite(n) ? n : 0
    } catch { return 0 }
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas=20) => {
    const candidatos = ['DATA DO PAGAMENTO','PRODUTO','NUMERO SEQUENCIAL UNICO','VALOR BRUTO DA VENDA','VALOR LIQUIDO DA VENDA','PARCELAS','BANDEIRA']
    for (let i = 0; i < Math.min(maxLinhas, matriz.length); i++) {
      const row = matriz[i] || []
      const norm = row.map(normalizar)
      const hits = candidatos.filter(c => norm.includes(c)).length
      if (hits >= 3) return { idx: i, headersNorm: norm }
    }
    const i = 0
    const row = matriz[i] || []
    return { idx: i, headersNorm: row.map(normalizar) }
  }

  const findIndexByAliases = (headersNorm, aliases) => {
    for (const a of aliases) { const idx = headersNorm.indexOf(a); if (idx >= 0) return idx }
    for (const a of aliases) { const idx = headersNorm.findIndex(h => h.includes(a)); if (idx >= 0) return idx }
    return -1
  }

  return { processarArquivoComPython }
}
