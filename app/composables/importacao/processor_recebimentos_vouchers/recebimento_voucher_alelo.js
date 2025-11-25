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

export const useProcessorRecebimentoVoucherAlelo = () => {
  const getXLSX = async () => { const mod = await import('xlsx'); return mod }

  const processarArquivo = async (arquivo, operadora, empresa, ec) => {
    const erros = []
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido')
      const dados = await lerAbaRecebimentos(arquivo)
      const registros = await processarRecebimentos(dados, { operadora, empresa, ec })
      return { sucesso: true, registros, total: registros.length, erros }
    } catch (e) {
      return { sucesso: false, registros: [], total: 0, erros: [e.message] }
    }
  }

  const processarRecebimentos = async (matriz, contexto) => {
    const { operadora, empresa, ec } = contexto
    if (!Array.isArray(matriz) || matriz.length === 0) return []
    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(matriz, [
      'NUMERO DA AUTORIZACAO','NUMERO DA AUTORIZAÇÃO','NÚMERO DA AUTORIZAÇÃO','AUTORIZACAO','AUTORIZAÇÃO','NSU','Nº DA AUTORIZAÇÃO','NUM. AUTORIZAÇÃO',
      'DATA DA VENDA','DATA VENDA',
      'DATA DE PAGAMENTO','DATA PAGAMENTO',
      'TIPO CARTAO','TIPO CARTÃO','MODALIDADE','PRODUTO',
      'VALOR BRUTO','VALOR DA VENDA','VALOR',
      'VALOR LIQUIDO','VALOR LÍQUIDO'
    ])
    const candidatosDet = [
      'NUMERO DA AUTORIZACAO','NUMERO DA AUTORIZAÇÃO','NÚMERO DA AUTORIZAÇÃO','AUTORIZACAO','AUTORIZAÇÃO','NSU','Nº DA AUTORIZAÇÃO','NUM. AUTORIZAÇÃO',
      'DATA DA VENDA','DATA VENDA',
      'DATA DE PAGAMENTO','DATA PAGAMENTO',
      'TIPO CARTAO','TIPO CARTÃO','MODALIDADE','PRODUTO',
      'VALOR BRUTO','VALOR DA VENDA','VALOR',
      'VALOR LIQUIDO','VALOR LÍQUIDO'
    ].map(normalizar)
    let headerIdx = headerRowIdx
    let hdrNorm = headersNorm
    if (headerIdx > 0) {
      const prev = matriz[headerIdx - 1] || []
      const prevNorm = prev.map(normalizar)
      const hitsPrev = candidatosDet.filter(c => prevNorm.includes(c)).length
      const hitsHdr = candidatosDet.filter(c => hdrNorm.includes(c)).length
      if (hitsPrev >= hitsHdr && hitsPrev >= 3) {
        headerIdx = headerIdx - 1
        hdrNorm = prevNorm
      }
    }
    const ALIASES = {
      nsu: ['NUMERO DA AUTORIZACAO','NUMERO DA AUTORIZAÇÃO','NÚMERO DA AUTORIZAÇÃO','AUTORIZACAO','AUTORIZAÇÃO','NSU','Nº DA AUTORIZAÇÃO','NUM. AUTORIZAÇÃO'],
      data_venda: ['DATA DA VENDA','DATA VENDA'],
      data_recebimento: ['DATA DE PAGAMENTO','DATA PAGAMENTO'],
      modalidade: ['TIPO CARTAO','TIPO CARTÃO','MODALIDADE','PRODUTO'],
      valor_bruto: ['VALOR BRUTO','VALOR DA VENDA','VALOR'],
      valor_liquido: ['VALOR LIQUIDO','VALOR LÍQUIDO']
    }
    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(hdrNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })
    const fallbackIndices = { nsu: 7, modalidade: 8, valor_bruto: 11, valor_liquido: 12 }
    for (const [campo, idx] of Object.entries(fallbackIndices)) {
      if (!Object.values(colIndexParaCampo).includes(campo)) {
        colIndexParaCampo[idx] = campo
      }
    }
    const inicio = headerIdx + 1
    const out = []
    for (let i = inicio; i < matriz.length; i++) {
      const row = matriz[i] || []
      if (!row || row.length === 0 || row.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue
      const item = {
        adquirente: (operadora || 'ALELO').toString().trim().toUpperCase(),
        nsu: '',
        data_venda: null,
        data_recebimento: null,
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
        if (campoDb === 'nsu') item.nsu = valor != null ? String(valor).trim() : ''
        else if (campoDb === 'data_venda') item.data_venda = formatarData(valor) || null
        else if (campoDb === 'data_recebimento') item.data_recebimento = formatarData(valor) || null
        else if (campoDb === 'modalidade') item.modalidade = valor != null ? String(valor).trim() : ''
        else if (campoDb === 'valor_bruto') item.valor_bruto = formatarValor(valor)
        else if (campoDb === 'valor_liquido') item.valor_liquido = formatarValor(valor)
      }
      if (!item.data_venda) {
        const datas = []
        for (const v of row) {
          const s = String(v || '').trim()
          const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
          if (m) datas.push(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`)
        }
        if (datas.length >= 1) item.data_venda = datas[0]
      }
      if (!item.data_recebimento) {
        const datas = []
        for (const v of row) {
          const s = String(v || '').trim()
          const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
          if (m) datas.push(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`)
        }
        if (datas.length >= 1) item.data_recebimento = datas[datas.length - 1]
      }
      if (Number(item.valor_liquido || 0) === 0 && Number(item.valor_bruto || 0) > 0) {
        item.valor_liquido = item.valor_bruto
      }
      item.despesa = Math.max(0, (item.valor_bruto || 0) - (item.valor_liquido || 0))
      out.push(item)
    }
    return out
  }

  const selecionarAbaRecebimentos = (workbook) => {
    const names = workbook.SheetNames || []
    const normalize = (s) => s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
    const targets = ['RECEBIMENTOS','RECEBIMENTO','RECEB']
    for (const name of names) { if (targets.includes(normalize(name))) return workbook.Sheets[name] }
    for (const name of names) { const n = normalize(name); if (targets.some(t => n.includes(t))) return workbook.Sheets[name] }
    return workbook.Sheets[names[0]]
  }

  const lerAbaRecebimentos = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await getXLSX()
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', dense: true })
        const wsRec = selecionarAbaRecebimentos(workbook)
        const recebimentos = XLSX.utils.sheet_to_json(wsRec, { header: 1, raw: false, cellDates: true, dateNF: 'dd/mm/yyyy', defval: '' })
        resolve(recebimentos)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

  const normalizar = (s) => {
    if (s == null) return ''
    return s.toString().replace(/\u00A0/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[º°]/g,'O').replace(/\s+/g, ' ').trim().toUpperCase()
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

  const detectarLinhaCabecalho = (matriz, candidatosBase = []) => {
    const candidatos = candidatosBase.length ? candidatosBase.map(normalizar) : []
    const maxLinhas = 30
    let melhorIdx = 0
    let melhorScore = -1
    for (let i = 0; i < Math.min(maxLinhas, matriz.length); i++) {
      const row = matriz[i] || []
      const norm = row.map(normalizar)
      const hits = candidatos.filter(c => norm.includes(c)).length
      if (hits > melhorScore) { melhorScore = hits; melhorIdx = i }
      if (hits >= 3) return { idx: i, headersNorm: norm }
    }
    const row = matriz[melhorIdx] || []
    return { idx: melhorIdx, headersNorm: row.map(normalizar) }
  }

  const findIndexByAliases = (headersNorm, aliases) => {
    for (const a of aliases) { const idx = headersNorm.indexOf(a); if (idx >= 0) return idx }
    for (const a of aliases) { const idx = headersNorm.findIndex(h => h.includes(a)); if (idx >= 0) return idx }
    return -1
  }

  return { processarArquivo, processarRecebimentos }
}
