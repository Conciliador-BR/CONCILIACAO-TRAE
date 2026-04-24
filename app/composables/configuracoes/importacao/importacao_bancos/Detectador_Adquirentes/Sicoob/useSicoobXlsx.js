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
      normalizado = limpo.replace(/\./g, '').replace(',', '.')
    } else if (temVirgula) {
      normalizado = limpo.replace(',', '.')
    }

    let n = parseFloat(normalizado)
    if (!Number.isFinite(n)) return 0

    const nat = String(fallbackNatureza || '').trim().toUpperCase()
    if (debit || nat === 'D') n = -Math.abs(n)
    else n = Math.abs(n)
    return n
  }

  const extrairValorDaLinha = (row) => {
    const d = row?.[3]
    const e = row?.[4]
    const f = row?.[5]

    const candidatos = [
      { valor: d, natureza: e, idx: 3 },
      { valor: e, natureza: f, idx: 4 },
      { valor: f, natureza: '', idx: 5 },
      { valor: `${d ?? ''} ${e ?? ''}`.trim(), natureza: '', idx: 34 }
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
      const transacoes = []
      let idx = 0
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] || []
        const a = row[0]
        const b = row[1]
        const c = row[2]
        const d = row[3]
        const e = row[4]
        const dataStr = String(a || '').trim()
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) { continue }
        const { valorNumerico, indiceOrigem } = extrairValorDaLinha(row)
        const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico)
        const prim = String(c || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        // Se a coluna E foi usada como valor/natureza, não usar como complemento descritivo.
        const extra = indiceOrigem === 4 || indiceOrigem === 34
          ? ''
          : String(e || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        const detalhes = []
        let j = i + 1
        while (j < rows.length) {
          const rj = rows[j] || []
          const aj = String((rj[0] ?? '')).trim()
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(aj)) { break }
          const partC = String(rj[2] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
          const partE = String(rj[4] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
          const linha = [partC, partE].filter(Boolean).join(' ')
          if (linha) { detalhes.push(linha) }
          j += 1
        }
        const temPix = /RECEBIMENTO\s+PIX/i.test(prim) || /RECEBIMENTO\s+PIX/i.test(extra) || detalhes.some(l => /RECEBIMENTO\s+PIX/i.test(l))
        const descricaoPartes = []
        descricaoPartes.push(temPix ? `${prim} — Recebimento Pix` : prim)
        if (extra) { descricaoPartes.push(extra) }
        if (detalhes.length > 0) { descricaoPartes.push(...detalhes) }
        const descricao = descricaoPartes.join(' | ')
        const adquirente = detectarAdquirente(descricao)
        idx += 1
        transacoes.push({
          id: `SICOOBXLSX-${idx}`,
          data: dataStr,
          descricao,
          documento: String(b || '').trim(),
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
