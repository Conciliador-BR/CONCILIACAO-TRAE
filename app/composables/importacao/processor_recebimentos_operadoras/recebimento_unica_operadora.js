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

export const useRecebimentosOperadoraUnica = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

  async function getXLSX() {
    const mod = await import('xlsx')
    return mod
  }

  // DEBUG
  const DEBUG = true
  const dbg = (...args) => { if (DEBUG) console.log('🟦 [RECEBIMENTOS:UNICA]', ...args) }

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'unica') {
        throw new Error(`Operadora '${operadora}' não suportada por este processador.`)
      }

      // Garantir empresas carregadas
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

    // MAPEAMENTO EXATO (linha 9 do relatório Única)
    const ALIASES = {
      data_venda: ['DATA VENDA'],
      data_recebimento: ['DATA RECEBIMENTO'],
      modalidade: ['MODALIDADE'],
      nsu: ['NSU', 'N S U'],
      valor_bruto: ['VALOR VENDA'],
      valor_liquido: ['VALOR LÍQUIDO', 'VALOR LIQUIDO'],
      taxa_mdr: ['% MDR', 'TAXA MDR', 'TAXA'],
      despesa_mdr: ['VALOR MDR', 'VALOR DA TAXA', 'DESCONTO', 'DESPESA MDR'],
      numero_parcelas: ['PARCELA', 'NUMERO PARCELAS', 'NÚMERO PARCELAS'],
      bandeira: ['BANDEIRA', 'BANDEIRAS'],
      valor_antecipacao: ['VALOR ANTECIPADO'],
      valor_liquido_antecipacao: ['VALOR PAGO'] // “Venda Paga”
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

    const CHUNK_SIZE = 1000
    const inicio = headerRowIdx + 1
    for (let s = inicio, chunkIdx = 0; s < dados.length; s += CHUNK_SIZE, chunkIdx++) {
      const e = Math.min(s + CHUNK_SIZE, dados.length)
      for (let i = s; i < e; i++) {
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
            valor_liquido_antecipacao: null
          }

          for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
            const idx = Number(idxStr)
            const valor = linha[idx]

            switch (campoDb) {
              case 'data_venda': r.data_venda = formatarData(valor); break
              case 'data_recebimento': r.data_recebimento = formatarData(valor); break
              case 'valor_bruto':
              case 'valor_liquido':
              case 'taxa_mdr':
              case 'despesa_mdr':
              case 'valor_antecipacao':
              case 'valor_liquido_antecipacao':
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

          const valorPago = r.valor_liquido_antecipacao != null 
            ? r.valor_liquido_antecipacao 
            : ((r.valor_liquido || 0) - (r.valor_antecipacao || 0))
          const despesa_antecipacao = (r.valor_liquido || 0) - (valorPago || 0)
          r.valor_liquido_antecipacao = valorPago
          r.despesa_antecipacao = despesa_antecipacao

          if (nomeEmpresa) {
            r.empresa = nomeEmpresa
            r.matriz = getValorMatrizPorEmpresa(nomeEmpresa)
          } else {
            r.empresa = ''
            r.matriz = ''
          }
          r.adquirente = operadora ? operadora.toUpperCase() : 'UNICA'

          const valido = (r.valor_bruto !== 0) || (r.valor_liquido !== 0)
          if (valido) out.push(r)
        } catch (e) {
          erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`)
        }
      }
      await new Promise(resolve => setTimeout(resolve))
    }

    return { dados: out, total: out.length, erros }
  }

  // Leitura com import dinâmico
  const lerArquivo = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await getXLSX()
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        dbg('Sheets encontrados', workbook.SheetNames)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })
        dbg('Amostra linhas', { primeira: jsonData[0], headerLinha9: jsonData[8] })
        resolve(jsonData)
      } catch (err) { 
        dbg('Erro ao ler arquivo', err)
        reject(err) 
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

  // Helpers
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

    if (typeof valor === 'number') {
      // Serial Excel
      return excelSerialToISO(valor)
    }

    const str = String(valor).trim()

    // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    let m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
    if (m) {
      const [, dd, mm, yyyy] = m
      return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    }

    // YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD
    m = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/)
    if (m) {
      const [, yyyy, mm, dd] = m
      return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    }

    // Fallback Date
    const d = new Date(str)
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

  // Varredura adaptativa de cabeçalho nas primeiras 30 linhas
  const detectarLinhaCabecalho = (matriz, maxLinhas = 30) => {
    const candidatos = ['DATA VENDA','DATA RECEBIMENTO','VALOR VENDA','VALOR LÍQUIDO','VALOR LIQUIDO','BANDEIRA','NSU']
    let melhorIdx = -1
    let melhorScore = -1
    const limite = Math.min(maxLinhas, matriz.length)
    for (let i = 0; i < limite; i++) {
      const row = matriz[i] || []
      const norm = row.map(normalizar)
      const hits = candidatos.filter(c => norm.includes(c)).length
      if (hits > melhorScore) {
        melhorScore = hits
        melhorIdx = i
      }
      if (hits >= 4) {
        return { idx: i, headersRaw: row, headersNorm: norm }
      }
    }
    const idx = melhorIdx !== -1 ? melhorIdx : 0
    const row = matriz[idx] || []
    return { idx, headersRaw: row, headersNorm: row.map(normalizar) }
  }

  // Busca com fallback “contains”
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

  return {
    processarArquivoComPython
  }
}
