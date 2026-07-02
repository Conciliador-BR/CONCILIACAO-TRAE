import * as XLSX from 'xlsx'
import { useEmpresas } from '~/composables/useEmpresas'

export const useVendasOperadoraSipag = () => {
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
      modalidade: ['FORMA DE PAGAMENTO', 'MODALIDADE', 'PRODUTO'],
      nsu: ['NUMERO DA AUTORIZACAO', 'NÚMERO DA AUTORIZAÇÃO', 'NUMERO AUTORIZACAO', 'NÚMERO AUTORIZAÇÃO', 'AUTORIZACAO', 'AUTORIZAÇÃO', 'NSU'],
      valor_bruto: ['VALOR PARCELA BRUTO', 'VALOR BRUTO', 'VALOR DA PARCELA BRUTO'],
      valor_liquido: ['VALOR PARCELA LIQUIDO', 'VALOR PARCELA LÍQUIDO', 'VALOR LIQUIDO', 'VALOR LÍQUIDO'],
      despesa_mdr: ['DESCONTO PARCELA', 'DESCONTO', 'DESPESA MDR', 'VALOR DESCONTO'],
      numero_parcelas: ['PARCELA', 'NUMERO DE PARCELAS', 'NÚMERO DE PARCELAS', 'PARCELAS'],
      bandeira: ['BANDEIRA'],
      status: ['STATUS'],
      prazo_recebimento: ['DATA PREVISTA DE LIQUIDACAO', 'DATA PREVISTA DE LIQUIDAÇÃO', 'PREVISAO DE LIQUIDACAO', 'PREVISÃO DE LIQUIDAÇÃO']
    }

    const colunas = mapearColunas(headersNorm, ALIASES)
    const chavesMin = ['valor_bruto', 'valor_liquido', 'nsu']
    const temAlgumaChave = chavesMin.some(k => Object.values(colunas).includes(k))
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
          previsao_pgto: null,
          empresa: nomeEmpresa || '',
          matriz: nomeEmpresa ? getValorMatrizPorEmpresa(nomeEmpresa) : '',
          adquirente: 'SIPAG',
          status: ''
        }

        for (const [idxStr, campoDb] of Object.entries(colunas)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_venda':
              r.data_venda = formatarData(valor)
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
            case 'status':
              r.status = valor != null ? String(valor).trim() : ''
              break
            case 'prazo_recebimento':
              r.previsao_pgto = formatarData(valor)
              break
            default:
              break
          }
        }

        r.numero_parcelas = Math.max(1, r.numero_parcelas || 1)
        r.despesa_mdr = Math.abs(r.despesa_mdr || 0)

        if (!r.despesa_mdr && r.valor_bruto && r.valor_liquido) {
          r.despesa_mdr = Math.abs((r.valor_bruto || 0) - (r.valor_liquido || 0))
        }

        if (!r.valor_liquido && r.valor_bruto) {
          r.valor_liquido = Math.max(0, (r.valor_bruto || 0) - (r.despesa_mdr || 0))
        }

        if (!r.taxa_mdr && r.valor_bruto) {
          r.taxa_mdr = r.valor_bruto !== 0 ? Math.abs(r.valor_bruto - r.valor_liquido) / r.valor_bruto : 0
        }

        const statusNorm = normalizar(r.status).toLowerCase()
        const aprovado = statusNorm.includes('processad')
          || statusNorm.includes('aprov')
          || statusNorm.includes('conclu')
          || statusNorm.includes('efetiv')
          || statusNorm.includes('pago')

        const valido = Boolean(r.nsu) && ((r.valor_bruto !== 0) || (r.valor_liquido !== 0)) && aprovado
        if (!valido) continue

        if (r.numero_parcelas > 1) {
          const partes = splitRegistroEmParcelas(r, r.numero_parcelas)
          partes.forEach(parte => out.push(parte))
        } else {
          out.push(r)
        }
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

  const mapearColunas = (headersNorm, aliasesMap) => {
    const colunas = {}
    Object.entries(aliasesMap).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colunas[idx] = campoDb
    })
    return colunas
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
      'FORMA DE PAGAMENTO',
      'NUMERO DA AUTORIZACAO',
      'VALOR PARCELA BRUTO',
      'VALOR PARCELA LIQUIDO',
      'DESCONTO PARCELA',
      'PARCELA',
      'BANDEIRA',
      'STATUS',
      'DATA PREVISTA DE LIQUIDACAO'
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
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      }
      if (yyyymmdd.test(first)) return first
      return first
    } catch {
      return null
    }
  }

  const formatarValor = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.0
    try {
      if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0.0
      const texto = String(valor).trim().replace(/\u00A0/g, ' ').replace(/\s/g, '').replace(/R\$/gi, '').replace(/%/g, '')

      if (texto.includes(',') && texto.includes('.')) {
        const normalizado = texto.replace(/\./g, '').replace(',', '.')
        const n = parseFloat(normalizado)
        return Number.isFinite(n) ? n : 0.0
      }

      if (texto.includes(',')) {
        const normalizado = texto.replace(',', '.')
        const n = parseFloat(normalizado)
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
    const matchFracionado = texto.match(/(\d+)\s*\/\s*(\d+)/)
    if (matchFracionado) {
      return Math.max(0, parseInt(matchFracionado[2], 10) || 0)
    }

    const numeros = texto.match(/\d+/g)
    if (!numeros?.length) return 0
    return Math.max(0, parseInt(numeros[numeros.length - 1], 10) || 0)
  }

  const splitRegistroEmParcelas = (registro, parcelas) => {
    const quantidade = Math.max(1, Math.trunc(parcelas || 1))
    if (quantidade <= 1) return [registro]

    const brutoParcela = (registro.valor_bruto || 0) / quantidade
    const liquidoParcela = (registro.valor_liquido || 0) / quantidade
    const despesaParcela = (registro.despesa_mdr || 0) / quantidade
    const antecipacaoParcela = (registro.despesa_antecipacao || 0) / quantidade

    return Array.from({ length: quantidade }, (_, index) => ({
      ...registro,
      nsu: registro.nsu ? `${registro.nsu}-${index + 1}/${quantidade}` : '',
      valor_bruto: brutoParcela,
      valor_liquido: liquidoParcela,
      despesa_mdr: despesaParcela,
      despesa_antecipacao: antecipacaoParcela,
      valor_liquido_antecipacao: brutoParcela - antecipacaoParcela,
      numero_parcelas: quantidade
    }))
  }

  return { processarArquivoComPython }
}
