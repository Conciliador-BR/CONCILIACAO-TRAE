import * as XLSX from 'xlsx'
import { useEmpresas } from '../../useEmpresas'

export const useVendasOperadoraSafra = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

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
      modalidade: ['PRODUTO','MODALIDADE'],
      nsu: ['NUMERO SEQUENCIAL UNICO','NÚMERO SEQUENCIAL ÚNICO','NSU'],
      valor_bruto: ['VALOR BRUTO DA VENDA','VALOR DA VENDA','VALOR BRUTO'],
      valor_liquido: ['VALOR LIQUIDO DA VENDA','VALOR LÍQUIDO DA VENDA','VALOR A RECEBER','VALOR LIQUIDO'],
      numero_parcelas: ['PARCELA','NUMERO PARCELAS','NÚMERO PARCELAS'],
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
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) {
        continue
      }
      try {
        const r = {
          data_venda: null,
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
          adquirente: 'SAFRA'
        }
        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_venda': r.data_venda = formatarData(valor); break
            case 'valor_bruto':
            case 'valor_liquido':
              r[campoDb] = formatarValor(valor); break
            case 'numero_parcelas':
              r.numero_parcelas = formatarInteiro(valor); break
            case 'modalidade':
            case 'bandeira':
              r[campoDb] = valor != null ? String(valor).trim().toUpperCase() : ''; break
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
        r.despesa_mdr = Math.abs((r.valor_bruto || 0) - (r.valor_liquido || 0))
        r.taxa_mdr = (r.valor_bruto && r.valor_bruto !== 0) ? (r.despesa_mdr / r.valor_bruto) : 0
        r.valor_antecipacao = 0.0
        r.despesa_antecipacao = 0.0
        r.valor_liquido_antecipacao = 0.0
        const isVoucher = modNorm.includes('voucher') || modNorm.includes('vouchers')
        const valido = ((r.valor_bruto !== 0) || (r.valor_liquido !== 0)) && !isVoucher
        if (valido) {
          const n = Math.max(1, r.numero_parcelas || 1)
          if (n > 1) {
            const partes = splitRegistroEmParcelas(r, n)
            partes.forEach(p => out.push(p))
          } else {
            out.push(r)
          }
        }
      } catch (e) {
        erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`)
      }
    }
    return { dados: out, total: out.length, erros }
  }

  const lerArquivo = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
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
    try {
      if (typeof valor === 'number') {
        const d = XLSX.SSF.parse_date_code(valor)
        if (d) {
          const yyyy = String(d.y).padStart(4, '0')
          const mm = String(d.m).padStart(2, '0')
          const dd = String(d.d).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}`
        }
      }
      if (valor instanceof Date) return valor.toISOString().split('T')[0]
      const s = String(valor).trim()
      const firstChunk = s.split(/[T\s]+/)[0]
      const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
      const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      if (ddmmyyyy.test(firstChunk)) {
        const [, d, m, y] = firstChunk.match(ddmmyyyy)
        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      }
      if (yyyymmdd.test(firstChunk)) return firstChunk
      return firstChunk
    } catch { return null }
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

  const detectarLinhaCabecalho = (matriz, maxLinhas=15) => {
    const candidatos = ['DATA DA VENDA','VALOR BRUTO DA VENDA','VALOR LIQUIDO DA VENDA','BANDEIRA','ARRANJO','NUMERO SEQUENCIAL UNICO','NSU']
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

  const normalize = (str) => {
    if (str === undefined || str === null) return ''
    let s = String(str).trim().toLowerCase()
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    s = s.replace(/[^a-z0-9]/g, '')
    return s
  }

  const splitAmount = (total, n, idx) => {
    const base = Math.floor(((total || 0) / n) * 100) / 100
    const resto = ((total || 0) - base * (n - 1))
    const valor = idx < n - 1 ? base : resto
    return Number.isFinite(valor) ? parseFloat(valor.toFixed(2)) : 0.0
  }

  const getDataCortePorModalidade = (r) => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('taxas-conciliacao')
        if (raw) {
          const lista = JSON.parse(raw) || []
          const alvoModal = normalize(r.modalidade)
          const alvoAdq = normalize(r.adquirente)
          const alvoEmp = normalize(r.empresa)
          let encontrada = lista.find(t => normalize(t.modalidade) === alvoModal && normalize(t.adquirente) === alvoAdq && normalize(t.empresa) === alvoEmp)
          if (!encontrada) encontrada = lista.find(t => normalize(t.modalidade) === alvoModal && normalize(t.adquirente) === alvoAdq)
          if (!encontrada) encontrada = lista.find(t => normalize(t.modalidade) === alvoModal)
          const dc = encontrada?.dataCorte ?? encontrada?.data_corte
          const v = parseInt(dc, 10)
          if (Number.isFinite(v) && v > 0) return v
        }
      }
    } catch {}
    return null
  }

  const addDias = (dataStr, dias) => {
    try {
      const [y,m,d] = String(dataStr).split('-').map(x => parseInt(x,10))
      const dt = new Date(y, (m||1)-1, d||1)
      dt.setDate(dt.getDate() + dias)
      const yy = dt.getFullYear()
      const mm = String(dt.getMonth()+1).padStart(2,'0')
      const dd = String(dt.getDate()).padStart(2,'0')
      return `${yy}-${mm}-${dd}`
    } catch { return dataStr }
  }

  const splitRegistroEmParcelas = (r, n) => {
    const arr = []
    const baseDias = getDataCortePorModalidade(r)
    for (let idx = 0; idx < n; idx++) {
      const vb = splitAmount(r.valor_bruto || 0, n, idx)
      const vl = splitAmount(r.valor_liquido || 0, n, idx)
      const dm = Math.abs(vb - vl)
      const taxa = vb && vb !== 0 ? (dm / vb) : 0
      const previsao = (Number.isFinite(baseDias) && baseDias > 0) ? addDias(r.data_venda, baseDias * (idx + 1)) : undefined
      arr.push({
        data_venda: r.data_venda,
        modalidade: r.modalidade,
        nsu: r.nsu,
        valor_bruto: vb,
        valor_liquido: vl,
        taxa_mdr: taxa,
        despesa_mdr: dm,
        numero_parcelas: r.numero_parcelas,
        bandeira: r.bandeira,
        valor_antecipacao: 0.0,
        despesa_antecipacao: 0.0,
        valor_liquido_antecipacao: 0.0,
        ...(previsao ? { previsao_pgto: previsao } : {}),
        empresa: r.empresa,
        matriz: r.matriz,
        adquirente: r.adquirente
      })
    }
    return arr
  }

  return { processarArquivoComPython }
}