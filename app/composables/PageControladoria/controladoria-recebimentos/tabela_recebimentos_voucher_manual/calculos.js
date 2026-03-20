import { formatBRLNumber, round2 } from './formatters'

export const calcularValoresVoucherRecebimento = (voucher) => {
  const bruto = round2(voucher.valor_bruto || 0)
  const mdr = round2(voucher.despesa_mdr || 0)
  const extra = round2(voucher.despesa_extra || 0)
  const antecipacao = round2(voucher.despesa_antecipacao || 0)
  voucher.valor_bruto = bruto
  voucher.despesa_mdr = mdr
  voucher.despesa_extra = extra
  voucher.despesa_antecipacao = antecipacao
  voucher.valor_liquido = round2(bruto - mdr - extra)
  voucher.valor_previsto = round2(voucher.valor_liquido - voucher.despesa_antecipacao)

  const brutoDb = round2(voucher._bruto_db || 0)
  const mdrDb = round2(voucher._mdr_db || 0)
  const extraDb = round2(voucher._extra_db || 0)

  voucher._delta_bruto = round2(bruto - brutoDb)
  voucher._delta_mdr = round2(mdr - mdrDb)
  voucher._delta_extra = round2(extra - extraDb)

  if (!voucher._editing_bruto) {
    voucher._bruto_input = formatBRLNumber(voucher.valor_bruto)
  }
  if (!voucher._editing_mdr) {
    voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
  }
  if (!voucher._editing_extra) {
    voucher._extra_input = formatBRLNumber(voucher.despesa_extra)
  }
}
