export const criarVoucherInicial = (nome) => ({
  nome,
  debito: 0,
  credito: 0,
  credito2x: 0,
  credito3x: 0,
  credito4x6x: 0,
  voucher: 0,
  _voucher_input: '0,00',
  _editing_voucher: false,
  taxa: 0,
  despesa_mdr: 0,
  despesa_extra: 0,
  pgto_banco: 0,
  valor_bruto: 0,
  valor_liquido: 0,
  _bruto_base_db: 0,
  _mdr_base_db: 0,
  _extra_base_db: 0,
  _bruto_db: 0,
  _has_db_values: false,
  _mdr_db: 0,
  _extra_db: 0,
  _liquido_db: 0,
  _pgto_banco_db: 0,
  _delta_bruto: 0,
  _delta_mdr: 0,
  _delta_extra: 0,
  _delta_pgto_banco: 0,
  _mdr_input: '0,00',
  _editing_mdr: false,
  _mdr_manual: false,
  _liquido_input: '0,00',
  _editing_liquido: false,
  _liquido_manual: false,
  _extra_input: '0,00',
  _editing_extra: false,
  _extra_manual: false,
  _pgto_banco_input: '0,00',
  _editing_pgto_banco: false,
  observacoes: '',
  _observacoes_db: '',
  _table_exists: null,
  _table_name: '',
  status: 'pending'
})

export const criarListaVouchersInicial = (vouchers = []) => (vouchers || []).map(criarVoucherInicial)

export const resetarVoucher = (voucher) => {
  voucher.debito = 0
  voucher.credito = 0
  voucher.credito2x = 0
  voucher.credito3x = 0
  voucher.credito4x6x = 0
  voucher.voucher = 0
  voucher._voucher_input = '0,00'
  voucher._editing_voucher = false
  voucher._bruto_base_db = 0
  voucher._mdr_base_db = 0
  voucher._extra_base_db = 0
  voucher._bruto_db = 0
  voucher._has_db_values = false
  voucher._mdr_db = 0
  voucher._extra_db = 0
  voucher._liquido_db = 0
  voucher._pgto_banco_db = 0
  voucher._delta_bruto = 0
  voucher._delta_mdr = 0
  voucher._delta_extra = 0
  voucher._delta_pgto_banco = 0
  voucher._mdr_input = '0,00'
  voucher._editing_mdr = false
  voucher._mdr_manual = false
  voucher._liquido_input = '0,00'
  voucher._editing_liquido = false
  voucher._liquido_manual = false
  voucher._extra_input = '0,00'
  voucher._editing_extra = false
  voucher._extra_manual = false
  voucher._pgto_banco_input = '0,00'
  voucher._editing_pgto_banco = false
  voucher.observacoes = ''
  voucher._observacoes_db = ''
  voucher.despesa_mdr = 0
  voucher.despesa_extra = 0
  voucher.pgto_banco = 0
  voucher.valor_bruto = 0
  voucher.valor_liquido = 0
  voucher._table_exists = false
  voucher._table_name = ''
  voucher.status = 'pending'
}
