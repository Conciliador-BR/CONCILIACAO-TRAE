import { useEmpresas } from '~/composables/useEmpresas'

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30))

const excelSerialToISO = (n) => {
  if (typeof n !== 'number' || !isFinite(n)) return null
  const ms = Math.round(n) * 86400000
  const d = new Date(EXCEL_EPOCH.getTime() + ms)
  const yyyy = String(d.getUTCFullYear()).padStart(4, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const useProcessorVendasVoucherAlelo = () => {
  const { fetchEmpresas, empresas, getEmpresaCompletaPorNome } = useEmpresas()

  const getXLSX = async () => {
    const mod = await import('xlsx')
    return mod
  }

  const processarArquivo = async (arquivo, operadora, nomeEmpresa, ecSelecionado = '') => {
    const erros = []
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido')
      const dados = await lerArquivo(arquivo)
      if (!empresas.value || empresas.value.length === 0) await fetchEmpresas()
      const empresaFull = getEmpresaCompletaPorNome(nomeEmpresa) || {}
      const ecEmpresa = ecSelecionado || empresaFull.matriz || ''
      const registros = await processarDados(dados, { operadora, empresa: nomeEmpresa, ec: ecEmpresa })
      return { sucesso: true, registros, total: registros.length, erros }
    } catch (e) {
      return { sucesso: false, registros: [], total: 0, erros: [e.message] }
    }
  }

  const processarDados = async (dados, contexto) => {
    const out = []
    const { operadora, empresa, ec } = contexto
    if (!Array.isArray(dados) || dados.length === 0) return []
    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(dados)
    const ALIASES = {
      nsu: ['NUMERO DA AUTORIZACAO','NUMERO DA AUTORIZAÇÃO','NÚMERO DA AUTORIZAÇÃO','AUTORIZACAO','AUTORIZAÇÃO','NSU'],
      data_venda: ['DATA DA VENDA','DATA VENDA','VENDA DATA'],
      previsao_pgto: ['DATA DE PAGAMENTO','DATA PAGAMENTO','PREVISAO PGTO','PREVISÃO PGTO','PREVISAO PAGAMENTO','PREVISÃO PAGAMENTO'],
      modalidade: ['TIPO CARTAO','TIPO CARTÃO','MODALIDADE','PRODUTO'],
      valor_bruto: ['VALOR BRUTO','VALOR DA VENDA','VALOR'],
      valor_liquido: ['VALOR LIQUIDO','VALOR LÍQUIDO','LIQUIDO'],
      status: ['STATUS']
    }
    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })
    const inicio = headerRowIdx + 1
    for (let i = inicio; i < dados.length; i++) {
      const row = dados[i] || []
      if (!row || row.length === 0 || row.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue
      const item = {
        adquirente: (operadora || 'ALELO').toString().trim().toUpperCase(),
        nsu: '',
        data_venda: null,
        previsao_pgto: null,
        modalidade: '',
        valor_bruto: 0,
        despesa: 0,
        valor_liquido: 0,
        empresa: empresa || '',
        ec: ec || ''
      }
      for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
        const idx = Number(idxStr)
        const valor = row[idx]
        switch (campoDb) {
          case 'nsu': item.nsu = valor != null ? String(valor).trim() : ''; break
          case 'data_venda': item.data_venda = formatarData(valor) || '0001-01-01'; break
          case 'previsao_pgto': item.previsao_pgto = formatarData(valor); break
          case 'modalidade': item.modalidade = valor != null ? String(valor).trim() : ''; break
          case 'valor_bruto': item.valor_bruto = formatarValor(valor); break
          case 'valor_liquido': item.valor_liquido = formatarValor(valor); break
          case 'status': item.status = valor != null ? String(valor).trim().toLowerCase() : ''; break
          default: break
        }
      }
      if ((item.status || '') !== 'aprovada') continue
      item.despesa = Math.max(0, (item.valor_bruto || 0) - (item.valor_liquido || 0))
      out.push(item)
    }
    return out
  }

  const escolherAbaExtrato = (workbook) => {
    const names = workbook.SheetNames || []
    const normalize = (s) => s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
    const target = 'EXTRATO'
    for (const name of names) {
      if (normalize(name) === target) return workbook.Sheets[name]
    }
    for (const name of names) {
      if (normalize(name).includes(target)) return workbook.Sheets[name]
    }
    return workbook.Sheets[names[0]]
  }

  const lerArquivo = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await getXLSX()
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = escolherAbaExtrato(workbook)
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
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0.0
    const limpo = String(valor).replace(/\u00A0/g, ' ').replace(/\s/g, '').replace(/R\$/gi, '').replace(/%/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(limpo)
    return Number.isFinite(n) ? n : 0.0
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas=20) => {
    const candidatos = ['NUMERO DA AUTORIZACAO','DATA DA VENDA','DATA DE PAGAMENTO','TIPO CARTAO','VALOR BRUTO','VALOR LIQUIDO','STATUS']
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

  return { processarArquivo, processarDados }
}