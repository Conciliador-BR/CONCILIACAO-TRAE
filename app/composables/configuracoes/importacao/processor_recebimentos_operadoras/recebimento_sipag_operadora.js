import * as XLSX from 'xlsx'
import { useEmpresas } from '~/composables/useEmpresas'

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

export const useRecebimentosOperadoraSipag = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      if ((operadora || '').toLowerCase() !== 'sipag') {
        throw new Error(`Operadora '${operadora}' não suportada por este processador.`)
      }

      const dados = await lerArquivo(arquivo)

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
      data_venda: ['DATA DA TRANSACAO', 'DATA DA TRANSAÇÃO', 'DATA TRANSACAO', 'DATA TRANSAÇÃO', 'DATA'],
      data_recebimento: ['DATA DO PAGAMENTO', 'DATA PAGAMENTO', 'DATA DO RECEBIMENTO', 'DATA RECEBIMENTO'],
      modalidade: ['FORMA DE PAGAMENTO', 'MODALIDADE', 'PRODUTO'],
      nsu: ['NUMERO DA AUTORIZACAO', 'NÚMERO DA AUTORIZAÇÃO', 'NUMERO AUTORIZACAO', 'NÚMERO AUTORIZAÇÃO', 'AUTORIZACAO', 'AUTORIZAÇÃO', 'NSU'],
      valor_bruto: ['VALOR PARCELA BRUTO', 'VALOR BRUTO', 'VALOR DA PARCELA BRUTO'],
      valor_liquido: ['VALOR PARCELA LIQUIDO', 'VALOR PARCELA LÍQUIDO', 'VALOR LIQUIDO', 'VALOR LÍQUIDO'],
      despesa_mdr: ['DESCONTO PARCELA', 'DESCONTO', 'DESPESA MDR', 'VALOR DESCONTO'],
      numero_parcelas: ['PARCELA', 'NUMERO DE PARCELAS', 'NÚMERO DE PARCELAS', 'PARCELAS'],
      bandeira: ['BANDEIRA']
    }

    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })

    const chavesMin = ['valor_bruto', 'valor_liquido', 'nsu']
    const temAlgumaChave = chavesMin.some(k => Object.values(colIndexParaCampo).includes(k))
    if (!temAlgumaChave) {
      return { dados: [], total: 0, erros: ['Nenhuma coluna essencial foi mapeada a partir dos cabeçalhos.'] }
    }

    for (let i = headerRowIdx + 1; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || String(c).trim() === '')) {
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
          empresa: nomeEmpresa || '',
          matriz: nomeEmpresa ? getValorMatrizPorEmpresa(nomeEmpresa) : '',
          adquirente: 'SIPAG'
        }

        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_venda':
            case 'data_recebimento':
              r[campoDb] = formatarData(valor)
              break
            case 'valor_bruto':
            case 'valor_liquido':
            case 'despesa_mdr':
              r[campoDb] = formatarValor(valor)
              break
            case 'numero_parcelas':
              r.numero_parcelas = formatarParcela(valor)
              break
            case 'modalidade':
            case 'bandeira':
              r[campoDb] = valor != null ? String(valor).trim().toUpperCase() : ''
              break
            case 'nsu':
              r.nsu = valor != null ? String(valor).trim() : ''
              break
            default:
              break
          }
        }

        r.numero_parcelas = Math.max(1, r.numero_parcelas || 1)

        const brutoOriginal = Number(r.valor_bruto || 0)
        const liquidoOriginal = Number(r.valor_liquido || 0)
        const possuiValorNegativo = brutoOriginal < 0 || liquidoOriginal < 0
        const nsuNormalizado = String(r.nsu || '').trim()
        const ehLinhaAluguelTarifa = possuiValorNegativo && ['0', '-', ''].includes(nsuNormalizado)

        if (ehLinhaAluguelTarifa) {
          r.modalidade = 'ALUGUEL/TARIFA'
          r.valor_bruto = 0
          r.valor_liquido = 0
          r.despesa_mdr = Math.max(
            Math.abs(brutoOriginal),
            Math.abs(liquidoOriginal),
            Math.abs(Number(r.despesa_mdr || 0))
          )
          r.taxa_mdr = 0
        } else {
          r.despesa_mdr = Math.abs(r.despesa_mdr || 0)

          if (!r.despesa_mdr && r.valor_bruto && r.valor_liquido) {
            r.despesa_mdr = Math.abs((r.valor_bruto || 0) - (r.valor_liquido || 0))
          }

          r.taxa_mdr = (r.valor_bruto && r.valor_bruto !== 0)
            ? (Math.abs((r.valor_bruto || 0) - (r.valor_liquido || 0)) / Math.abs(r.valor_bruto))
            : 0
        }

        const valido = Boolean(r.nsu) && (
          r.valor_bruto !== 0 ||
          r.valor_liquido !== 0 ||
          r.despesa_mdr !== 0
        )

        if (valido) out.push(r)
      } catch (e) {
        erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`)
      }
    }

    return { dados: out, total: out.length, erros }
  }

  const lerArquivo = async (file) => {
    const nome = String(file?.name || '').toLowerCase()
    if (nome.endsWith('.csv')) {
      const texto = await file.text()
      const workbook = XLSX.read(texto, { type: 'string', raw: true, codepage: 65001 })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      return XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: '' })
    }

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: '' })
          resolve(jsonData)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const normalizar = (s) => {
    if (s == null) return ''
    return s.toString()
      .normalize('NFD')
      .replace(/\u00A0/g, ' ')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  const findIndexByAliases = (headersNorm, aliasesNorm) => {
    for (let i = 0; i < headersNorm.length; i++) {
      if (aliasesNorm.includes(headersNorm[i])) return i
    }
    return -1
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas = 30) => {
    const candidatos = [
      'DATA DA TRANSACAO',
      'DATA DO PAGAMENTO',
      'FORMA DE PAGAMENTO',
      'NUMERO DA AUTORIZACAO',
      'VALOR PARCELA BRUTO',
      'VALOR PARCELA LIQUIDO',
      'DESCONTO PARCELA',
      'PARCELA',
      'BANDEIRA'
    ]

    let melhorIdx = -1
    let melhorScore = -1
    let melhorHeaders = []

    for (let i = 0; i < Math.min(matriz.length, maxLinhas); i++) {
      const linha = matriz[i]
      if (!Array.isArray(linha)) continue
      const headersNorm = linha.map(normalizar)
      const score = candidatos.reduce((acc, item) => acc + (headersNorm.includes(item) ? 1 : 0), 0)
      if (score > melhorScore) {
        melhorScore = score
        melhorIdx = i
        melhorHeaders = headersNorm
      }
    }

    return { idx: melhorIdx, headersNorm: melhorScore > 0 ? melhorHeaders : [] }
  }

  const formatarData = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    if (typeof valor === 'number') return excelSerialToISO(valor)

    const s = String(valor).trim()
    const first = s.split(/[T\s]+/)[0]
    let m = first.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
    if (m) {
      const [, dd, mm, yyyy] = m
      return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    }
    m = first.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/)
    if (m) {
      const [, yyyy, mm, dd] = m
      return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    }
    const d = new Date(first)
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

      const texto = String(valor)
        .replace(/\u00A0/g, ' ')
        .replace(/\s/g, '')
        .replace(/R\$/gi, '')
        .replace(/%/g, '')

      if (texto.includes(',') && texto.includes('.')) {
        const limpo = texto.replace(/\./g, '').replace(',', '.')
        const n = parseFloat(limpo)
        return Number.isFinite(n) ? n : 0.0
      }

      if (texto.includes(',')) {
        const n = parseFloat(texto.replace(',', '.'))
        return Number.isFinite(n) ? n : 0.0
      }

      const n = parseFloat(texto)
      return Number.isFinite(n) ? n : 0.0
    } catch {
      return 0.0
    }
  }

  const formatarParcela = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0
    if (typeof valor === 'number') return Math.max(0, Math.trunc(valor))

    const texto = String(valor).trim()
    const fracionado = texto.match(/(\d+)\s*\/\s*(\d+)/)
    if (fracionado) {
      return Math.max(0, parseInt(fracionado[2], 10) || 0)
    }

    const numeros = texto.match(/\d+/g)
    if (!numeros?.length) return 0
    return Math.max(0, parseInt(numeros[numeros.length - 1], 10) || 0)
  }

  return { processarArquivoComPython }
}
