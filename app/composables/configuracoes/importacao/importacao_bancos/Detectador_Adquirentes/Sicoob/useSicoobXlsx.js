import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useSicoobXlsx = () => {
  const processando = ref(false)
  const erro = ref(null)

  const normalizar = (t) => {
    if (!t) return ''
    return String(t).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const valorParaNumero = (v, fallbackNatureza = '') => {
    if (v === null || v === undefined || v === '') return 0

    // Quando a célula já é numérica, respeita o valor direto.
    if (typeof v === 'number') {
      let n = Number.isFinite(v) ? v : 0
      const nat = String(fallbackNatureza || '').trim().toUpperCase()
      if (nat === 'D') n = -Math.abs(n)
      if (nat === 'C') n = Math.abs(n)
      return n
    }

    const s = String(v || '').trim()
    const sUpper = s.toUpperCase()
    const credit = /\bC\b\s*$/.test(sUpper)
    const debit = /\bD\b\s*$/.test(sUpper)

    const limpo = s
      .replace(/R\$/gi, '')
      .replace(/\b[CD]\b\s*$/i, '')
      .replace(/\s+/g, '')

    let normalizado = limpo
    const temPonto = limpo.includes('.')
    const temVirgula = limpo.includes(',')
    if (temPonto && temVirgula) {
      // Formato misto: assume o último separador como decimal.
      const idxUltVirgula = limpo.lastIndexOf(',')
      const idxUltPonto = limpo.lastIndexOf('.')
      const separadorDecimal = idxUltVirgula > idxUltPonto ? ',' : '.'
      if (separadorDecimal === ',') {
        normalizado = limpo.replace(/\./g, '').replace(',', '.')
      } else {
        normalizado = limpo.replace(/,/g, '')
      }
    } else if (temVirgula) {
      // Padrão pt-BR comum (milhar com ponto e decimal com vírgula).
      normalizado = limpo.replace(/\./g, '').replace(',', '.')
    } else if (temPonto) {
      // Quando só tem ponto, pode ser decimal EN (4704.35) ou pt-BR "quebrado" (4.70435).
      const partes = limpo.split('.')
      const ult = partes[partes.length - 1] || ''
      if (partes.length > 1 && ult.length === 2) {
        // Ex.: 4.704.35 -> 4704.35
        normalizado = `${partes.slice(0, -1).join('')}.${ult}`
      } else if (partes.length > 1 && ult.length === 3) {
        // Ex.: 4.704 -> 4704
        normalizado = partes.join('')
      } else if (partes.length > 1 && ult.length > 2) {
        // Ex.: 4.70435 -> 4704.35 (evita cair 100x menor)
        const soDigitos = limpo.replace(/\D/g, '')
        if (soDigitos.length > 2) {
          normalizado = `${soDigitos.slice(0, -2)}.${soDigitos.slice(-2)}`
        }
      }
    }

    let n = parseFloat(normalizado)
    if (!Number.isFinite(n)) return 0

    const nat = String(fallbackNatureza || '').trim().toUpperCase()
    if (debit || nat === 'D') n = -Math.abs(n)
    else n = Math.abs(n)
    return n
  }

  const limparTextoCelula = (valor) => String(valor || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()

  const detectarCabecalho = (rows) => {
    for (let i = 0; i < Math.min(rows.length, 20); i += 1) {
      const row = Array.isArray(rows[i]) ? rows[i] : []
      const mapa = {}

      row.forEach((cell, index) => {
        const texto = normalizar(cell)
        if (!texto) return
        mapa[texto] = index
      })

      const idxData = mapa.DATA
      const idxValor = mapa.VALOR
      const idxDocumento = mapa.DOCUMENTO
      const idxHistorico = mapa.HISTORICO
      const idxInformacoesComplementares = mapa['INFORMACOES COMPLEMENTARES']

      if (idxData == null || idxValor == null) continue

      return {
        headerRowIndex: i,
        layoutNovo: idxHistorico != null && idxInformacoesComplementares != null,
        indices: {
          data: idxData,
          documento: idxDocumento ?? 1,
          historico: idxHistorico ?? 2,
          informacoesComplementares: idxInformacoesComplementares,
          valor: idxValor,
          natureza: idxValor + 1
        }
      }
    }

    return {
      headerRowIndex: -1,
      layoutNovo: false,
      indices: {
        data: 0,
        documento: 1,
        historico: 2,
        informacoesComplementares: 4,
        valor: 3,
        natureza: 4
      }
    }
  }

  const extrairValorDaLinha = (row, indices = {}) => {
    const valorIdx = Number.isInteger(indices?.valor) ? indices.valor : 3
    const naturezaIdx = Number.isInteger(indices?.natureza) ? indices.natureza : valorIdx + 1
    const valorPrincipal = row?.[valorIdx]
    const naturezaPrincipal = row?.[naturezaIdx]
    const valorSeguinte = row?.[valorIdx + 1]
    const naturezaSeguinte = row?.[valorIdx + 2]

    const candidatos = [
      { valor: valorPrincipal, natureza: naturezaPrincipal, idx: valorIdx },
      { valor: valorSeguinte, natureza: naturezaSeguinte, idx: valorIdx + 1 },
      { valor: `${valorPrincipal ?? ''} ${naturezaPrincipal ?? ''}`.trim(), natureza: '', idx: valorIdx * 10 + naturezaIdx }
    ]

    for (const c of candidatos) {
      const bruto = String(c.valor ?? '').trim()
      if (!bruto) continue

      // Aceita com ou sem C/D, com ou sem R$, com milhar/decimal.
      const pareceValor = typeof c.valor === 'number' || /R\$|\d+[.,]\d{2}|\d{1,3}(?:\.\d{3})*(?:,\d{2})/.test(bruto)
      if (!pareceValor) continue

      const numero = valorParaNumero(c.valor, c.natureza)
      if (Number.isFinite(numero) && (numero !== 0 || /0+[.,]0{2}/.test(bruto))) {
        return { valorNumerico: numero, indiceOrigem: c.idx }
      }
    }

    return { valorNumerico: 0, indiceOrigem: -1 }
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
    for (const r of cartoes) { if (r.re.test(s)) return r.nome }
    const vouchers = {
      'TICKET SERVICOS SA': ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'],
      'ALELO INSTITUICAO DE PAGAMENTO': ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'],
      'VR BENEFICIOS': ['VR BENEFICIOS', 'VR BENEF'],
      'LE CARD ADMINISTRADORA': ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'],
      'UP BRASIL ADMINISTRACAO': ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'],
      'COMPROCARD': ['COMPROCARD'],
      'ECX CARD': ['ECX CARD'],
      'FN CARD': ['FN CARD'],
      'BEN VISA': ['BEN VISA'],
      'CREDSHOP': ['CREDSHOP'],
      'CRED SHOP': ['CRED SHOP'],
      'RC CARD': ['RC CARD'],
      'GOOD CARD': ['GOOD CARD'],
      'BIG CARD': ['BIG CARD'],
      'BK CARD': ['BK CARD'],
      'BRASILCARD': ['BRASILCARD'],
      'BOLTCARD': ['BOLTCARD'],
      'CABAL PRE': ['CABAL PRE', 'CREDENCIADOR CABAL PRE'],
      'VEROCARD': ['VEROCARD'],
      'VEROCHEQUE': ['VEROCHEQUE'],
      'FACECARD': ['FACECARD'],
      'VALE CARD': ['VALE CARD', 'VALECARD'],
      'NAIP': ['NAIP']
    }
    for (const [canonico, aliases] of Object.entries(vouchers)) {
      for (const a of aliases) { if (s.includes(normalizar(a))) return canonico }
    }
    return ''
  }

  const processarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const buffer = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = (e) => resolve(e.target.result)
        r.onerror = () => reject(new Error('Erro ao ler arquivo XLSX'))
        r.readAsArrayBuffer(arquivo)
      })
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false })
      const { headerRowIndex, indices, layoutNovo } = detectarCabecalho(rows)
      const usaLayoutNovo = layoutNovo === true
      const transacoes = []
      let idx = 0
      for (let i = Math.max(headerRowIndex + 1, 0); i < rows.length; i++) {
        const row = rows[i] || []
        const a = row[indices.data]
        const b = row[indices.documento]
        const c = row[indices.historico]
        const d = row[indices.informacoesComplementares]
        const dataStr = String(a || '').trim()
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) { continue }
        const { valorNumerico, indiceOrigem } = extrairValorDaLinha(row, indices)
        const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico)
        const documentoOriginal = limparTextoCelula(b)
        const historico = limparTextoCelula(c)
        const informacoesComplementares = limparTextoCelula(d)
        const prim = usaLayoutNovo
          ? informacoesComplementares
          : historico
        const extra = usaLayoutNovo
          ? ''
          : (indiceOrigem === indices.natureza || indiceOrigem === (indices.valor * 10 + indices.natureza)
              ? ''
              : informacoesComplementares)
        const detalhes = []
        let j = i + 1
        if (!usaLayoutNovo) {
          while (j < rows.length) {
            const rj = rows[j] || []
            const aj = String((rj[indices.data] ?? '')).trim()
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(aj)) { break }
            const partC = limparTextoCelula(rj[indices.historico])
            const partE = limparTextoCelula(rj[indices.informacoesComplementares])
            const linha = [partC, partE].filter(Boolean).join(' ')
            if (linha) { detalhes.push(linha) }
            j += 1
          }
        }
        const temPix = /RECEBIMENTO\s+PIX/i.test(prim) || /RECEBIMENTO\s+PIX/i.test(extra) || /RECEBIMENTO\s+PIX/i.test(historico) || detalhes.some(l => /RECEBIMENTO\s+PIX/i.test(l))
        const descricaoPartes = []
        descricaoPartes.push(temPix && prim ? `${prim} — Recebimento Pix` : prim)
        if (extra) { descricaoPartes.push(extra) }
        if (detalhes.length > 0) { descricaoPartes.push(...detalhes) }
        if (!prim && !historico && !documentoOriginal && valorNumerico === 0) continue
        const descricao = descricaoPartes.filter(Boolean).join(' | ') || historico
        const documento = usaLayoutNovo ? historico : documentoOriginal
        const contextoDeteccao = [descricao, documento].filter(Boolean).join(' | ')
        const adquirente = detectarAdquirente(contextoDeteccao)
        idx += 1
        transacoes.push({
          id: `SICOOBXLSX-${idx}`,
          data: dataStr,
          descricao,
          documento,
          valor,
          valorNumerico,
          banco: 'Sicoob',
          adquirente
        })
        i = j - 1
      }
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar XLSX'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return { processando, erro, processarXLSX }
}
