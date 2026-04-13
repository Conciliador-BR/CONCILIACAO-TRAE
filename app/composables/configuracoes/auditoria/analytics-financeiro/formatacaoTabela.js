import { toISODate } from './utilsConciliacao'

export const useFormatacaoTabelaFinanceira = () => {
  const formatDateBR = (v) => {
    if (!v) return '-'
    const s = String(v).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-')
      return `${d}/${m}/${y}`
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
    const iso = toISODate(s)
    if (!iso) return s
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  const formatCell = (value, column) => {
    if (column === 'vendaBruta' || column === 'vendaLiquida' || column === 'despesaMdr') {
      const n = Number(String(value).replace(',', '.'))
      return `R$ ${Number.isFinite(n) ? n.toFixed(2) : '0.00'}`
    }
    if (column === 'dataVenda' || column === 'dataPagamento' || column === 'previsaoPgto') {
      return formatDateBR(value)
    }
    return value
  }

  return { formatCell }
}
