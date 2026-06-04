import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useCaixaXlsx = () => {
  const processando = ref(false)
  const erro = ref(null)

  const normalizar = (texto) => {
    if (!texto) return ''
    return String(texto)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[._-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const limparTexto = (valor) => {
    return String(valor || '')
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const formatarData = (valor) => {
    if (!valor) return ''

    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      const dia = String(valor.getDate()).padStart(2, '0')
      const mes = String(valor.getMonth() + 1).padStart(2, '0')
      const ano = valor.getFullYear()
      return `${dia}/${mes}/${ano}`
    }

    const texto = String(valor).trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) return texto

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const [ano, mes, dia] = texto.split('-')
      return `${dia}/${mes}/${ano}`
    }

    return texto
  }

  const parseValorBR = (valor) => {
    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : 0
    }

    let texto = String(valor || '').trim()
    if (!texto) return 0

    texto = texto
      .replace(/R\$/gi, '')
      .replace(/\s+/g, '')

    const ultimoIndiceVirgula = texto.lastIndexOf(',')
    const ultimoIndicePonto = texto.lastIndexOf('.')

    if (ultimoIndiceVirgula > ultimoIndicePonto) {
      texto = texto.replace(/\./g, '').replace(',', '.')
    } else {
      texto = texto.replace(/,/g, '')
    }

    texto = texto.replace(/[^0-9.-]/g, '')
    const numero = parseFloat(texto)
    return Number.isFinite(numero) ? numero : 0
  }

  const detectarAdquirente = (descricao) => {
    const texto = normalizar(descricao)
    if (!texto) return ''

    const cartoes = [
      { nome: 'TRIPAG', re: /\bTRIPAG\b/ },
      { nome: 'UNICA', re: /\bUNICA\b/ },
      { nome: 'CIELO', re: /\bCIELO\b/ },
      { nome: 'SIPAG', re: /\bSIPAG\b/ },
      { nome: 'SICREDI', re: /\bSICREDI\b/ },
      { nome: 'REDE', re: /\bREDE(?:CARD)?\b/ },
      { nome: 'STONE', re: /\bSTONE\b/ },
      { nome: 'AZULZINHA', re: /\bAZULZINHA\b/ },
      { nome: 'PAG SEGURO', re: /\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b/ }
    ]

    for (const regra of cartoes) {
      if (regra.re.test(texto)) return regra.nome
    }

    const vouchers = {
      'TICKET SERVICOS SA': ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'],
      'ALELO INSTITUICAO DE PAGAMENTO': ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'],
      'VR BENEFICIOS': ['VR BENEFICIOS', 'VR BENEFICIOS SERV', 'VR BENEF'],
      'LE CARD ADMINISTRADORA': ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'],
      'UP BRASIL ADMINISTRACAO': ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'],
      'PLUXEE BENEFICIOS BRASIL': ['PLUXEE BENEFICIOS BRASIL', 'PLUXEE'],
      'COMPROCARD': ['COMPROCARD'],
      'ECX CARD': ['ECX CARD'],
      'FN CARD': ['FN CARD'],
      'BEN VISA': ['BEN VISA'],
      'CREDSHOP': ['CREDSHOP', 'CRED SHOP'],
      'RC CARD': ['RC CARD'],
      'GOOD CARD': ['GOOD CARD'],
      'BIG CARD': ['BIG CARD'],
      'BK CARD': ['BK CARD'],
      'BRASILCARD': ['BRASILCARD'],
      'BOLTCARD': ['BOLTCARD'],
      'CABAL PRE': ['CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CABAL BRASIL'],
      'VEROCARD': ['VEROCARD'],
      'VEROCHEQUE': ['VEROCHEQUE'],
      'FACECARD': ['FACECARD'],
      'VALE CARD': ['VALE CARD', 'VALECARD', 'AGL ADQUIRENCIA', 'AGL ADQUIRENCIA LTDA'],
      'NAIP': ['NAIP']
    }

    for (const [canonico, aliases] of Object.entries(vouchers)) {
      for (const alias of aliases) {
        if (texto.includes(normalizar(alias))) return canonico
      }
    }

    return ''
  }

  const encontrarLinhaCabecalho = (rows) => {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || []
      const linhaNormalizada = row.map(coluna => normalizar(coluna))
      const temDataMovimento = linhaNormalizada.includes('DATA MOVIMENTO')
      const temHistorico = linhaNormalizada.includes('HISTORICO')
      const temDocumento = linhaNormalizada.includes('DOCUMENTO')
      const temValorLancamento = linhaNormalizada.includes('VALOR LANCAMENTO')

      if (temDataMovimento && temHistorico && temDocumento && temValorLancamento) {
        return i
      }
    }

    return -1
  }

  const obterMapaCabecalho = (headerRow) => {
    const mapa = {}

    headerRow.forEach((coluna, indice) => {
      mapa[normalizar(coluna)] = indice
    })

    return {
      dataMovimento: mapa['DATA MOVIMENTO'],
      historico: mapa['HISTORICO'],
      documento: mapa['DOCUMENTO'],
      valorLancamento: mapa['VALOR LANCAMENTO'],
      nomeRazaoSocial: mapa['NOME/RAZAO SOCIAL'] ?? mapa['NOME RAZAO SOCIAL']
    }
  }

  const processarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null

    try {
      const buffer = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve(event.target.result)
        reader.onerror = () => reject(new Error('Erro ao ler arquivo XLSX'))
        reader.readAsArrayBuffer(arquivo)
      })

      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' })

      const headerIndex = encontrarLinhaCabecalho(rows)
      if (headerIndex === -1) {
        throw new Error('Cabeçalho XLSX da Caixa não identificado')
      }

      const headerRow = rows[headerIndex] || []
      const indices = obterMapaCabecalho(headerRow)

      if (
        indices.dataMovimento == null ||
        indices.historico == null ||
        indices.documento == null ||
        indices.valorLancamento == null
      ) {
        throw new Error('Colunas obrigatórias da Caixa não identificadas')
      }

      const transacoes = []
      let idx = 0

      for (let i = headerIndex + 1; i < rows.length; i += 1) {
        const row = rows[i] || []
        const data = formatarData(row[indices.dataMovimento])
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) continue

        const historico = limparTexto(row[indices.historico])
        const nomeRazaoSocial = indices.nomeRazaoSocial != null
          ? limparTexto(row[indices.nomeRazaoSocial])
          : ''
        const descricao = [historico, nomeRazaoSocial].filter(Boolean).join(' / ')
        const documento = limparTexto(row[indices.documento])
        const valorNumerico = parseValorBR(row[indices.valorLancamento])
        const valor = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(valorNumerico)
        const adquirente = detectarAdquirente(descricao)

        idx += 1
        transacoes.push({
          id: `CAIXAXLSX-${idx}`,
          data,
          descricao,
          documento,
          valor,
          valorNumerico,
          banco: 'Caixa',
          adquirente
        })
      }

      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar XLSX da Caixa'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return {
    processando,
    erro,
    processarXLSX
  }
}
