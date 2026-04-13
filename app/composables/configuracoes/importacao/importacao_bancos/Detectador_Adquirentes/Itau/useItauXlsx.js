import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useItauXlsx = () => {
  const processando = ref(false)
  const erro = ref(null)

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
      const escolherSheet = (workbook) => {
        for (const name of workbook.SheetNames) {
          const s = workbook.Sheets[name]
          const r = XLSX.utils.sheet_to_json(s, { header: 1, raw: false, defval: '' })
          for (let i = 0; i < Math.min(40, r.length); i++) {
            const row = r[i] || []
            const hasData = row.some(v => String(v).toUpperCase().includes('DATA'))
            const hasLanc = row.some(v => {
              const t = String(v).toUpperCase()
              return t.includes('LANÇAMENTO') || t.includes('LANCAMENTO')
            })
            if (hasData && hasLanc) return s
          }
        }
        return workbook.Sheets[workbook.SheetNames[0]]
      }
      const ws = escolherSheet(wb)
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
      
      const transacoes = []
      let idx = 0
      
      let headerRowIndex = -1
      for (let i = 0; i < Math.min(40, rows.length); i++) {
        const row = rows[i] || []
        const hasData = row.some(v => String(v).toUpperCase().includes('DATA'))
        const hasLanc = row.some(v => {
          const t = String(v).toUpperCase()
          return t.includes('LANÇAMENTO') || t.includes('LANCAMENTO')
        })
        if (hasData && hasLanc) { headerRowIndex = i; break }
      }
      const normalize = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
      const header = headerRowIndex !== -1 ? (rows[headerRowIndex] || []) : []
      const idxData = header.findIndex(v => normalize(v).includes('data'))
      const idxLanc = header.findIndex(v => normalize(v).includes('lancamento'))
      const idxRazao = header.findIndex(v => normalize(v).includes('razao') && normalize(v).includes('social'))
      const idxCnpj = header.findIndex(v => normalize(v).includes('cpf') || normalize(v).includes('cnpj'))
      const idxValor = header.findIndex(v => normalize(v).includes('valor'))
      const idxSaldo = header.findIndex(v => normalize(v).includes('saldo'))
      const start = headerRowIndex !== -1 ? headerRowIndex + 1 : 10
      for (let i = start; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue
        const joined = (row || []).map(v => String(v || '')).join(' ').toUpperCase()
        if (joined.includes('SALDO ANTERIOR') || joined.includes('SALDO TOTAL') || joined.includes('SALDO DISPONIVEL')) continue
        const toDateStr = (v) => {
          if (v instanceof Date && !isNaN(v)) {
            const d = v
            const dd = String(d.getDate()).padStart(2, '0')
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const yyyy = String(d.getFullYear())
            return `${dd}/${mm}/${yyyy}`
          }
          const s = String(v || '').trim()
          let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
          if (m) {
            const dd = m[1].padStart(2, '0')
            const mm = m[2].padStart(2, '0')
            let yyyy = m[3]
            if (yyyy.length === 2) yyyy = `20${yyyy}`
            return `${dd}/${mm}/${yyyy}`
          }
          m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
          if (m) return `${m[3]}/${m[2]}/${m[1]}`
          if (!isNaN(Number(s)) && s !== '') {
            const code = XLSX.SSF.parse_date_code(Number(s))
            if (code && code.y && code.m && code.d) {
              const dd = String(code.d).padStart(2, '0')
              const mm = String(code.m).padStart(2, '0')
              const yyyy = String(code.y)
              return `${dd}/${mm}/${yyyy}`
            }
          }
          // Fallback: procurar data em qualquer célula da linha
          const mmdd = joined.match(/(\d{2}\/\d{2}\/\d{4})/)
          if (mmdd) return mmdd[1]
          return ''
        }
        const parseValor = (v) => {
          if (typeof v === 'number') return v
          let s = String(v || '').trim()
          if (!s) return 0
          const isNeg = /-/.test(s) || /\(/.test(s)
          s = s.replace(/R\$|\s/g, '')
          const hasComma = s.includes(',')
          const hasDot = s.includes('.')
          if (hasComma && hasDot) {
            // Brasil: milhar com ponto, decimal com vírgula
            s = s.replace(/\./g, '')
            s = s.replace(',', '.')
          } else if (hasComma && !hasDot) {
            // Apenas vírgula: decimal
            s = s.replace(/\./g, '')
            s = s.replace(',', '.')
          } else if (!hasComma && hasDot) {
            // Apenas ponto: decimal
            s = s.replace(/,/g, '')
          } else {
            // Somente dígitos
          }
          let n = parseFloat(s)
          if (!Number.isFinite(n)) n = 0
          return isNeg ? -Math.abs(n) : n
        }
        const get = (arr, idx, fallbackIdx) => {
          if (Number.isInteger(idx) && idx >= 0) return arr[idx]
          if (Number.isInteger(fallbackIdx) && fallbackIdx >= 0) return arr[fallbackIdx]
          return undefined
        }
        const dataStr = toDateStr(get(row, idxData, 0))
        const lancamento = String(get(row, idxLanc, 1) || '').trim()
        const razao = String(get(row, idxRazao, 2) || '').trim()
        const cnpj = String(get(row, idxCnpj, 3) || '').trim()
        let valorNumerico = parseValor(get(row, idxValor, 4))
        if (!valorNumerico || !Number.isFinite(valorNumerico)) {
          // Fallback: último valor monetário encontrado na linha
          const mvals = [...joined.matchAll(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g)]
          if (mvals.length) {
            const last = mvals[mvals.length - 1][0]
            const isNeg = /^-/.test(last)
            let s = last.replace(/\./g, '').replace(',', '.')
            valorNumerico = parseFloat(s) || 0
            if (isNeg) valorNumerico = -Math.abs(valorNumerico)
          } else {
            valorNumerico = 0
          }
        }
        if (!dataStr) continue
        if (lancamento === 'SALDO ANTERIOR' || lancamento.includes('SALDO TOTAL')) continue
        let descricao = lancamento
        if (razao) descricao += ` / ${razao}`
        const adquirente = identificarAdquirente(descricao)
        idx++
        transacoes.push({
          id: `ITAU-XLSX-${idx}`,
          data: dataStr,
          descricao,
          documento: cnpj || '',
          valor: formatarMoeda(valorNumerico),
          valorNumerico,
          banco: 'Itaú',
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

  const identificarAdquirente = (texto) => {
    const s = (texto || '').toUpperCase()
    const candidatos = ['ALELO', 'SIPAG', 'STONE', 'CIELO', 'REDE', 'GETNET', 'SAFRAPAY', 'MERCADOPAGO', 'PAGSEGURO', 'UNICA', 'BIN', 'TICKET', 'PLUXEE', 'VR BENEFICIOS']
    for (const c of candidatos) { if (s.includes(c)) return c }
    return ''
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  return { processando, erro, processarXLSX }
}
