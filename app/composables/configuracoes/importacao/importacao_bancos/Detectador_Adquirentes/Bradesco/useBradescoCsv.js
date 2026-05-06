import { ref } from 'vue'

export const useBradescoCsv = () => {
  const processando = ref(false)
  const erro = ref(null)

  const normalizar = (t) => {
    if (!t) return ''
    return String(t)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[._-]/g, ' ')
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const lerArquivoTexto = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const bytes = new Uint8Array(e.target?.result || new ArrayBuffer(0))
          const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
          const latin1 = new TextDecoder('windows-1252', { fatal: false }).decode(bytes)

          const scoreCabecalho = (txt) => {
            const n = normalizar(txt)
            let score = 0
            if (n.includes(' DATA ' ) || n.startsWith('DATA ') || n.includes('\nDATA ')) score += 1
            if (n.includes('LANCAMENTO')) score += 1
            if (n.includes('CREDITO')) score += 1
            if (n.includes('DEBITO')) score += 1
            return score
          }

          resolve(scoreCabecalho(latin1) > scoreCabecalho(utf8) ? latin1 : utf8)
        } catch {
          reject(new Error('Erro ao decodificar arquivo CSV'))
        }
      }
      reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'))
      reader.readAsArrayBuffer(arquivo)
    })
  }

  const detectarDelimitador = (linhas) => {
    const amostra = linhas.find((l) => String(l || '').trim())
    if (!amostra) return ';'
    const candidatos = [';', ',', '\t']
    let melhor = ';'
    let maior = -1
    for (const d of candidatos) {
      const qtd = (amostra.match(new RegExp(`\\${d}`, 'g')) || []).length
      if (qtd > maior) {
        maior = qtd
        melhor = d
      }
    }
    return melhor
  }

  const parseLinhaCSV = (linha, delimitador) => {
    const out = []
    let atual = ''
    let emAspas = false
    for (let i = 0; i < linha.length; i++) {
      const ch = linha[i]
      if (ch === '"') {
        if (emAspas && linha[i + 1] === '"') {
          atual += '"'
          i += 1
        } else {
          emAspas = !emAspas
        }
      } else if (ch === delimitador && !emAspas) {
        out.push(atual.trim())
        atual = ''
      } else {
        atual += ch
      }
    }
    out.push(atual.trim())
    return out
  }

  const parseData = (valor) => {
    const s = String(valor || '').trim()
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!m) return ''
    const dia = String(m[1]).padStart(2, '0')
    const mes = String(m[2]).padStart(2, '0')
    const ano = m[3]
    return `${dia}/${mes}/${ano}`
  }

  const parseValorBRL = (valor) => {
    const s = String(valor || '').trim()
    if (!s) return 0
    const numero = parseFloat(
      s
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.-]/g, '')
    )
    return Number.isFinite(numero) ? numero : 0
  }

  const detectarAdquirente = (descricao) => {
    const s = normalizar(descricao)
    if (!s) return ''
    const cartoes = [
      { nome: 'TRIPAG', re: /\bTRIPAG\b/ },
      { nome: 'UNICA', re: /\bUNICA\b/ },
      { nome: 'CIELO', re: /\bCIELO\b/ },
      { nome: 'SIPAG', re: /\bSIPAG\b/ },
      { nome: 'SICREDI', re: /\bSICREDI\b/ },
      { nome: 'REDE', re: /\bREDE[_\s-]/ },
      { nome: 'STONE', re: /\bSTONE\b/ },
      { nome: 'AZULZINHA', re: /\bAZULZINHA\b/ },
      { nome: 'PAG SEGURO', re: /\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b/ }
    ]
    for (const r of cartoes) {
      if (r.re.test(s)) return r.nome
    }
    const vouchers = {
      'TICKET SERVICOS SA': ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'],
      'ALELO INSTITUICAO DE PAGAMENTO': ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'],
      'VR BENEFICIOS': ['VR BENEFICIOS', 'VR BENEF'],
      'LE CARD ADMINISTRADORA': ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'],
      'UP BRASIL ADMINISTRACAO': ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'],
      COMPROCARD: ['COMPROCARD'],
      'ECX CARD': ['ECX CARD'],
      'FN CARD': ['FN CARD'],
      'BEN VISA': ['BEN VISA'],
      CREDSHOP: ['CREDSHOP'],
      'CRED SHOP': ['CRED SHOP'],
      'RC CARD': ['RC CARD'],
      'GOOD CARD': ['GOOD CARD'],
      'BIG CARD': ['BIG CARD'],
      'BK CARD': ['BK CARD'],
      BRASILCARD: ['BRASILCARD'],
      BOLTCARD: ['BOLTCARD'],
      'CABAL PRE': ['CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CABAL BRASIL', 'CREDENCIADOR CABAL BRASIL'],
      VEROCARD: ['VEROCARD'],
      VEROCHEQUE: ['VEROCHEQUE'],
      FACECARD: ['FACECARD'],
      'VALE CARD': ['VALE CARD', 'VALECARD'],
      NAIP: ['NAIP']
    }
    for (const [canonico, aliases] of Object.entries(vouchers)) {
      for (const alias of aliases) {
        if (s.includes(normalizar(alias))) return canonico
      }
    }
    return ''
  }

  const processarCSV = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const texto = await lerArquivoTexto(arquivo)
      const linhas = texto.split(/\r?\n/).filter((l) => String(l || '').trim())
      if (!linhas.length) return { sucesso: true, transacoes: [], total: 0 }

      const delimitador = detectarDelimitador(linhas)
      const matriz = linhas.map((l) => parseLinhaCSV(l, delimitador))

      let idxCabecalho = -1
      for (let i = 0; i < matriz.length; i++) {
        const linhaNorm = matriz[i].map(normalizar)
        const temData = linhaNorm.some((c) => c === 'DATA' || c.startsWith('DATA '))
        const temLancamento = linhaNorm.some((c) => c.includes('LANCAMENTO') || c.includes('LANC'))
        const temCredito = linhaNorm.some((c) => c.includes('CREDITO'))
        const temDebito = linhaNorm.some((c) => c.includes('DEBITO'))
        if (temData && temLancamento && temCredito && temDebito) {
          idxCabecalho = i
          break
        }
      }

      // Fallback para CSVs exportados com cabeçalho atípico
      if (idxCabecalho < 0) idxCabecalho = 0

      const cabecalhoNorm = (matriz[idxCabecalho] || []).map(normalizar)
      const idxDataDetectado = cabecalhoNorm.findIndex((c) => c === 'DATA' || c.startsWith('DATA '))
      const idxLancamentoDetectado = cabecalhoNorm.findIndex((c) => c.includes('LANCAMENTO') || c.includes('LANC'))
      const idxDctoDetectado = cabecalhoNorm.findIndex((c) => c.includes('DCTO') || c.includes('DOCUMENTO') || c === 'DOC')
      const idxCreditoDetectado = cabecalhoNorm.findIndex((c) => c.includes('CREDITO'))
      const idxDebitoDetectado = cabecalhoNorm.findIndex((c) => c.includes('DEBITO'))

      // Mapeamento solicitado: Data, Lançamento, Dcto., Crédito, Débito
      const idxData = idxDataDetectado >= 0 ? idxDataDetectado : 0
      const idxLancamento = idxLancamentoDetectado >= 0 ? idxLancamentoDetectado : 1
      const idxDcto = idxDctoDetectado >= 0 ? idxDctoDetectado : 2
      const idxCredito = idxCreditoDetectado >= 0 ? idxCreditoDetectado : 3
      const idxDebito = idxDebitoDetectado >= 0 ? idxDebitoDetectado : 4

      const transacoes = []
      let contador = 0

      for (let i = idxCabecalho + 1; i < matriz.length; i++) {
        const row = matriz[i] || []
        const data = parseData(row[idxData])
        const descricao = String(row[idxLancamento] || '').replace(/\s+/g, ' ').trim()
        const documento = String(row[idxDcto] || '').trim()
        const valorCredito = parseValorBRL(row[idxCredito])
        const valorDebito = parseValorBRL(row[idxDebito])

        if (!data || !descricao) continue

        let valorNumerico = 0
        if (valorCredito > 0) valorNumerico = Math.abs(valorCredito)
        else if (valorDebito > 0) valorNumerico = -Math.abs(valorDebito)
        else continue

        contador += 1
        transacoes.push({
          id: `BRADESCOCSV-${contador}`,
          data,
          descricao,
          documento: documento || `BRADESCOCSV-${contador}`,
          valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico),
          valorNumerico,
          tipo: valorNumerico >= 0 ? 'Crédito' : 'Débito',
          banco: 'Bradesco',
          origem: 'CSV',
          adquirente: detectarAdquirente(descricao)
        })
      }

      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar CSV do Bradesco'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return { processando, erro, processarCSV }
}
