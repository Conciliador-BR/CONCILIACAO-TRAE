export const CONTROLADORIA_PDF_OPTIONS = [
  {
    id: 'vendas',
    label: 'Controladoria de Vendas',
    descricao: 'Cards, detalhamento por adquirente, PIX e vouchers',
    targetId: 'controladoria-vendas-root',
    reportPrefix: 'Controladoria_de_Vendas',
    layout: 'vendas',
    timeoutMs: 20000,
    settleMs: 900,
    loader: () => import('~/pages/controladoria/controladoria-vendas.vue')
  },
  {
    id: 'recebimentos',
    label: 'Controladoria de Recebimentos',
    descricao: 'Resumo, containers de recebimentos, PIX e vouchers',
    targetId: 'controladoria-recebimentos-root',
    reportPrefix: 'Controladoria_de_Recebimentos',
    layout: 'recebimentos',
    timeoutMs: 22000,
    settleMs: 1400,
    loader: () => import('~/pages/controladoria/controladoria-recebimentos.vue')
  },
  {
    id: 'analise_de_vendas',
    label: 'Analise de Vendas',
    descricao: 'Indicadores, graficos, adquirentes e vouchers',
    targetId: 'analise-de-vendas-root',
    reportPrefix: 'Analise_de_Vendas',
    layout: 'analise',
    timeoutMs: 22000,
    settleMs: 1200,
    loader: () => import('~/pages/controladoria/analise-de-vendas.vue')
  },
  {
    id: 'analise_de_recebimentos',
    label: 'Analise de Recebimentos',
    descricao: 'Indicadores, rankings, graficos e nomenclaturas',
    targetId: 'analise-de-recebimentos-root',
    reportPrefix: 'Analise_de_Recebimentos',
    layout: 'analise',
    timeoutMs: 22000,
    settleMs: 1400,
    loader: () => import('~/pages/controladoria/analise-de-recebimentos.vue')
  }
]

export const getPdfOptionById = (pageId) => {
  return CONTROLADORIA_PDF_OPTIONS.find(option => option.id === pageId) || null
}
