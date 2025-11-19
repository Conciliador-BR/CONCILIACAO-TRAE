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

export const useRecebimentosOperadoraStone = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

  async function getXLSX() {
    const mod = await import('xlsx')
    return mod
  }

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'stone') {
        throw new Error(`Operadora '${operadora}' não suportada por este processador.`)
      }

      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }

      const resultado = await processarDados(dados, nomeEmpresa, operadora)
      return {
        sucesso: true,
        registros: resultado.dados,
        total: resultado.total,
        erros: resultado.erros
      }
    } catch (error) {
      return {
        sucesso: false,
        erro: error.message,
        registros: [],
        total: 0,
        erros: [error.message]
      }
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
      data_venda: ['DATA DA VENDA', 'DATA VENDA', 'DATA DO MOVIMENTO'],
      data_recebimento: ['DATA DE VENCIMENTO', 'DATA VENCIMENTO', 'DATA RECEBIMENTO'],
      modalidade: ['PRODUTO', 'MODALIDADE'],
      nsu: ['STONE ID', 'NSU'],
      valor_bruto: ['VALOR BRUTO', 'VALOR DA VENDA'],
      valor_liquido: ['VALOR LIQUIDO', 'VALOR LÍQUIDO', 'VALOR A RECEBER', 'VALOR RECEBIDO'],
      despesa_mdr: ['DESCONTO DE MDR', 'VALOR DO DESCONTO', 'DESPESA MDR'],
      numero_parcelas: ['N DE PARCELAS', 'NUMERO PARCELAS', 'PARCELAS'],
      bandeira: ['BANDEIRA', 'BANDEIRAS'],
      despesa_antecipacao: ['DESCONTO DE ANTECIPACAO', 'DESCONTO DE ANTECIPAÇÃO']
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
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) {
        continue
      }

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
          empresa: '',
          matriz: '',
          adquirente: 'STONE'
        }

        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_venda': r.data_venda = formatarData(valor); break
            case 'data_recebimento': r.data_recebimento = formatarData(valor); break
            case 'valor_bruto':
            case 'valor_liquido':
            case 'despesa_mdr':
            case 'despesa_antecipacao':
              r[campoDb] = formatarValor(valor); break
            case 'numero_parcelas':
              r.numero_parcelas = formatarInteiro(valor); break
            case 'modalidade':
            case 'bandeira':
              r[campoDb] = valor != null ? String(valor).trim() : ''; break
            case 'nsu':
              r.nsu = valor != null ? String(valor).trim() : ''; break
            default: break
          }
        }

        // Valor Antecipação deve ficar em branco (0)
        r.valor_antecipacao = 0.0
        // Valor Líquido Antecipação = valor bruto - desconto de antecipação
        const da = r.despesa_antecipacao || 0
        const vb = r.valor_bruto || 0
        r.valor_liquido_antecipacao = vb - da

        // Taxa MDR como média: despesa_mdr / valor_bruto (fração)
        const dm = Math.abs(r.despesa_mdr || 0)
        r.despesa_mdr = dm
        r.taxa_mdr = vb && vb !== 0 ? (dm / vb) : 0

        if (nomeEmpresa) {
          r.empresa = nomeEmpresa
          r.matriz = getValorMatrizPorEmpresa(nomeEmpresa)
        }

        const valido = (r.valor_bruto !== 0) || (r.valor_liquido !== 0)
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
    return s
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
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
    if (firstChunk && /^\d{4}-\d{2}-\d{2}$/.test(firstChunk)) {
      return firstChunk
    }

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
      const limpo = String(valor)
        .replace(/\u00A0/g, ' ')
        .replace(/\s/g, '')
        .replace(/R\$/gi, '')
        .replace(/%/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
      const n = parseFloat(limpo)
      return Number.isFinite(n) ? n : 0.0
    } catch {
      return 0.0
    }
  }

  const formatarInteiro = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0
    try {
      if (typeof valor === 'number') return Math.trunc(valor)
      const limpo = String(valor).match(/-?\d+/)?.[0] ?? '0'
      const n = parseInt(limpo, 10)
      return Number.isFinite(n) ? n : 0
    } catch {
      return 0
    }
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas=15) => {
    const candidatos = ['DATA DA VENDA','DATA DE VENCIMENTO','PRODUTO','STONE ID','VALOR BRUTO','VALOR LIQUIDO','DESCONTO DE MDR','BANDEIRA']
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
    for (const a of aliases) {
      const idx = headersNorm.indexOf(a)
      if (idx >= 0) return idx
    }
    for (const a of aliases) {
      const idx = headersNorm.findIndex(h => h.includes(a))
      if (idx >= 0) return idx
    }
    return -1
  }

  return { processarArquivoComPython }
}