import { formatBRLNumber, round2 } from './formatters'

export const calcularValoresVoucher = (voucher) => {
  const debito = Number(voucher.debito || 0)
  const credito = Number(voucher.credito || 0)
  const credito2x = Number(voucher.credito2x || 0)
  const credito3x = Number(voucher.credito3x || 0)
  const credito4x6x = Number(voucher.credito4x6x || 0)
  const valorVoucher = Number(voucher.voucher || 0)
  const despesaExtra = Number(voucher.despesa_extra || 0)

  const bruto = round2(debito + credito + credito2x + credito3x + credito4x6x + valorVoucher)
  voucher.valor_bruto = bruto
  voucher._delta_bruto = round2(bruto - Number(voucher._bruto_db || 0))

  if (!voucher._mdr_manual) {
    const taxa = Number(voucher.taxa || 0)
    voucher.despesa_mdr = round2(bruto * (taxa / 100))
  } else {
    voucher.despesa_mdr = round2(voucher.despesa_mdr || 0)
  }

  voucher.despesa_extra = round2(despesaExtra)
  voucher._delta_extra = round2(Number(voucher.despesa_extra || 0) - Number(voucher._extra_db || 0))

  voucher.valor_liquido = round2(bruto - Number(voucher.despesa_mdr || 0) - Number(voucher.despesa_extra || 0))
  voucher._delta_mdr = round2(Number(voucher.despesa_mdr || 0) - Number(voucher._mdr_db || 0))

  if (!voucher._editing_voucher) {
    voucher._voucher_input = formatBRLNumber(voucher.voucher)
  }
  if (!voucher._editing_mdr) {
    voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
  }
  if (!voucher._editing_extra) {
    voucher._extra_input = formatBRLNumber(voucher.despesa_extra)
  }
}
