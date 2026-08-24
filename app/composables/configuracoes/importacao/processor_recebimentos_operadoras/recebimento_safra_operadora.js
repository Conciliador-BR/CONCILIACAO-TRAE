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

export const useRecebimentosOperadoraSafra = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()
  const BANDEIRAS_VOUCHER_SAFRA = ['VISA', 'ELO', 'MASTERCARD', 'MASTER', 'AMEX', 'HIPERCARD']
  const ALIASES_MODELO_ANTIGO = {
    data_venda: ['DT VENDA', 'DATA DA VENDA', 'DATA VENDA', 'DATA'],
    data_recebimento: ['DATA DO PAGAMENTO', 'DATA PAGAMENTO', 'DATA RECEBIMENTO', 'DATA DE PAGAMENTO'],
    modalidade: ['MODALIDADE', 'FORMA DE PAGAMENTO'],
    nsu: ['NUMERO SEQUENCIAL UNICO', 'NÚMERO SEQUENCIAL ÚNICO', 'NSU', 'N S U'],
    valor_bruto: ['VALOR BRUTO DA VENDA', 'VALOR BRUTO', 'VALOR DA VENDA'],
    valor_liquido: ['VALOR LIQUIDO DA VENDA', 'VALOR LÍQUIDO DA VENDA', 'VALOR LIQUIDO', 'VALOR LÍQUIDO'],
    parcelas: ['PARCELAS', 'N DE PARCELAS', 'NUMERO PARCELAS', 'NÚMERO PARCELAS'],
    bandeira: ['BANDEIRA', 'BANDEIRAS'],
    valor_antecipacao: ['VALOR ANTECIPACAO', 'VALOR ANTECIPAÇÃO', 'VALOR DA ANTECIPACAO', 'VALOR DA ANTECIPAÇÃO', 'VALOR ANTECIPADO'],
    despesa_antecipacao: ['DESCONTO DE ANTECIPACAO', 'DESCONTO DE ANTECIPAÇÃO', 'DESPESA COM ANTECIPACAO', 'DESPESA COM ANTECIPAÇÃO', 'DESPESA ANTECIPACAO', 'DESPESA ANTECIPAÇÃO'],
    valor_liquido_antecipacao: ['VALOR LIQUIDO ANTECIPACAO', 'VALOR LÍQUIDO ANTECIPAÇÃO', 'VALOR LIQUIDO RECEBIDO ANTECIPACAO', 'VALOR LÍQUIDO RECEBIDO ANTECIPAÇÃO']
  }
  const ALIASES_MODELO_NOVO = {
    data_venda: ['DT VENDA', 'DATA DA VENDA', 'DATA VENDA', 'DATA'],
    data_recebimento: ['DT EFETIVA'],
    modalidade: ['MODALIDADE', 'FORMA DE PAGAMENTO'],
    nsu: ['NUMERO SEQUENCIAL UNICO', 'NÚMERO SEQUENCIAL ÚNICO', 'NSU', 'N S U'],
    valor_bruto: ['VALOR BRUTO PARC.', 'VALOR BRUTO PARC'],
    valor_liquido: ['VALOR LIQUIDO DA VENDA', 'VALOR LÍQUIDO DA VENDA', 'VALOR LIQUIDO', 'VALOR LÍQUIDO'],
    parcelas: ['PL'],
    bandeira: ['PRODUTO'],
    valor_antecipacao: ['VALOR LIQUIDO'],
    despesa_antecipacao: ['DESC ANTC'],
    valor_liquido_antecipacao: ['VALOR RECEBIDO'],
    despesa_mdr: ['DESC MDR'],
    taxa_mdr: ['TXADM']
  }
  const ALIASES_AJUSTES_SAFRA = {
    data_venda: ['DT AJUSTE', 'DATA DO AJUSTE', 'DATA AJUSTE'],
    bandeira: ['DESCRICAO DO AJUSTE', 'DESCRIÇÃO DO AJUSTE', 'DESCRICAO AJUSTE', 'DESCRIÇÃO AJUSTE'],
    dc: ['D/C', 'DC', 'C/D'],
    valor_ajuste: ['VALOR DO AJUSTE', 'VALOR AJUSTE', 'VALOR', 'VALOR TOTAL DO AJUSTE', 'VALOR TOTAL']
  }

  async function getXLSX() {
    const mod = await import('xlsx')
    return mod
  }

  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '', options = {}) => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'safra') {
        throw new Error(`Operadora '${operadora}' não suportada por este processador.`)
      }
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }
      const modeloArquivo = options?.modeloArquivo === 'novo' ? 'novo' : 'antigo'
      const tipoArquivo = options?.tipoArquivo === 'ajustes' ? 'ajustes' : 'recebimento'
      const resultado = await processarDados(dados, nomeEmpresa, operadora, modeloArquivo, tipoArquivo)
      return { sucesso: true, registros: resultado.dados, total: resultado.total, erros: resultado.erros }
    } catch (error) {
      return { sucesso: false, erro: error.message, registros: [], total: 0, erros: [error.message] }
    }
  }

  const processarDados = async (dados, nomeEmpresa, operadora, modeloArquivo = 'antigo', tipoArquivo = 'recebimento') => {
    if (modeloArquivo === 'novo' && tipoArquivo === 'ajustes') {
      return processarDadosAjustes(dados, nomeEmpresa)
    }

    const erros = []
    const out = []
    if (!Array.isArray(dados) || dados.length === 0) {
      return { dados: [], total: 0, erros: ['Arquivo vazio.'] }
    }
    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(dados, modeloArquivo)
    if (!headersNorm || headersNorm.length === 0) {
      return { dados: [], total: 0, erros: ['Cabeçalhos não encontrados.'] }
    }
    const ALIASES = modeloArquivo === 'novo' ? ALIASES_MODELO_NOVO : ALIASES_MODELO_ANTIGO
    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) {
        if (!Array.isArray(colIndexParaCampo[idx])) colIndexParaCampo[idx] = []
        colIndexParaCampo[idx].push(campoDb)
      }
    })
    const chavesMin = ['valor_bruto', 'valor_liquido', 'nsu']
    const camposMapeados = Object.values(colIndexParaCampo).flat()
    const temAlgumaChave = chavesMin.some(k => camposMapeados.includes(k))
    if (!temAlgumaChave) {
      return { dados: [], total: 0, erros: ['Nenhuma coluna essencial foi mapeada a partir dos cabeçalhos.'] }
    }
    const inicio = headerRowIdx + 1
    for (let i = inicio; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue
      try {
        const r = {
          data_venda: null,
          data_recebimento: null,
          modalidade: '',
          nsu: '',
          valor_bruto: 0.0,
          valor_liquido: 0.0,
          taxa_mdr: 0.0,
          taxa_mdr_informada: false,
          despesa_mdr: 0.0,
          despesa_mdr_informada: false,
          numero_parcelas: 0,
          bandeira: '',
          valor_antecipacao: 0.0,
          despesa_antecipacao: 0.0,
          valor_liquido_antecipacao: 0.0,
          empresa: '',
          matriz: '',
          adquirente: 'SAFRA'
        }
        for (const [idxStr, camposDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          for (const campoDb of camposDb) {
            switch (campoDb) {
              case 'data_venda':
                r.data_venda = formatarData(valor)
                break
              case 'data_recebimento':
                r.data_recebimento = formatarData(valor)
                break
              case 'valor_bruto':
              case 'valor_liquido':
                r[campoDb] = formatarValor(valor)
                break
              case 'valor_antecipacao':
                r.valor_antecipacao = formatarValor(valor)
                break
              case 'despesa_antecipacao': {
                const v = formatarValor(valor)
                r.despesa_antecipacao = Math.abs(v)
                break
              }
              case 'valor_liquido_antecipacao':
                r.valor_liquido_antecipacao = formatarValor(valor)
                break
              case 'despesa_mdr':
                r.despesa_mdr = Math.abs(formatarValor(valor))
                r.despesa_mdr_informada = r.despesa_mdr > 0
                break
              case 'taxa_mdr':
                r.taxa_mdr = formatarPercentualMdr(valor)
                r.taxa_mdr_informada = r.taxa_mdr > 0
                break
              case 'parcelas':
                r.numero_parcelas = formatarInteiro(valor)
                break
              case 'modalidade':
              case 'bandeira':
                r[campoDb] = valor != null ? String(valor).trim() : ''
                break
              case 'nsu':
                r.nsu = limparNsu(valor)
                break
              default:
                break
            }
          }
        }
        // Normalizar modalidade para PARCELADO quando crédito com 2 a 6 parcelas
        const modRaw = (r.modalidade || '').toString()
        const modNorm = normalizar(modRaw).toLowerCase()
        const bandeiraNorm = normalizar(r.bandeira)
        const np = parseInt(r.numero_parcelas) || 0
        if (
          modNorm.includes('creditode2a6parcelas') ||
          (modNorm.includes('credito') && modNorm.includes('parcelas')) ||
          (np >= 2 && np <= 6)
        ) {
          r.modalidade = 'PARCELADO'
        }
        const vb = r.valor_bruto || 0
        const vl = r.valor_liquido || 0
        const dm = Math.abs(vb - vl)
        if (!r.despesa_mdr_informada) {
          r.despesa_mdr = dm
        }
        if (!r.taxa_mdr_informada) {
          r.taxa_mdr = vb && vb !== 0 ? (r.despesa_mdr / vb) : 0
        }
        r.valor_antecipacao = r.valor_antecipacao || 0.0
        r.despesa_antecipacao = Math.abs(r.despesa_antecipacao || 0.0)
        r.valor_liquido_antecipacao = r.valor_liquido_antecipacao || 0.0
        if (nomeEmpresa) {
          r.empresa = nomeEmpresa
          r.matriz = getValorMatrizPorEmpresa(nomeEmpresa)
        }
        const isVoucher = modNorm.includes('voucher') || modNorm.includes('vouchers')
        const voucherElegivel = isVoucher && possuiBandeiraVoucherSafra(bandeiraNorm)
        const produtoPermitido = !isVoucher || voucherElegivel
        const valido = ((vb !== 0) || (vl !== 0)) && produtoPermitido
        if (valido) {
          const { taxa_mdr_informada, despesa_mdr_informada, ...registroFinal } = r
          out.push(registroFinal)
        }
      } catch (e) {
        erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`)
      }
    }
    return { dados: out, total: out.length, erros }
  }

  const processarDadosAjustes = (dados, nomeEmpresa) => {
    const erros = []
    if (!Array.isArray(dados) || dados.length === 0) {
      return { dados: [], total: 0, erros: ['Arquivo vazio.'] }
    }

    const { idx: headerRowIdx, headersNorm } = detectarLinhaCabecalho(dados, 'novo', 'ajustes')
    if (!headersNorm || headersNorm.length === 0) {
      return { dados: [], total: 0, erros: ['Cabeçalhos de ajustes não encontrados.'] }
    }

    const colIndexParaCampo = {}
    Object.entries(ALIASES_AJUSTES_SAFRA).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })

    const camposMapeados = Object.values(colIndexParaCampo)
    const temCamposEssenciais = ['data_venda', 'bandeira', 'valor_ajuste'].every(campo => camposMapeados.includes(campo))
    if (!temCamposEssenciais) {
      return { dados: [], total: 0, erros: ['Nenhuma coluna essencial de ajustes foi mapeada.'] }
    }

    let totalAluguel = 0.0
    let totalCreditosCompensacao = 0.0
    let totalSaldoAnterior = 0.0
    let ultimaDataRelevante = null

    for (let i = headerRowIdx + 1; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) continue

      try {
        let dc = ''
        let dataAjuste = null
        let descricaoAjuste = ''
        let valorAjuste = 0

        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]
          switch (campoDb) {
            case 'data_venda':
              dataAjuste = formatarDataAjusteSafra(valor)
              break
            case 'bandeira':
              descricaoAjuste = valor != null ? String(valor).trim() : ''
              break
            case 'dc':
              dc = valor != null ? String(valor).trim() : ''
              break
            case 'valor_ajuste':
              valorAjuste = formatarValor(valor)
              break
            default:
              break
          }
        }

        const valorNormalizado = Math.abs(formatarValor(valorAjuste))
        if (!valorNormalizado) continue

        const classificacao = classificarAjusteSafra(descricaoAjuste)
        if (!classificacao) continue

        if (dataAjuste) ultimaDataRelevante = dataAjuste

        if (classificacao === 'aluguel') {
          totalAluguel += valorNormalizado
          continue
        }

        if (classificacao === 'saldo_anterior') {
          totalSaldoAnterior += aplicarSinalSaldoAnteriorSafra(valorNormalizado, dc)
          continue
        }

        totalCreditosCompensacao += valorNormalizado
      } catch (e) {
        erros.push(`Ajustes linha ${i + 1}: ${e?.message || String(e)}`)
      }
    }

    const despesaLiquidaAluguel = Number(((totalAluguel - totalCreditosCompensacao) + totalSaldoAnterior).toFixed(2))
    const out = []

    if (Math.abs(despesaLiquidaAluguel) > 0.0001) {
      out.push(criarRegistroFinalAjusteSafra({
        data: ultimaDataRelevante,
        nomeEmpresa,
        valorLiquido: despesaLiquidaAluguel
      }))
    }

    return { dados: out, total: out.length, erros }
  }

  const lerArquivo = (file) => new Promise((resolve, reject) => {
    const isCsv = /\.csv$/i.test(file?.name || '') || String(file?.type || '').toLowerCase().includes('csv')
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        if (isCsv) {
          const text = String(e.target?.result || '')
          resolve(parseCsvText(text))
          return
        }

        const XLSX = await getXLSX()
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
        const jsonData = []

        for (let row = range.s.r; row <= range.e.r; row++) {
          const linha = []
          for (let col = range.s.c; col <= range.e.c; col++) {
            const endereco = XLSX.utils.encode_cell({ r: row, c: col })
            const celula = worksheet[endereco]
            if (!celula) {
              linha.push(undefined)
              continue
            }
            linha.push(celula.w ?? celula.v ?? '')
          }
          jsonData.push(linha)
        }

        resolve(jsonData)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject

    if (isCsv) {
      reader.readAsText(file, 'utf-8')
      return
    }

    reader.readAsArrayBuffer(file)
  })

  const parseCsvText = (text) => {
    const bruto = String(text || '').replace(/^\uFEFF/, '')
    const linhas = bruto.split(/\r\n|\n|\r/)
    const primeiraLinhaComConteudo = linhas.find(linha => linha.trim()) || ''
    const delimiter = detectarDelimitadorCsv(primeiraLinhaComConteudo)
    return linhas
      .filter(linha => linha !== '')
      .map(linha => parseCsvLine(linha, delimiter))
  }

  const detectarDelimitadorCsv = (linha) => {
    const semicolonCount = (linha.match(/;/g) || []).length
    const commaCount = (linha.match(/,/g) || []).length
    return semicolonCount >= commaCount ? ';' : ','
  }

  const parseCsvLine = (line, delimiter) => {
    const valores = []
    let atual = ''
    let emAspas = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (emAspas && nextChar === '"') {
          atual += '"'
          i++
        } else {
          emAspas = !emAspas
        }
        continue
      }

      if (char === delimiter && !emAspas) {
        valores.push(atual.trim())
        atual = ''
        continue
      }

      atual += char
    }

    valores.push(atual.trim())
    return valores
  }

  const normalizar = (s) => {
    if (s == null) return ''
    return s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
  }

  const formatarData = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    if (typeof valor === 'number') return excelSerialToISO(valor)
    const s = String(valor).trim()
    if (/^\d+(?:[.,]\d+)?$/.test(s)) {
      const serial = Number(String(s).replace(',', '.'))
      if (Number.isFinite(serial)) return excelSerialToISO(serial)
    }
    const firstChunk = s.split(/[T\s]+/)[0]
    if (firstChunk && /^\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4}$/.test(firstChunk)) {
      const [dia, mes, ano] = firstChunk.split(/[\/\.]/)
      return `${ano}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`
    }
    if (firstChunk && /^\d{4}-\d{2}-\d{2}$/.test(firstChunk)) return firstChunk
    const ddmmyyyyH = /^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})\s+(\d{1,2})[:\.](\d{2})(?:[:\.](\d{2}))?$/
    const ddmmyyyy = /^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/
    const yyyymmddH = /^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})\s+(\d{1,2})[:\.](\d{2})(?:[:\.](\d{2}))?$/
    const yyyymmdd = /^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/
    if (ddmmyyyyH.test(s)) {
      const [, d, m, y] = s.match(ddmmyyyyH)
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
    if (ddmmyyyy.test(s)) {
      const [, d, m, y] = s.match(ddmmyyyy)
      return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
    }
    if (yyyymmddH.test(s)) {
      const [, y, m, d] = s.match(yyyymmddH)
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
    if (yyyymmdd.test(s)) {
      const [, y, m, d] = s.match(yyyymmdd)
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
    return null
  }

  const limparNsu = (valor) => {
    if (valor === undefined || valor === null) return ''
    return String(valor).trim().replace(/^'+/, '').trim()
  }

  const formatarValor = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.0
    try {
      if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0.0
      const n = parseNumeroDecimalFlexivel(valor)
      return Number.isFinite(n) ? n : 0.0
    } catch { return 0.0 }
  }

  const formatarPercentualMdr = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.0
    try {
      if (typeof valor === 'number') {
        if (!Number.isFinite(valor)) return 0.0
        if (valor > 1) return valor / 100
        const casasDecimais = countDecimalPlaces(valor)
        return casasDecimais > 2 ? valor : valor / 100
      }

      const textoOriginal = String(valor).trim()
      if (!textoOriginal) return 0.0
      const tinhaPercentual = textoOriginal.includes('%')
      const numero = parseNumeroDecimalFlexivel(textoOriginal)
      if (!Number.isFinite(numero) || numero === 0) return 0.0
      if (tinhaPercentual || numero > 1) return numero / 100
      const casasDecimais = countDecimalPlaces(textoOriginal)
      return casasDecimais > 2 ? numero : numero / 100
    } catch {
      return 0.0
    }
  }

  const countDecimalPlaces = (valor) => {
    const texto = String(valor).trim().replace(',', '.')
    if (!texto.includes('.')) return 0
    return texto.split('.')[1]?.length || 0
  }

  const parseNumeroDecimalFlexivel = (valor) => {
    const texto = String(valor || '')
      .replace(/\u00A0/g, ' ')
      .replace(/\s/g, '')
      .replace(/%/g, '')
      .replace(/R\$/gi, '')
      .trim()

    if (!texto) return 0.0

    const lastComma = texto.lastIndexOf(',')
    const lastDot = texto.lastIndexOf('.')

    if (lastComma >= 0 && lastDot >= 0) {
      const separadorDecimal = lastComma > lastDot ? ',' : '.'
      const separadorMilhar = separadorDecimal === ',' ? '.' : ','
      const normalizado = texto
        .split(separadorMilhar).join('')
        .replace(separadorDecimal, '.')
      const numero = parseFloat(normalizado)
      return Number.isFinite(numero) ? numero : 0.0
    }

    if (lastComma >= 0) {
      const numero = parseFloat(texto.replace(',', '.'))
      return Number.isFinite(numero) ? numero : 0.0
    }

    if (lastDot >= 0) {
      const partes = texto.split('.')
      if (partes.length === 2) {
        const numero = parseFloat(texto)
        return Number.isFinite(numero) ? numero : 0.0
      }

      const normalizado = partes.join('')
      const numero = parseFloat(normalizado)
      return Number.isFinite(numero) ? numero : 0.0
    }

    const numero = parseFloat(texto)
    return Number.isFinite(numero) ? numero : 0.0
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

  const formatarDataAjusteSafra = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    const texto = String(valor).trim().replace(/^'+/, '')
    const primeiraParte = texto.split(/[T\s]+/)[0]
    const matchBr = primeiraParte.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/)
    if (matchBr) {
      const [, d, m, y] = matchBr
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
    return formatarData(valor)
  }

  const inferirModalidadeAjusteSafra = (descricao) => {
    const texto = normalizar(descricao)
    if (
      /\bALUG\b/.test(texto) ||
      texto.includes('ALUGUEL') ||
      texto.includes('MENSALIDADE') ||
      texto.includes('PINPAD') ||
      texto.includes('PIN PAD') ||
      texto.includes('MAQUINA') ||
      texto.includes('MAQUININHA') ||
      texto.includes('TERMINAL') ||
      texto.includes('POS')
    ) {
      return 'ALUGUEL DE MAQUINA'
    }
    return 'AJUSTE SAFRA'
  }

  const classificarAjusteSafra = (descricao) => {
    const texto = normalizar(descricao)
    if (!texto) return null
    if (texto.includes('COMPENSACAO DO SALDO ANTERIOR')) return 'saldo_anterior'
    if (inferirModalidadeAjusteSafra(descricao) === 'ALUGUEL DE MAQUINA') return 'aluguel'
    return 'credito_compensacao'
  }

  const aplicarSinalSaldoAnteriorSafra = (valor, dc) => {
    const numero = Math.abs(formatarValor(valor))
    if (!numero) return 0.0
    const tipo = normalizar(dc)
    if (tipo === 'D') return numero
    if (tipo === 'C') return -numero
    return 0.0
  }

  const criarRegistroFinalAjusteSafra = ({ data, nomeEmpresa, valorLiquido }) => {
    const dataFinal = data || '0001-01-01'
    const valorDespesa = Number((-valorLiquido).toFixed(2))
    return {
      data_venda: dataFinal,
      data_recebimento: dataFinal,
      modalidade: 'ALUGUEL DE MAQUINA',
      nsu: `AJUSTE_SAFRA_ALUGUEL_${dataFinal}`,
      valor_bruto: 0.0,
      valor_liquido: 0.0,
      taxa_mdr: 0.0,
      despesa_mdr: valorDespesa,
      numero_parcelas: 0,
      bandeira: 'DESPESA DE ALUGUEL SAFRA',
      valor_antecipacao: 0.0,
      despesa_antecipacao: 0.0,
      valor_liquido_antecipacao: 0.0,
      empresa: nomeEmpresa || '',
      matriz: nomeEmpresa ? getValorMatrizPorEmpresa(nomeEmpresa) : '',
      adquirente: 'SAFRA',
      tipo: 'ajuste'
    }
  }

  const detectarLinhaCabecalho = (matriz, modeloArquivo = 'antigo', tipoArquivo = 'recebimento', maxLinhas = 20) => {
    const candidatos = tipoArquivo === 'ajustes'
      ? ['DT AJUSTE', 'DESCRICAO DO AJUSTE', 'D/C']
      : modeloArquivo === 'novo'
        ? ['DT VENDA', 'DT EFETIVA', 'PRODUTO', 'MODALIDADE', 'NUMERO SEQUENCIAL UNICO', 'VALOR BRUTO PARC.', 'VALOR LIQUIDO DA VENDA', 'PL', 'DESC MDR', 'TXADM']
        : ['DT VENDA', 'DATA DO PAGAMENTO', 'MODALIDADE', 'NUMERO SEQUENCIAL UNICO', 'VALOR BRUTO DA VENDA', 'VALOR LIQUIDO DA VENDA', 'PARCELAS', 'BANDEIRA']
    for (let i = 0; i < Math.min(maxLinhas, matriz.length); i++) {
      const row = matriz[i] || []
      const norm = row.map(normalizar)
      const hits = candidatos.filter(c => norm.includes(c)).length
      if (hits >= (tipoArquivo === 'ajustes' ? 2 : 3)) return { idx: i, headersNorm: norm }
    }
    const i = 0
    const row = matriz[i] || []
    return { idx: i, headersNorm: row.map(normalizar) }
  }

  const findIndexByAliases = (headersNorm, aliases) => {
    for (const a of aliases) { const idx = headersNorm.indexOf(a); if (idx >= 0) return idx }
    for (const a of aliases) { const idx = headersNorm.findIndex(h => h.includes(a)); if (idx >= 0) return idx }
    return -1
  }

  const possuiBandeiraVoucherSafra = (bandeira) => {
    if (!bandeira) return false
    return BANDEIRAS_VOUCHER_SAFRA.includes(bandeira)
  }

  return { processarArquivoComPython }
}
