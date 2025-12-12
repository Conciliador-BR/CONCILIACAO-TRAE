import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useBancoDoBrasilXlsx = () => {
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

  const parseValorBR = (v) => {
    if (typeof v === 'number') { return v || 0 }
    let s = String(v || '').trim()
    if (!s) return 0
    s = s.replace(/\s+/g, '').replace(/R\$?/gi, '')
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma === -1 && lastDot === -1) {
      s = s.replace(/[^0-9.-]/g, '')
      const n = parseFloat(s)
      return isNaN(n) ? 0 : n
    }
    const decimalIsComma = lastComma > lastDot
    const thousandsSep = decimalIsComma ? '.' : ','
    const reThousands = new RegExp('\\' + thousandsSep, 'g')
    s = s.replace(reThousands, '')
    if (decimalIsComma) { s = s.replace(',', '.') }
    s = s.replace(/[^0-9.-]/g, '')
    const n = parseFloat(s)
    return isNaN(n) ? 0 : n
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
        const dataStr = String(row[0] || '').trim()
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) { continue }

        const historico = String(row[7] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        const detalhamento = String(row[10] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        const descricao = [historico, detalhamento].filter(Boolean).join(' / ')

        const inf = String(row[9] || '').trim().toUpperCase()
        let valorNumerico = parseValorBR(row[8])
        if (inf === 'D') valorNumerico = -Math.abs(valorNumerico)
        else valorNumerico = Math.abs(valorNumerico)
        const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico)

        const documento = String(row[6] || '').trim()
        const adquirente = detectarAdquirente(descricao)
        idx += 1
        transacoes.push({
          id: `BBXLSX-${idx}`,
          data: dataStr,
          descricao,
          documento,
          valor,
          valorNumerico,
          banco: 'Banco do Brasil',
          adquirente
        })
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
