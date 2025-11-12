import { toISODate, startOfMonthISO, endOfMonthISO, addMonthsISO } from './utilsConciliacao'

export const buildJanelaParcelas = (baseDate, parcelas) => {
  const p = Number(parcelas || 0)
  const back = p === 0 ? 1 : Math.min(12, p + 1)
  const base = toISODate(baseDate)
  const inicio = addMonthsISO(startOfMonthISO(base), -back)
  const fim = endOfMonthISO(base)
  return { inicio, fim }
}

