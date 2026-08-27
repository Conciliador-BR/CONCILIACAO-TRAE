import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useBradescoXlsx = () => {
  const processando = ref(false)
  const erro = ref(null)

  const normalizar = (t) => {
    if (!t) return ''
    return String(t).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const valorParaNumero = (v) => {
    const s = String(v || '').trim()
    const credit = /C\s*$/i.test(s)
    const debit = /D\s*$/i.test(s)
    const num = s.replace(/[CD]\s*$/i, '').replace(/\./g, '').replace(',', '.')
    let n = parseFloat(num) || 0
    if (debit) n = -Math.abs(n)
    else n = Math.abs(n)
    return n
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
      'CABAL PRE': ['CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CABAL BRASIL', 'CREDENCIADOR CABAL BRASIL'],
      'VEROCARD': ['VEROCARD'],
      'VEROCHEQUE': ['VEROCHEQUE'],
      'FACECARD': ['FACECARD'],
      'VALE CARD': ['VALE CARD', 'VALECARD', 'AGL ADQUIRENCIA', 'AGL ADQUIRENCIA LTDA'],
      'NAIP': ['NAIP']
    }
    for (const [canonico, aliases] of Object.entries(vouchers)) {
      for (const a of aliases) { if (s.includes(normalizar(a))) return canonico }
    }
    return ''
  }

  const parseValorBRL = (valor) => {
    if (valor == null) return 0
    const texto = String(valor).trim()
    if (!texto) return 0
    const normalizado = texto.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const numero = Number.parseFloat(normalizado)
    return Number.isFinite(numero) ? numero : 0
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
      let idxCabecalho = rows.findIndex((row) => {
        const linhaNorm = (row || []).map(normalizar)
        const temData = linhaNorm.some((c) => c === 'DATA' || c.startsWith('DATA '))
        const temLancamento = linhaNorm.some((c) =>
          c.includes('LANCAMENTO') ||
          c.includes('LANC') ||
          c.includes('HISTORICO') ||
          c.includes('DESCRICAO')
        )
        const temDocumento = linhaNorm.some((c) => c.includes('DCTO') || c.includes('DOCTO') || c.includes('DOCUMENTO') || c === 'DOC')
        const temCredito = linhaNorm.some((c) => c.includes('CREDITO'))
        const temDebito = linhaNorm.some((c) => c.includes('DEBITO'))
        return temData && temLancamento && temDocumento && temCredito && temDebito
      })

      if (idxCabecalho < 0) idxCabecalho = 0

      const cabecalhoNorm = (rows[idxCabecalho] || []).map(normalizar)
      const idxData = cabecalhoNorm.findIndex((c) => c === 'DATA' || c.startsWith('DATA '))
      const idxLancamento = cabecalhoNorm.findIndex((c) =>
        c.includes('LANCAMENTO') ||
        c.includes('LANC') ||
        c.includes('HISTORICO') ||
        c.includes('DESCRICAO')
      )
      const idxDcto = cabecalhoNorm.findIndex((c) => c.includes('DCTO') || c.includes('DOCTO') || c.includes('DOCUMENTO') || c === 'DOC')
      const idxCredito = cabecalhoNorm.findIndex((c) => c.includes('CREDITO'))
      const idxDebito = cabecalhoNorm.findIndex((c) => c.includes('DEBITO'))

      let dataContexto = ''
      for (let i = idxCabecalho + 1; i < rows.length; i++) {
        const row = rows[i] || []
        const dataLinha = String(row[idxData >= 0 ? idxData : 0] || '').trim()
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataLinha)) dataContexto = dataLinha
        const dataStr = dataContexto
        if (!dataStr) continue

        const descricao = String(row[idxLancamento >= 0 ? idxLancamento : 1] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        const documento = String(row[idxDcto >= 0 ? idxDcto : 2] || '').trim()
        const valorCredito = parseValorBRL(row[idxCredito >= 0 ? idxCredito : 3])
        const valorDebito = parseValorBRL(row[idxDebito >= 0 ? idxDebito : 4])

        if (!descricao) continue

        let valorNumerico = 0
        if (valorCredito > 0) valorNumerico = Math.abs(valorCredito)
        else if (valorDebito > 0) valorNumerico = -Math.abs(valorDebito)
        else if (idxCredito >= 0) valorNumerico = valorParaNumero(row[idxCredito])
        else continue

        const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico)
        const detalhes = []
        let j = i + 1
        while (j < rows.length) {
          const rj = rows[j] || []
          const aj = String((rj[idxData >= 0 ? idxData : 0] ?? '')).trim()
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(aj)) { break }
          const partLancamento = String(rj[idxLancamento >= 0 ? idxLancamento : 1] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
          const linha = [partLancamento].filter(Boolean).join(' ')
          if (linha) { detalhes.push(linha) }
          j += 1
        }
        const temPix = /RECEBIMENTO\s+PIX/i.test(descricao) || detalhes.some(l => /RECEBIMENTO\s+PIX/i.test(l))
        const descricaoPartes = []
        descricaoPartes.push(temPix ? `${descricao} — Recebimento Pix` : descricao)
        if (detalhes.length > 0) { descricaoPartes.push(...detalhes) }
        const descricaoFinal = descricaoPartes.join(' | ')
        const adquirente = detectarAdquirente(descricaoFinal)
        idx += 1
        transacoes.push({
          id: `BRADESCOXLSX-${idx}`,
          data: dataStr,
          descricao: descricaoFinal,
          documento,
          valor,
          valorNumerico,
          banco: 'Bradesco',
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
