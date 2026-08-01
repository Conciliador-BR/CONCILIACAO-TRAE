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

export const useRecebimentosOperadoraSicredi = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      if ((operadora || '').toLowerCase() !== 'sicredi') {
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
      data_venda: ['DATA DA VENDA', 'DATA VENDA', 'DATA'],
      data_recebimento: ['DATA DE PAGAMENTO', 'DATA PAGAMENTO', 'DATA DO PAGAMENTO', 'DATA RECEBIMENTO', 'DATA DO RECEBIMENTO'],
      modalidade: ['MODALIDADE', 'PRODUTO'],
      nsu: ['CODIGO DE AUTORIZACAO', 'CÓDIGO DE AUTORIZAÇÃO', 'CODIGO AUTORIZACAO', 'NSU'],
      valor_bruto: ['BRUTO DA PARCELA', 'VALOR BRUTO DA PARCELA', 'VALOR BRUTO'],
      valor_liquido: ['LIQUIDO DA VENDA', 'LÍQUIDO DA VENDA', 'VALOR LIQUIDO', 'VALOR LÍQUIDO'],
      despesa_mdr: ['DESCONTO MDR', 'VALOR DESCONTO MDR', 'MDR'],
      numero_parcelas: ['PARCELAS', 'PARCELA', 'NUMERO DE PARCELAS', 'NÚMERO DE PARCELAS'],
      bandeira: ['BANDEIRA', 'ARRANJO']
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
          adquirente: 'SICREDI'
        }
        let parcelasRaw = ''

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
              parcelasRaw = valor != null ? String(valor).trim() : ''
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
        r.numero_parcelas = formatarParcelas(parcelasRaw, r.modalidade)

        const modalidadeNorm = normalizarTextoLivre(r.modalidade)
        const isAluguel = isLinhaAluguelSicredi(modalidadeNorm)

        if (isAluguel) {
          const brutoOriginal = Number(r.valor_bruto || 0)
          const liquidoOriginal = Number(r.valor_liquido || 0)
          const descontoOriginal = Number(r.despesa_mdr || 0)
          const fallbackOriginal = brutoOriginal !== 0 || liquidoOriginal !== 0
            ? (brutoOriginal - liquidoOriginal)
            : 0
          const valorAluguel = (
            descontoOriginal !== 0 ? descontoOriginal
            : brutoOriginal !== 0 ? brutoOriginal
            : liquidoOriginal !== 0 ? liquidoOriginal
            : fallbackOriginal
          ) || 0

          // No Sicredi, "Cobranca de Aluguel" e "Outros Ajustes" devem seguir
          // o mesmo fluxo de despesa com aluguel de maquininha.
          r.modalidade = 'ALUGUEL'
          r.valor_bruto = 0
          r.valor_liquido = 0
          r.taxa_mdr = 0
          // No Sicredi, cobranca e compensacao de aluguel podem vir com sinais opostos.
          // Preservar o sinal evita transformar -15 e +15 em dois lancamentos positivos.
          r.despesa_mdr = valorAluguel
        } else {
          r.despesa_mdr = Math.abs(r.despesa_mdr || 0)
          if (!r.despesa_mdr && r.valor_bruto && r.valor_liquido) {
            r.despesa_mdr = Math.abs((r.valor_bruto || 0) - (r.valor_liquido || 0))
          }
          r.taxa_mdr = (r.valor_bruto && r.valor_bruto !== 0)
            ? (Math.abs((r.valor_bruto || 0) - (r.valor_liquido || 0)) / Math.abs(r.valor_bruto))
            : 0
        }

        const valido = (
          r.valor_bruto !== 0 ||
          r.valor_liquido !== 0 ||
          r.despesa_mdr !== 0
        ) && (isAluguel || Boolean(r.nsu))

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

  const normalizarTextoLivre = (valor) => {
    if (valor == null) return ''
    return String(valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  const isLinhaAluguelSicredi = (modalidadeNorm) => {
    if (!modalidadeNorm) return false
    return (
      modalidadeNorm.includes('ALUGUEL') ||
      (modalidadeNorm.includes('COBRAN') && modalidadeNorm.includes('ALUGUEL')) ||
      modalidadeNorm === 'OUTROS AJUSTES' ||
      modalidadeNorm === 'OUTRO AJUSTE'
    )
  }

  const findIndexByAliases = (headersNorm, aliasesNorm) => {
    for (const alias of aliasesNorm) {
      const idx = headersNorm.indexOf(alias)
      if (idx >= 0) return idx
    }
    for (const alias of aliasesNorm) {
      const idx = headersNorm.findIndex(header => String(header || '').includes(alias))
      if (idx >= 0) return idx
    }
    return -1
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas = 30) => {
    const candidatos = [
      'DATA DA VENDA',
      'DATA DE PAGAMENTO',
      'MODALIDADE',
      'PRODUTO',
      'CODIGO DE AUTORIZACAO',
      'BRUTO DA PARCELA',
      'LIQUIDO DA VENDA',
      'DESCONTO MDR',
      'PARCELAS',
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
      let s = String(valor)
        .replace(/\u00A0/g, ' ')
        .replace(/\s/g, '')
        .replace(/R\$/gi, '')
        .replace(/%/g, '')
        .replace(/[−–—]/g, '-')
        .trim()

      let negativo = false
      if (/^\(.*\)$/.test(s)) {
        negativo = true
        s = s.slice(1, -1)
      }
      if (s.startsWith('-')) {
        negativo = true
        s = s.slice(1)
      }

      const temVirgula = s.includes(',')
      const temPonto = s.includes('.')

      if (temVirgula && temPonto) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
          s = s.replace(/\./g, '').replace(',', '.')
        } else {
          s = s.replace(/,/g, '')
        }
      } else if (temVirgula) {
        s = s.replace(/\./g, '').replace(',', '.')
      } else if (temPonto) {
        const partes = s.split('.')
        if (partes.length > 2) {
          const decimal = partes.pop()
          s = `${partes.join('')}.${decimal}`
        }
      }

      const n = parseFloat(s)
      if (!Number.isFinite(n)) return 0.0
      return negativo ? -n : n
    } catch {
      return 0.0
    }
  }

  const formatarParcelas = (valor, modalidade = '') => {
    if (valor === undefined || valor === null || valor === '') return 0

    const texto = String(valor).trim().toUpperCase()
    const modalidadeNorm = normalizarTextoLivre(modalidade)

    if (texto === '-') {
      if (modalidadeNorm.includes('DEBIT')) return 0
      if (modalidadeNorm.includes('CREDITO A VISTA') || modalidadeNorm.includes('CREDITO')) return 1
      return 0
    }

    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? Math.trunc(valor) : 0
    }

    const matchFracao = texto.match(/^(\d+)\s*\/\s*(\d+)$/)
    if (matchFracao) {
      const parcelaAtual = parseInt(matchFracao[1], 10)
      return Number.isFinite(parcelaAtual) ? parcelaAtual : 0
    }

    const matchNumero = texto.match(/-?\d+/)
    if (!matchNumero) return 0
    const n = parseInt(matchNumero[0], 10)
    return Number.isFinite(n) ? n : 0
  }

  return { processarArquivoComPython }
}
