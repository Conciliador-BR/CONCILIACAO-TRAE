import { useTaxOperations } from '~/composables/importacao/Envio_vendas/calculo_previsao_pgto/useTaxOperations.js'

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

export const useProcessorVendasVoucherUpBrasil = () => {
  const { carregarTaxas } = useTaxOperations()

  const normalizar = (s) => {
    if (s == null) return ''
    return s.toString().normalize('NFD').replace(/[\u0000-\u001F]/g,'').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
  }

  const formatarDataTexto = (valor) => {
    if (valor === undefined || valor === null || valor === '') return ''
    const s = String(valor).trim().replace(/\s+/g, ' ')
    const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (m) return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`
    return ''
  }

  const formatarDataISO = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    if (typeof valor === 'number') return excelSerialToISO(valor)
    const s = String(valor).trim().replace(/\s+/g, ' ')
    const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
    return null
  }

  const formatarValor = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.0
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0.0
    let s = String(valor).replace(/\u00A0/g, ' ').trim()
    s = s.replace(/R\$/gi, '').replace(/%/g, '').replace(/\s/g, '')
    const hasComma = s.includes(',')
    const hasDot = s.includes('.')
    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(',')
      const lastDot = s.lastIndexOf('.')
      if (lastComma > lastDot) {
        s = s.replace(/\./g, '').replace(',', '.')
      } else {
        s = s.replace(/,/g, '')
      }
    } else if (hasComma) {
      const parts = s.split(',')
      if (parts.length === 2 && parts[1].length <= 2) {
        s = parts[0].replace(/\./g, '') + '.' + parts[1]
      } else {
        s = s.replace(/,/g, '')
      }
    }
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : 0.0
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas=25) => {
    const candidatos = ['AUTORIZACAO','AUTORIZAÇÃO','DATA TRANSACAO','DATA TRANSAÇÃO','VL.SALDO','VL.CREDITO','NOME LANCAMENTO','PRODUTO']
    for (let i = 0; i < Math.min(maxLinhas, matriz.length); i++) {
      const row = matriz[i] || []
      const norm = row.map((c)=>normalizar(c))
      const hits = candidatos.filter(c => norm.includes(c)).length
      if (hits >= 2) return { idx: i, headersNorm: norm }
    }
    const i = 0
    const row = matriz[i] || []
    return { idx: i, headersNorm: row.map((c)=>normalizar(c)) }
  }

  const findIndexByAliases = (headersNorm, aliases) => {
    for (const a of aliases) { const idx = headersNorm.indexOf(a); if (idx >= 0) return idx }
    for (const a of aliases) { const idx = headersNorm.findIndex(h => h.includes(a)); if (idx >= 0) return idx }
    return -1
  }

  const processarDados = async (dados, contexto) => {
    const out = []
    const { operadora, empresa, ec } = contexto
    if (!Array.isArray(dados) || dados.length === 0) return []
    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(dados)
    const ALIASES = {
      nsu: ['AUTORIZACAO','AUTORIZAÇÃO'],
      data_transacao: ['DATA TRANSACAO','DATA TRANSAÇÃO'],
      vl_saldo: ['VL.SALDO','SALDO'],
      vl_credito: ['VL.CREDITO','VALOR CREDITO','CREDITO'],
      vl_debito: ['VL.DEBITO','VALOR DEBITO','DÉBITO','DEBITO'],
      nome_lancamento: ['NOME LANCAMENTO'],
      produto: ['PRODUTO','MODALIDADE']
    }
    const mapCols = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) mapCols[idx] = campoDb
    })

    const grupos = {}
    const inicio = headerRowIdx + 1
    for (let i = inicio; i < dados.length; i++) {
      const row = dados[i] || []
      if (!row || row.length === 0 || row.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue
      const normRow = row.map(c => normalizar(c))
      if (normRow.some(c => c.includes('TOTAL'))) continue
      let nsu = ''
      let dataTxt = ''
      let dataIso = null
      let nomeLanc = ''
      let vlSaldo = 0
      let vlCredito = 0
      let vlDebito = 0
      let produtoValor = ''
      for (const [idxStr, campo] of Object.entries(mapCols)) {
        const idx = Number(idxStr)
        const v = row[idx]
        if (campo === 'nsu') nsu = v != null ? String(v).trim() : ''
        else if (campo === 'data_transacao') { dataTxt = formatarDataTexto(v); dataIso = formatarDataISO(v) }
        else if (campo === 'vl_saldo') vlSaldo = formatarValor(v)
        else if (campo === 'vl_credito') vlCredito = formatarValor(v)
        else if (campo === 'vl_debito') vlDebito = formatarValor(v)
        else if (campo === 'nome_lancamento') nomeLanc = v != null ? String(v) : ''
        else if (campo === 'produto') produtoValor = v != null ? String(v) : ''
      }
      const key = nsu || `${dataTxt}_${i}`
      if (!grupos[key]) grupos[key] = { nsu: nsu || '', data_venda_text: dataTxt || '', data_venda: dataIso || null, produto: produtoValor || '', credito: 0, debito: 0 }
      const nomeN = normalizar(nomeLanc)
      if (nomeN.includes('TE - VENDA A VISTA') || (nomeN.includes('TE') && nomeN.includes('VENDA'))) {
        grupos[key].credito += vlCredito
      }
      if (nomeN.includes('TE - COMISSAO') || nomeN.includes('COMISSAO')) {
        grupos[key].debito += Math.abs(vlDebito)
      }
    }

    try { await carregarTaxas({ empresa, EC: ec }) } catch {}

    for (const g of Object.values(grupos)) {
      if (!g.credito && !g.debito) continue
      const item = {
        adquirente: 'UP BRASIL',
        nsu: g.nsu,
        data_venda: g.data_venda,
        data_venda_text: g.data_venda_text,
        previsao_pgto: null,
        previsao_pgto_text: '',
        modalidade: '',
        bandeira: 'UP BRASIL',
        valor_bruto: Number(g.credito || 0),
        despesa: Math.abs(Number(g.debito || 0)),
        valor_liquido: 0,
        empresa,
        ec
      }
      const produtoUpper = (g.produto || '').toString().trim().toUpperCase()
      item.modalidade = produtoUpper || 'ALIMENTAÇÃO'
      item.valor_liquido = Math.max(0, (item.valor_bruto || 0) - (item.despesa || 0))
      out.push(item)
    }
    return out
  }

  const getXLSX = async () => { const mod = await import('xlsx'); return mod }
  const escolherAbaExtrato = (workbook) => {
    const names = workbook.SheetNames || []
    const normalize = (s) => s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
    const target = 'EXTRATO'
    for (const name of names) { if (normalize(name) === target) return workbook.Sheets[name] }
    for (const name of names) { if (normalize(name).includes(target)) return workbook.Sheets[name] }
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, cellDates: true, dateNF: 'dd/mm/yyyy', defval: '' })
        resolve(jsonData)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

  const processarArquivo = async (arquivo, operadora, nomeEmpresa, ecSelecionado = '') => {
    const erros = []
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido')
      const dados = await lerArquivo(arquivo)
      await carregarTaxas({ empresa: nomeEmpresa, EC: ecSelecionado })
      const registros = await processarDados(dados, { operadora, empresa: nomeEmpresa, ec: ecSelecionado })
      return { sucesso: true, registros, total: registros.length, erros }
    } catch (e) {
      return { sucesso: false, registros: [], total: 0, erros: [e.message] }
    }
  }

  return { processarDados, processarArquivo }
}