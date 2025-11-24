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

export const useProcessorVendasVoucherTicket = () => {
  const { carregarTaxas, encontrarTaxa } = useTaxOperations()

  const normalizar = (s) => {
    if (s == null) return ''
    return s.toString().normalize('NFD').replace(/[\u0000-\u001F]/g,'').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
  }

  const formatarData = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    if (typeof valor === 'number') return excelSerialToISO(valor)
    const s = String(valor).trim().replace(/\s+/g, ' ')
    if (/^\d{4,6}$/.test(s)) {
      const n = parseInt(s, 10)
      const iso = excelSerialToISO(n)
      return iso
    }
    const firstChunk = s.split(/[T\s]+/)[0]
    const mSlash = firstChunk.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mSlash) {
      const dia = mSlash[1]
      const mes = mSlash[2]
      const ano = mSlash[3]
      return `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(firstChunk)) return firstChunk
    const mDash = firstChunk.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
    if (mDash) {
      const dia = mDash[1]
      const mes = mDash[2]
      const ano = mDash[3]
      return `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    }
    return null
  }

  const isoParaTexto = (iso) => {
    if (!iso) return ''
    if (iso === '0001-01-01') return '00/00/0000'
    const parts = String(iso).split('-')
    if (parts.length === 3) {
      const [y,m,d] = parts
      return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`
    }
    return ''
  }

  const formatarDataTexto = (valor) => {
    if (valor === undefined || valor === null || valor === '') return ''
    if (typeof valor === 'object' && typeof valor.getFullYear === 'function') {
      const y = String(valor.getFullYear())
      const m = String(valor.getMonth() + 1).padStart(2, '0')
      const d = String(valor.getDate()).padStart(2, '0')
      return `${d}/${m}/${y}`
    }
    if (typeof valor === 'number') return isoParaTexto(excelSerialToISO(valor)) || ''
    const s = String(valor).trim().replace(/\s+/g, ' ')
    const firstChunk = s.split(/[T\s]+/)[0]
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(firstChunk)) return firstChunk
    const mDash = firstChunk.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
    if (mDash) return `${String(mDash[1]).padStart(2,'0')}/${String(mDash[2]).padStart(2,'0')}/${mDash[3]}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(firstChunk)) return isoParaTexto(firstChunk)
    return ''
  }

  const coletarDatasDaLinha = (row) => {
    const datas = []
    for (const cell of row) {
      if (cell === undefined || cell === null) continue
      if (typeof cell === 'object' && typeof cell.getFullYear === 'function') {
        datas.push(formatarDataTexto(cell))
        continue
      }
      if (typeof cell === 'number' && cell > 30000 && cell < 60000) {
        datas.push(isoParaTexto(excelSerialToISO(cell)))
        continue
      }
      const s = String(cell).replace(/\u00A0/g, ' ').trim()
      const matchers = [
        /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
        /\b(\d{1,2}-\d{1,2}-\d{4})\b/,
        /\b(\d{4}-\d{2}-\d{2})\b/
      ]
      for (const rx of matchers) {
        const m = s.match(rx)
        if (m) {
          const token = m[1]
          if (token.includes('-')) {
            const parts = token.split('-')
            if (parts[0].length === 4) datas.push(`${parts[2]}/${parts[1]}/${parts[0]}`)
            else datas.push(`${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[2]}`)
          } else {
            datas.push(token)
          }
          break
        }
      }
      const mTime = s.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b\s+\d{1,2}:\d{2}(:\d{2})?/)
      if (mTime) datas.push(mTime[1])
    }
    return datas
  }

  const getCellDateText = async (worksheet, relRow, relCol) => {
    if (!worksheet) return ''
    try {
      const XLSX = await getXLSX()
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      const addr = XLSX.utils.encode_cell({ r: range.s.r + relRow, c: range.s.c + relCol })
      const cell = worksheet[addr]
      if (!cell) return ''
      const v = cell.v
      if (v && typeof v === 'object' && typeof v.getFullYear === 'function') return formatarDataTexto(v)
      if (typeof v === 'number') return isoParaTexto(excelSerialToISO(v)) || ''
      const w = typeof cell.w === 'string' ? cell.w.trim().replace(/\u00A0/g,' ') : ''
      if (w) return formatarDataTexto(w) || w
      return ''
    } catch { return '' }
  }

  const formatarValor = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.0
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0.0
    const limpo = String(valor).replace(/\u00A0/g, ' ').replace(/\s/g, '').replace(/R\$/gi, '').replace(/%/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(limpo)
    return Number.isFinite(n) ? n : 0.0
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas=25) => {
    const candidatos = [
      'Nº TRANSACAO','Nº TRANSACÃO','Nº TRANSAÇÃO','NUMERO DA TRANSACAO','NÚMERO DA TRANSACAO','NÚMERO DA TRANSAÇÃO','NSU',
      'DATA DA TRANSACAO','DATA DA TRANSAÇÃO','DATA TRANSACAO','DATA TRANSACÃO','DATA TRANSACAO',
      'VL TRANSACAO','VL TRANSACÃO','VALOR DA TRANSACAO','VALOR DA TRANSAÇÃO','VALOR','VALOR BRUTO',
      'PRODUTO','MODALIDADE','COD PRODUTO','CODIGO PRODUTO'
    ]
    for (let i = 0; i < Math.min(maxLinhas, matriz.length); i++) {
      const row = matriz[i] || []
      const norm = row.map((c)=>normalizar(c))
      const hits = candidatos.filter(c => norm.includes(c)).length
      if (hits >= 3) return { idx: i, headersNorm: norm }
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

  const mapProdutoParaBandeira = (valor) => {
    const s = normalizar(valor)
    if (!s) return 'TICKET ALIMENTACAO'
    if (s.includes('TA')) return 'TICKET ALIMENTACAO'
    if (s.includes('TR')) return 'TICKET RESTAURANTE'
    if (s.includes('TF')) return 'TICKET FLEX'
    if (s.includes('ALIMENTA')) return 'TICKET ALIMENTACAO'
    if (s.includes('RESTAUR')) return 'TICKET RESTAURANTE'
    if (s.includes('FLEX')) return 'TICKET FLEX'
    return 'TICKET ALIMENTACAO'
  }

  const mapProdutoParaCategoria = (valor) => {
    const s = normalizar(valor)
    if (!s) return 'ALIMENTACAO'
    if (s.includes('TA')) return 'ALIMENTACAO'
    if (s.includes('TR')) return 'RESTAURANTE'
    if (s.includes('TF')) return 'FLEX'
    if (s.includes('ALIMENTA')) return 'ALIMENTACAO'
    if (s.includes('RESTAUR')) return 'RESTAURANTE'
    if (s.includes('FLEX')) return 'FLEX'
    return 'ALIMENTACAO'
  }

  const extrairProdutoCabecalho = (matriz) => {
    const max = Math.min(20, matriz.length)
    for (let i = 0; i < max; i++) {
      const row = matriz[i] || []
      for (const cell of row) {
        const sNorm = normalizar(cell)
        if (!sNorm) continue
        if (sNorm.includes('PRODUTO:') || sNorm.includes('MODALIDADE:')) {
          const original = cell != null ? String(cell) : ''
          const partes = original.split(':')
          if (partes.length >= 2) return partes.slice(1).join(':').trim()
        }
      }
    }
    return ''
  }

  const processarDados = async (dados, contexto) => {
    const out = []
    const { operadora, empresa, ec, worksheet } = contexto
    if (!Array.isArray(dados) || dados.length === 0) return []
    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(dados)
    const ALIASES = {
      nsu: ['Nº TRANSACAO','Nº TRANSACÃO','Nº TRANSAÇÃO','NUMERO DA TRANSACAO','NÚMERO DA TRANSACAO','NÚMERO DA TRANSAÇÃO','NSU'],
      produto: ['PRODUTO','MODALIDADE','COD PRODUTO','CODIGO PRODUTO'],
      data_venda: ['DATA DA TRANSACAO','DATA DA TRANSAÇÃO','DATA TRANSACAO','DATA TRANSACÃO','DATA VENDA','DATA DA VENDA'],
      valor_bruto: ['VL TRANSACAO','VL TRANSACÃO','VALOR DA TRANSACAO','VALOR DA TRANSAÇÃO','VALOR BRUTO','VALOR']
    }
    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })
    const idxDataTransacao = findIndexByAliases(headersNorm, ['DATA DA TRANSACAO','DATA DA TRANSAÇÃO','DATA TRANSACAO','DATA TRANSACÃO'])

    try {
      await carregarTaxas({ empresa, EC: ec })
    } catch {}

    const produtoCabecalho = extrairProdutoCabecalho(dados)
    const inicio = headerRowIdx + 1
    for (let i = inicio; i < dados.length; i++) {
      const row = dados[i] || []
      if (!row || row.length === 0 || row.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue
      const item = {
        adquirente: (operadora || 'TICKET').toString().trim().toUpperCase(),
        nsu: '',
        data_venda: null,
        data_venda_text: '',
        previsao_pgto: null,
        previsao_pgto_text: '',
        modalidade: 'ALIMENTACAO',
        bandeira: '',
        valor_bruto: 0,
        despesa: 0,
        valor_liquido: 0,
        empresa: empresa || '',
        ec: ec || ''
      }
      let produtoValor = ''
      for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
        const idx = Number(idxStr)
        const valor = row[idx]
        switch (campoDb) {
          case 'nsu': item.nsu = valor != null ? String(valor).trim() : ''; break
          case 'data_venda':
            item.data_venda = item.data_venda || formatarData(valor)
            item.data_venda_text = item.data_venda_text || formatarDataTexto(valor)
            break
          case 'valor_bruto': item.valor_bruto = formatarValor(valor); break
          case 'produto': produtoValor = valor != null ? String(valor) : ''; break
          default: break
        }
      }
      if (idxDataTransacao >= 0 && !item.data_venda && !item.data_venda_text) {
        const valData = row[idxDataTransacao]
        item.data_venda = formatarData(valData) || null
        item.data_venda_text = formatarDataTexto(valData) || ''
        if (!item.data_venda_text) item.data_venda_text = await getCellDateText(worksheet, i, idxDataTransacao)
      }
      if (!item.data_venda && item.data_venda_text) {
        const parts = item.data_venda_text.split('/')
        if (parts.length === 3) {
          item.data_venda = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      }

      const produtoFonte = produtoValor || produtoCabecalho
      item.bandeira = mapProdutoParaBandeira(produtoFonte)
      item.modalidade = mapProdutoParaCategoria(produtoFonte)

      const taxa = encontrarTaxa({
        empresa: item.empresa,
        ec: item.ec,
        adquirente: item.adquirente,
        bandeira: item.bandeira,
        modalidade: 'VOUCHERS'
      })
      const percentual = taxa && (Number(taxa.percentualTaxa) || Number(taxa.taxa) || Number(taxa.percentual))
      if (Number.isFinite(percentual) && percentual > 0) {
        const desp = (item.valor_bruto || 0) * (percentual / 100)
        item.despesa = Math.max(0, desp)
        item.valor_liquido = Math.max(0, (item.valor_bruto || 0) - item.despesa)
      } else {
        item.valor_liquido = Math.max(0, item.valor_bruto)
        item.despesa = 0
      }

      out.push(item)
    }
    return out
  }

  const getXLSX = async () => {
    const mod = await import('xlsx')
    return mod
  }

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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          cellDates: true,
          dateNF: 'dd/mm/yyyy',
          defval: ''
        })
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
      let worksheet = null
      try {
        const XLSX = await getXLSX()
        const data = await arquivo.arrayBuffer()
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
        worksheet = escolherAbaExtrato(workbook)
      } catch {}
      await carregarTaxas({ empresa: nomeEmpresa, EC: ecSelecionado })
      const registros = await processarDados(dados, { operadora, empresa: nomeEmpresa, ec: ecSelecionado, worksheet })
      return { sucesso: true, registros, total: registros.length, erros }
    } catch (e) {
      return { sucesso: false, registros: [], total: 0, erros: [e.message] }
    }
  }

  return { processarDados, processarArquivo }
}