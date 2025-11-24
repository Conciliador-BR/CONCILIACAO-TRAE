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

export const useProcessorVendasVoucherVR = () => {
  const { carregarTaxas, encontrarTaxa } = useTaxOperations()

  const normalizar = (s) => {
    if (s == null) return ''
    return s.toString().normalize('NFD').replace(/[\u0000-\u001F]/g,'').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
  }

  const formatarData = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    if (typeof valor === 'number') return excelSerialToISO(valor)
    const s = String(valor).trim().replace(/\s+/g, ' ')
    const firstChunk = s.split(/[T\s]+/)[0]
    const mSlash = firstChunk.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mSlash) {
      const dia = mSlash[1]
      const mes = mSlash[2]
      const ano = mSlash[3]
      return `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(firstChunk)) return firstChunk
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
    const candidatos = ['NÚMERO AUTORIZAÇÃO','NUMERO AUTORIZACAO','Nº AUTORIZACAO','Nº AUTORIZAÇÃO','NUMERO AUTORIZAÇÃO','DATA','VALOR','PRODUTO','MODALIDADE','VALOR TOTAL']
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

  const mapProdutoParaBandeira = (valor) => {
    const s = normalizar(valor)
    if (!s) return 'VR ALIMENTACAO'
    if (s.includes('ALIMENTA')) return 'VR ALIMENTACAO'
    if (s.includes('REFEIC')) return 'VR REFEICAO'
    return 'VR ALIMENTACAO'
  }

  const processarDados = async (dados, contexto) => {
    const out = []
    const { operadora, empresa, ec } = contexto
    if (!Array.isArray(dados) || dados.length === 0) return []
    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(dados)
    const ALIASES = {
      nsu: ['NÚMERO AUTORIZAÇÃO','NUMERO AUTORIZACAO','Nº AUTORIZACAO','Nº AUTORIZAÇÃO','AUTORIZACAO','AUTORIZAÇÃO'],
      produto: ['PRODUTO','MODALIDADE'],
      data_venda: ['DATA'],
      valor_bruto: ['VALOR'],
      valor_liquido_arquivo: ['VALOR LIQUIDO','VALOR LÍQUIDO']
    }
    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })

    try {
      await carregarTaxas({ empresa, EC: ec })
    } catch {}

    const inicio = headerRowIdx + 1
    for (let i = inicio; i < dados.length; i++) {
      const row = dados[i] || []
      if (!row || row.length === 0 || row.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue
      const normRow = row.map(c => normalizar(c))
      if (normRow.some(c => c.includes('TOTAL'))) continue
      const item = {
        adquirente: (operadora || 'VR').toString().trim().toUpperCase(),
        nsu: '',
        data_venda: null,
        data_venda_text: '',
        previsao_pgto: null,
        previsao_pgto_text: '',
        modalidade: '',
        bandeira: '',
        valor_bruto: 0,
        despesa: 0,
        valor_liquido: 0,
        empresa: empresa || '',
        ec: ec || ''
      }
      let produtoValor = ''
      let valorLiquidoArquivo = null
      for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
        const idx = Number(idxStr)
        const valor = row[idx]
        switch (campoDb) {
          case 'nsu': item.nsu = valor != null ? String(valor).trim() : ''; break
          case 'data_venda': item.data_venda = formatarData(valor) || null; item.data_venda_text = String(valor).split(' ')[0] || ''; break
          case 'valor_bruto': item.valor_bruto = formatarValor(valor); break
          case 'produto': produtoValor = valor != null ? String(valor) : ''; item.modalidade = valor != null ? String(valor).trim() : ''; break
          case 'valor_liquido_arquivo': valorLiquidoArquivo = formatarValor(valor); break
          default: break
        }
      }
      item.bandeira = mapProdutoParaBandeira(produtoValor)
      const taxa = encontrarTaxa({ empresa: item.empresa, ec: item.ec, adquirente: item.adquirente, bandeira: item.bandeira, modalidade: 'VOUCHERS' })
      const percentual = taxa && (Number(taxa.percentualTaxa) || Number(taxa.taxa) || Number(taxa.percentual))
      if (Number.isFinite(percentual) && percentual > 0) {
        const desp = (item.valor_bruto || 0) * (percentual / 100)
        item.despesa = Math.max(0, desp)
        item.valor_liquido = Math.max(0, (item.valor_bruto || 0) - item.despesa)
      } else if (Number.isFinite(valorLiquidoArquivo) && valorLiquidoArquivo > 0) {
        item.valor_liquido = valorLiquidoArquivo
        item.despesa = Math.max(0, (item.valor_bruto || 0) - (item.valor_liquido || 0))
      } else {
        item.valor_liquido = Math.max(0, item.valor_bruto)
        item.despesa = 0
      }
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