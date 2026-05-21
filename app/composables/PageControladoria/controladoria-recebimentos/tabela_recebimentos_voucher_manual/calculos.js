import { formatBRLNumber, round2 } from './formatters'

export const calcularValoresVoucherRecebimento = (voucher) => {
  let bruto = round2(voucher.valor_bruto || 0)
  const mdr = round2(voucher.despesa_mdr || 0)
  const liquidoAtual = round2(voucher.valor_liquido || 0)
  const antecipacao = round2(voucher.despesa_antecipacao || 0)
  const previstoAtual = round2(voucher.valor_previsto || 0)
  const pgtoBanco = round2(voucher.pgto_banco || 0)

  voucher.valor_bruto = bruto
  voucher.despesa_mdr = mdr
  voucher.despesa_antecipacao = antecipacao
  voucher.pgto_banco = pgtoBanco

  const brutoDb = round2(voucher._bruto_db || 0)
  const mdrDb = round2(voucher._mdr_db || 0)
  const liquidoDb = round2(voucher._liquido_db || 0)
  const antecipacaoDb = round2(voucher._antecipacao_db || 0)
  const previstoDb = round2(voucher._previsto_db || 0)
  const pgtoBancoDb = round2(voucher._pgto_banco_db || 0)

  voucher._delta_bruto = round2(bruto - brutoDb)
  voucher._delta_mdr = round2(mdr - mdrDb)
  voucher._delta_antecipacao = round2(antecipacao - antecipacaoDb)
  voucher._delta_pgto_banco = round2(pgtoBanco - pgtoBancoDb)

  if (voucher._editing_liquido) {
    voucher.valor_liquido = liquidoAtual
  } else if (!voucher._has_db_values || voucher._delta_bruto !== 0 || voucher._delta_mdr !== 0) {
    voucher.valor_liquido = round2(bruto - mdr)
  }

  voucher._delta_liquido = round2(voucher.valor_liquido - liquidoDb)

  if (voucher._editing_previsto) {
    voucher.valor_previsto = previstoAtual
  } else if (!voucher._has_db_values || voucher._delta_liquido !== 0 || voucher._delta_antecipacao !== 0) {
    voucher.valor_previsto = round2(voucher.valor_liquido - voucher.despesa_antecipacao)
  }

  voucher._delta_previsto = round2(voucher.valor_previsto - previstoDb)

  if (!voucher._editing_bruto) {
    voucher._bruto_input = formatBRLNumber(voucher.valor_bruto)
  }
  if (!voucher._editing_mdr) {
    voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
  }
  if (!voucher._editing_liquido) {
    voucher._liquido_input = formatBRLNumber(voucher.valor_liquido)
  }
  if (!voucher._editing_antecipacao) {
    voucher._antecipacao_input = formatBRLNumber(voucher.despesa_antecipacao)
  }
  if (!voucher._editing_previsto) {
    voucher._previsto_input = formatBRLNumber(voucher.valor_previsto)
  }
  if (!voucher._editing_pgto_banco) {
    voucher._pgto_banco_input = formatBRLNumber(voucher.pgto_banco)
  }
}
