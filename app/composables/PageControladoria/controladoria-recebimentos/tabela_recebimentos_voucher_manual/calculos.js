import { formatBRLNumber, round2 } from './formatters'

export const calcularValoresVoucherRecebimento = (voucher) => {
  let bruto = round2(voucher.valor_bruto || 0)
  const mdr = round2(voucher.despesa_mdr || 0)
  const liquidoAtual = round2(voucher.valor_liquido || 0)
  const antecipacao = round2(voucher.despesa_antecipacao || 0)
  const previstoAtual = round2(voucher.valor_previsto || 0)
  const depositado = round2(voucher.valor_depositado || 0)

  // Regra solicitada: se só houver valor depositado e o usuário informar MDR,
  // preencher automaticamente o bruto como (depositado + mdr) durante toda a edição.
  const estadoBaseParaAutoBruto =
    depositado > 0
    && liquidoAtual === 0
    && antecipacao === 0
    && previstoAtual === 0

  const iniciouAutoBruto =
    voucher._editing_mdr
    && !voucher._editing_bruto
    && estadoBaseParaAutoBruto
    && mdr > 0
    && bruto === 0

  if (iniciouAutoBruto) {
    voucher._auto_bruto_from_depositado_mdr = true
  }

  if (voucher._editing_bruto || !voucher._editing_mdr) {
    voucher._auto_bruto_from_depositado_mdr = false
  }

  const podeAutoCalcularBruto =
    voucher._editing_mdr
    && mdr > 0
    && !voucher._editing_bruto
    && voucher._auto_bruto_from_depositado_mdr === true

  if (podeAutoCalcularBruto) {
    bruto = round2(depositado + mdr)
  }

  voucher.valor_bruto = bruto
  voucher.despesa_mdr = mdr
  voucher.despesa_antecipacao = antecipacao
  voucher.valor_depositado = depositado

  const brutoDb = round2(voucher._bruto_db || 0)
  const mdrDb = round2(voucher._mdr_db || 0)
  const liquidoDb = round2(voucher._liquido_db || 0)
  const antecipacaoDb = round2(voucher._antecipacao_db || 0)
  const previstoDb = round2(voucher._previsto_db || 0)
  const depositadoDb = round2(voucher._depositado_db || 0)

  voucher._delta_bruto = round2(bruto - brutoDb)
  voucher._delta_mdr = round2(mdr - mdrDb)
  voucher._delta_antecipacao = round2(antecipacao - antecipacaoDb)
  voucher._delta_depositado = round2(depositado - depositadoDb)

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
  if (!voucher._editing_depositado) {
    voucher._depositado_input = formatBRLNumber(voucher.valor_depositado)
  }
}
