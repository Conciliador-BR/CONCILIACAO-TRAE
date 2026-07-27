const normalizeVoucherOperator = (operadora) => {
  const normalized = String(operadora || '').trim().toLowerCase()
  return normalized === 'pluxe' ? 'pluxee' : normalized
}

const VOUCHER_PROCESSOR_LOADERS = {
  alelo: async () => {
    const mod = await import('~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_alelo.js')
    return mod.useProcessorVendasVoucherAlelo()
  },
  pluxee: async () => {
    const mod = await import('~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_pluxee.js')
    return mod.useProcessorVendasVoucherPluxee()
  },
  ticket: async () => {
    const mod = await import('~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_ticket.js')
    return mod.useProcessorVendasVoucherTicket()
  },
  vr: async () => {
    const mod = await import('~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_vr.js')
    return mod.useProcessorVendasVoucherVR()
  },
  comprocard: async () => {
    const mod = await import('~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_comprocard.js')
    return mod.useProcessorVendasVoucherComprocard()
  },
  lecard: async () => {
    const mod = await import('~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_lecard.js')
    return mod.useProcessorVendasVoucherLecard()
  },
  upbrasil: async () => {
    const mod = await import('~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_upbrasil.js')
    return mod.useProcessorVendasVoucherUpBrasil()
  }
}

export const loadVoucherProcessor = async (operadora) => {
  const normalized = normalizeVoucherOperator(operadora)
  const loader = VOUCHER_PROCESSOR_LOADERS[normalized]

  if (!loader) {
    throw new Error(`Processador de voucher nao suportado: ${operadora}`)
  }

  return loader()
}

export const isVoucherOperator = (operadora) => {
  return !!VOUCHER_PROCESSOR_LOADERS[normalizeVoucherOperator(operadora)]
}
