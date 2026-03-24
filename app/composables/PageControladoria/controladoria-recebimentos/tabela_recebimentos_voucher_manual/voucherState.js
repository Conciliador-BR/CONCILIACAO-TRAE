import { VOUCHERS_FIXOS } from './constants'

export const criarVoucherInicial = (nome) => ({
  nome,
  valor_bruto: 0,
  despesa_mdr: 0,
  valor_liquido: 0,
  despesa_antecipacao: 0,
  valor_previsto: 0,
  valor_depositado: 0,
  observacoes: '',
  _bruto_input: '0,00',
  _editing_bruto: false,
  _mdr_input: '0,00',
  _editing_mdr: false,
  _liquido_input: '0,00',
  _editing_liquido: false,
  _antecipacao_input: '0,00',
  _editing_antecipacao: false,
  _previsto_input: '0,00',
  _editing_previsto: false,
  _depositado_input: '0,00',
  _editing_depositado: false,
  _bruto_base_db: 0,
  _mdr_base_db: 0,
  _liquido_base_db: 0,
  _antecipacao_base_db: 0,
  _previsto_base_db: 0,
  _depositado_base_db: 0,
  _bruto_db: 0,
  _mdr_db: 0,
  _liquido_db: 0,
  _antecipacao_db: 0,
  _previsto_db: 0,
  _depositado_db: 0,
  _delta_bruto: 0,
  _delta_mdr: 0,
  _delta_liquido: 0,
  _delta_antecipacao: 0,
  _delta_previsto: 0,
  _delta_depositado: 0,
  _has_db_values: false,
  _table_exists: null,
  _table_name: '',
  status: 'pending'
})

export const criarListaVouchersInicial = () => VOUCHERS_FIXOS.map(criarVoucherInicial)

export const resetarVoucher = (voucher) => {
  voucher.valor_bruto = 0
  voucher.despesa_mdr = 0
  voucher.valor_liquido = 0
  voucher.despesa_antecipacao = 0
  voucher.valor_previsto = 0
  voucher.valor_depositado = 0
  voucher.observacoes = ''
  voucher._bruto_input = '0,00'
  voucher._editing_bruto = false
  voucher._mdr_input = '0,00'
  voucher._editing_mdr = false
  voucher._liquido_input = '0,00'
  voucher._editing_liquido = false
  voucher._antecipacao_input = '0,00'
  voucher._editing_antecipacao = false
  voucher._previsto_input = '0,00'
  voucher._editing_previsto = false
  voucher._depositado_input = '0,00'
  voucher._editing_depositado = false
  voucher._bruto_base_db = 0
  voucher._mdr_base_db = 0
  voucher._liquido_base_db = 0
  voucher._antecipacao_base_db = 0
  voucher._previsto_base_db = 0
  voucher._depositado_base_db = 0
  voucher._bruto_db = 0
  voucher._mdr_db = 0
  voucher._liquido_db = 0
  voucher._antecipacao_db = 0
  voucher._previsto_db = 0
  voucher._depositado_db = 0
  voucher._delta_bruto = 0
  voucher._delta_mdr = 0
  voucher._delta_liquido = 0
  voucher._delta_antecipacao = 0
  voucher._delta_previsto = 0
  voucher._delta_depositado = 0
  voucher._has_db_values = false
  voucher._table_exists = false
  voucher._table_name = ''
  voucher.status = 'pending'
}
