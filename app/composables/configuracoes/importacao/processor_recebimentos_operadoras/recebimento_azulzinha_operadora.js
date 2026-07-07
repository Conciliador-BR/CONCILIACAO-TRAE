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

export const useRecebimentosOperadoraAzulzinha = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()

  async function getXLSX() {
    const mod = await import('xlsx')
    return mod
  }

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'azulzinha') {
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

  const processarDados = (workbookJson, nomeEmpresa) => {
    const erros = []
    const out = []
    if (!Array.isArray(workbookJson) || workbookJson.length === 0) {
      return { dados: [], total: 0, erros: ['Arquivo vazio.'] }
    }

    let rowsAlvo = []
    for (const sheet of workbookJson) {
      const rows = sheet?.rows || []
      const tentativa = detectarLinhaCabecalho(rows)
      if (tentativa.headersNorm && tentativa.headersNorm.length > 0) {
        rowsAlvo = rows
        break
      }
    }

    if (rowsAlvo.length === 0 && workbookJson[0]?.rows?.length) {
      rowsAlvo = workbookJson[0].rows
    }

    const processado = processarLancamentos(rowsAlvo, nomeEmpresa)
    out.push(...processado.dados)
    erros.push(...processado.erros)

    return { dados: out, total: out.length, erros }
  }

  const processarLancamentos = (dados, nomeEmpresa) => {
    const erros = []
    const out = []
    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(dados)
    if (!headersNorm || headersNorm.length === 0) {
      return { dados: [], erros: ['Cabeçalhos da Azulzinha não encontrados.'] }
    }

    const ALIASES = {
      data_venda: [
        'DATA DA VENDA',
        'DATA VENDA',
        'DATA',
        'DATA DA VENDA PARCELA ORIGINAL',
        'DATA VENDA PARCELA ORIGINAL',
        'DATA DA VENDA ORIGINAL',
        'DATA VENDA ORIGINAL',
        'DATA ORIGINAL DA VENDA',
        'DATA DA COMPRA',
        'DATA COMPRA',
        'DATA DA TRANSACAO',
        'DATA TRANSACAO',
        'DATA TRANSAÇÃO'
      ],
      data_recebimento: ['DATA DO RECEBIMENTO', 'DATA RECEBIMENTO', 'DATA DE PAGAMENTO'],
      modalidade: ['MODALIDADE', 'PRODUTO'],
      nsu: ['CODIGO DE AUTORIZACAO', 'CÓDIGO DE AUTORIZAÇÃO'],
      valor_bruto: ['BRUTO DA PARCELA'],
      valor_liquido: ['LIQUIDO DA VENDA', 'LÍQUIDO DA VENDA'],
      despesa_mdr: ['DESCONTO MDR'],
      numero_parcelas: ['NÚMERO DE PARCELAS', 'NUMERO DE PARCELAS', 'PARCELAS'],
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
      return { dados: [], erros: ['Azulzinha: colunas essenciais ausentes.'] }
    }

    for (let i = headerRowIdx + 1; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) {
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
          adquirente: 'AZULZINHA',
          tipo: 'pagamento'
        }

        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_venda':
              r.data_venda = formatarData(valor)
              break
            case 'data_recebimento':
              r.data_recebimento = formatarData(valor)
              break
            case 'valor_bruto':
            case 'valor_liquido':
            case 'despesa_mdr':
              r[campoDb] = formatarValor(valor)
              break
            case 'numero_parcelas':
              r.numero_parcelas = formatarParcelas(valor)
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

        const modalidadeNorm = normalizar(r.modalidade).toLowerCase()
        const isAluguel = modalidadeNorm.includes('aluguel') || modalidadeNorm.includes('cobranca de aluguel') || modalidadeNorm.includes('cobrança de aluguel')

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
          r.modalidade = r.modalidade || 'ALUGUEL'
          r.valor_bruto = 0
          r.valor_liquido = 0
          r.taxa_mdr = 0
          r.despesa_mdr = -valorAluguel
        } else {
          r.despesa_mdr = Math.abs(r.despesa_mdr || 0)
          if (!r.despesa_mdr && r.valor_bruto && r.valor_liquido) {
            r.despesa_mdr = Math.abs((r.valor_bruto || 0) - (r.valor_liquido || 0))
          }
          r.taxa_mdr = (r.valor_bruto && r.valor_bruto !== 0) ? (r.despesa_mdr / r.valor_bruto) : 0
        }

        const valido = ((r.valor_bruto !== 0) || (r.valor_liquido !== 0) || (r.despesa_mdr !== 0))
        if (valido) {
          out.push(r)
        }
      } catch (e) {
        erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`)
      }
    }

    return { dados: out, erros }
  }

  const lerArquivo = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await getXLSX()
        const data = new Uint8Array(e.target.result)
        const nomeArquivo = String(file?.name || '').toLowerCase()
        const ehCsv = nomeArquivo.endsWith('.csv')
        const workbook = XLSX.read(data, { type: 'array', raw: ehCsv, cellDates: false })
        const result = workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name]
          let rows = []

          if (ehCsv) {
            rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: '' })
          } else {
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
            for (let row = range.s.r; row <= range.e.r; row++) {
              const linha = []
              for (let col = range.s.c; col <= range.e.c; col++) {
                const endereco = XLSX.utils.encode_cell({ r: row, c: col })
                const celula = worksheet[endereco]
                if (!celula) {
                  linha.push(undefined)
                  continue
                }
                const formatoCelula = String(celula.z || '').toLowerCase()
                const textoCelula = celula.w ?? ''
                const pareceDataFormatada = (
                  celula.t === 'n' &&
                  /[dmy]/.test(formatoCelula) &&
                  /[\/-]/.test(String(textoCelula || ''))
                )
                linha.push(pareceDataFormatada ? celula.v : (celula.w ?? celula.v))
              }
              rows.push(linha)
            }
          }

          return { name, rows }
        })
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

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

  const formatarParcelas = (valor) => {
    if (valor === undefined || valor === null || valor === '' || valor === '-') return 0
    if (typeof valor === 'number') return Number.isFinite(valor) ? Math.trunc(valor) : 0
    const texto = String(valor).trim().toUpperCase()
    if (texto === '-' || texto === '0/0') return 0
    const matchFracao = texto.match(/^(\d+)\s*\/\s*(\d+)$/)
    if (matchFracao) {
      const total = parseInt(matchFracao[2], 10)
      return Number.isFinite(total) ? total : 0
    }
    const matchNumero = texto.match(/-?\d+/)
    if (!matchNumero) return 0
    const n = parseInt(matchNumero[0], 10)
    return Number.isFinite(n) ? n : 0
  }

  const detectarLinhaCabecalho = (matriz, maxLinhas = 30) => {
    const candidatos = [
      'DATA DA VENDA',
      'DATA DO RECEBIMENTO',
      'MODALIDADE',
      'CODIGO DE AUTORIZACAO',
      'BRUTO DA PARCELA',
      'LIQUIDO DA VENDA',
      'DESCONTO MDR',
      'NÚMERO DE PARCELAS',
      'NUMERO DE PARCELAS',
      'PARCELAS',
      'BANDEIRA'
    ]

    let melhorIdx = -1
    let melhorScore = -1

    for (let i = 0; i < Math.min(matriz.length, maxLinhas); i++) {
      const row = matriz[i] || []
      const headersNorm = row.map(normalizar)
      const score = candidatos.reduce((acc, item) => acc + (headersNorm.includes(item) ? 1 : 0), 0)
      if (score > melhorScore) {
        melhorScore = score
        melhorIdx = i
      }
      if (score >= 4) return { idx: i, headersNorm }
    }

    const idx = melhorIdx !== -1 ? melhorIdx : 0
    const row = matriz[idx] || []
    return { idx, headersNorm: melhorScore > 0 ? row.map(normalizar) : [] }
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

  return { processarArquivoComPython }
}
