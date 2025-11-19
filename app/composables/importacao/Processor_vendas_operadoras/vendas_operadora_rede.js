import * as XLSX from 'xlsx'
import { useEmpresas } from '../../useEmpresas'
import { useHolidayUtils } from '../Envio_vendas/calculo_previsao_pgto/useHolidayUtils'

export const useVendasOperadoraRede = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()
  const { adicionarDiasCorridos, ajustarParaProximoDiaUtil } = useHolidayUtils()

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'rede') {
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
      modalidade: ['MODALIDADE','PRODUTO'],
      nsu: ['NSU/CV','NSU','CV'],
      valor_bruto: ['VALOR DA VENDA ATUALIZADO','VALOR ATUALIZADO','VALOR VENDA ATUALIZADO'],
      valor_liquido: ['VALOR LÍQUIDO','VALOR LIQUIDO'],
      taxa_mdr: ['TAXA MDR','% MDR','PERCENTUAL MDR'],
      despesa_mdr: ['VALOR MDR','MDR'],
      numero_parcelas: ['NÚMERO DE PARCELAS','NUMERO DE PARCELAS','PARCELAS'],
      bandeira: ['BANDEIRA','ARRANJO'],
      status: ['STATUS DA VENDA','STATUS'],
      prazo_recebimento: ['PRAZO DE RECEBIMENTO','PRAZO RECEBIMENTO','PRAZO']
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
          adquirente: 'REDE',
          status: '',
          previsao_pgto: null
        }
        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_venda': r.data_venda = formatarData(valor); break
            case 'valor_bruto':
            case 'valor_liquido':
            case 'despesa_mdr':
              r[campoDb] = formatarValor(valor); break
            case 'taxa_mdr':
              r.taxa_mdr = formatarPercentual(valor); break
            case 'numero_parcelas':
              r.numero_parcelas = formatarInteiro(valor); break
            case 'modalidade':
            case 'bandeira':
              r[campoDb] = valor != null ? String(valor).trim() : ''; break
            case 'nsu':
              r.nsu = valor != null ? String(valor).trim() : ''; break
            case 'status':
              r.status = valor != null ? String(valor).trim() : ''; break
            case 'prazo_recebimento': {
              const dias = extrairDiasPrazo(valor)
              if (r.data_venda && dias >= 0) {
                const dt = parseISODateSafe(r.data_venda)
                const ajustada = adicionarDiasCorridos(dt, dias)
                r.previsao_pgto = formatarDataISO(ajustada)
              }
              break
            }
            default: break
          }
        }
        r.despesa_mdr = Math.abs(r.despesa_mdr || 0)
        if (!r.taxa_mdr && (r.valor_bruto && r.valor_bruto !== 0)) {
          r.taxa_mdr = r.despesa_mdr / r.valor_bruto
        }
        const statusNorm = normalizar(r.status).toLowerCase()
        const modNorm = normalizar(r.modalidade).toLowerCase()
        const isVoucher = modNorm.includes('voucher') || modNorm.includes('vouchers')
        const aprovado = statusNorm.includes('aprov') || statusNorm.includes('conclu') || statusNorm.includes('efetiv') || statusNorm.includes('pago')
        const valido = ((r.valor_bruto !== 0) || (r.valor_liquido !== 0)) && aprovado && !isVoucher
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
    return s.toString().normalize('NFD').replace(/\u00A0/g,' ').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
  }

  const formatarDataISO = (d) => {
    const yyyy = String(d.getFullYear()).padStart(4, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const parseISODateSafe = (iso) => {
    try {
      const [y,m,d] = String(iso).split('-').map(n => parseInt(n,10))
      return new Date(y, (m||1)-1, d||1)
    } catch {
      return new Date(iso)
    }
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
      const first = s.split(/[T\s]+/)[0]
      const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
      const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      if (ddmmyyyy.test(first)) {
        const [, d, m, y] = first.match(ddmmyyyy)
        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      }
      if (yyyymmdd.test(first)) return first
      return first
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
    const candidatos = ['DATA DA VENDA','VALOR DA VENDA ATUALIZADO','VALOR LÍQUIDO','NSU/CV','TAXA MDR','VALOR MDR','BANDEIRA','STATUS DA VENDA','PRAZO DE RECEBIMENTO']
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

  const extrairDiasPrazo = (valor) => {
    if (valor === undefined || valor === null || valor === '') return -1
    const s = String(valor).trim().toLowerCase()
    const m = s.match(/(\d{1,3})/)
    if (!m) return -1
    const n = parseInt(m[1], 10)
    return Number.isFinite(n) ? n : -1
  }

  const splitAmount = (total, n, idx) => {
    const base = Math.floor(((total || 0) / n) * 100) / 100
    const resto = ((total || 0) - base * (n - 1))
    const valor = idx < n - 1 ? base : resto
    return Number.isFinite(valor) ? parseFloat(valor.toFixed(2)) : 0.0
  }

  const splitRegistroEmParcelas = (r, n) => {
    const arr = []
    for (let idx = 0; idx < n; idx++) {
      const vb = splitAmount(r.valor_bruto || 0, n, idx)
      const vl = splitAmount(r.valor_liquido || 0, n, idx)
      const dm = Math.abs(vb - vl)
      const taxa = vb && vb !== 0 ? (dm / vb) : 0
      arr.push({
        data_venda: r.data_venda,
        modalidade: String(r.modalidade || ''),
        nsu: r.nsu,
        valor_bruto: vb,
        valor_liquido: vl,
        taxa_mdr: taxa,
        despesa_mdr: dm,
        numero_parcelas: r.numero_parcelas,
        bandeira: String(r.bandeira || ''),
        valor_antecipacao: 0.0,
        despesa_antecipacao: 0.0,
        valor_liquido_antecipacao: 0.0,
        previsao_pgto: r.previsao_pgto || null,
        empresa: r.empresa,
        matriz: r.matriz,
        adquirente: r.adquirente,
        status: r.status
      })
    }
    return arr
  }

  return { processarArquivoComPython }
}