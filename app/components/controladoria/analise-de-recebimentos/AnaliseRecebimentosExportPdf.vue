<template>
  <button
    type="button"
    class="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    @click="handleExport"
  >
    <DocumentArrowDownIcon class="w-5 h-5 mr-2" />
    <span>Exportar PDF</span>
  </button>
  <!-- Área oculta para instruções de impressão; nada é renderizado aqui -->
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { DocumentArrowDownIcon } from '@heroicons/vue/24/solid'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'

const props = defineProps({
  targetId: { type: String, default: 'controladoria-vendas-root' },
  reportPrefix: { type: String, default: 'Controladoria_de_Vendas' },
  layout: { type: String, default: 'vendas' }
})

let afterPrintHandler
let focusHandler
let currentTarget = null
let insertedHeader = null
let originalTargetAttr = null
let originalDocumentTitle = ''
let originalScrollX = 0
let originalScrollY = 0
let originalParent = null
let originalNextSibling = null

const { filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas } = useEmpresas()
const runtimeConfig = useRuntimeConfig()
const logoDataUrl = ref('')

const logoPublicSrc = computed(() => {
  const base = runtimeConfig?.app?.baseURL || '/'
  const baseComBarra = base.endsWith('/') ? base : `${base}/`
  return `${baseComBarra}economic-card-logo.png`
})

const normalizarParaArquivo = (texto) => {
  if (!texto) return 'Todas_as_Empresas'
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const nomeEmpresaSelecionada = computed(() => {
  const empresaId = filtrosGlobais.empresaSelecionada
  if (!empresaId) return 'Todas_as_Empresas'
  const empresa = (empresas.value || []).find(e => e.id == empresaId)
  return empresa?.nome || String(empresaId)
})

const nomeArquivo = computed(() => {
  const empresa = normalizarParaArquivo(nomeEmpresaSelecionada.value)
  return `${props.reportPrefix}_${empresa}_Economic_Card`
})

const obterLogoSrcParaPdf = () => {
  if (logoDataUrl.value) return logoDataUrl.value
  return '/economic-card-logo.png'
}

const carregarLogoDataUrl = async () => {
  if (typeof window === 'undefined') return
  try {
    const principal = new URL(logoPublicSrc.value, window.location.origin).toString()
    let response = await fetch(principal, { cache: 'force-cache' })
    if (!response.ok) {
      response = await fetch('/economic-card-logo.png', { cache: 'force-cache' })
    }
    if (!response.ok) return
    const blob = await response.blob()
    logoDataUrl.value = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (_) {}
}

const inserirCabecalhoPdf = (target) => {
  const header = document.createElement('div')
  header.className = 'pdf-print-header'
  const top = document.createElement('div')
  top.className = 'pdf-print-header-top'
  const img = document.createElement('img')
  img.className = 'pdf-print-logo'
  img.alt = 'Economic Card'
  img.src = obterLogoSrcParaPdf()
  img.decoding = 'sync'
  img.loading = 'eager'
  img.onerror = () => {
    if (img.src !== '/economic-card-logo.png') {
      img.src = '/economic-card-logo.png'
    }
  }
  top.appendChild(img)
  const divider = document.createElement('div')
  divider.className = 'pdf-print-divider'
  header.appendChild(top)
  header.appendChild(divider)
  target.prepend(header)
  return header
}

const aguardarCarregamentoLogo = (header) => {
  return new Promise((resolve) => {
    const img = header?.querySelector('.pdf-print-logo')
    if (!img) {
      resolve()
      return
    }
    if (img.complete) {
      resolve()
      return
    }
    const finalizar = () => resolve()
    img.addEventListener('load', finalizar, { once: true })
    img.addEventListener('error', finalizar, { once: true })
    setTimeout(finalizar, 1200)
  })
}

const resetarEstadoExportacao = () => {
  document.body.classList.remove('printing-controladoria-pdf', 'pdf-layout-vendas', 'pdf-layout-analise', 'pdf-layout-recebimentos')
  if (currentTarget) {
    if (originalTargetAttr === null) {
      currentTarget.removeAttribute('data-print-target')
    } else {
      currentTarget.setAttribute('data-print-target', originalTargetAttr)
    }
  }
  if (currentTarget && originalParent) {
    if (originalNextSibling?.parentNode === originalParent) {
      originalParent.insertBefore(currentTarget, originalNextSibling)
    } else {
      originalParent.appendChild(currentTarget)
    }
  }
  if (insertedHeader?.parentNode) {
    insertedHeader.parentNode.removeChild(insertedHeader)
  }
  if (originalDocumentTitle) {
    document.title = originalDocumentTitle
  }
  if (typeof window !== 'undefined') {
    window.scrollTo(originalScrollX, originalScrollY)
  }
  currentTarget = null
  insertedHeader = null
  originalTargetAttr = null
  originalDocumentTitle = ''
  originalScrollX = 0
  originalScrollY = 0
  originalParent = null
  originalNextSibling = null
}

const handleExport = async () => {
  const target = document.getElementById(props.targetId)
  if (!target) {
    window.print()
    return
  }
  currentTarget = target
  originalTargetAttr = target.getAttribute('data-print-target')
  originalScrollX = window.scrollX || window.pageXOffset || 0
  originalScrollY = window.scrollY || window.pageYOffset || 0
  originalParent = target.parentNode
  originalNextSibling = target.nextSibling
  window.scrollTo(0, 0)
  document.body.prepend(target)
  target.setAttribute('data-print-target', 'true')
  insertedHeader = inserirCabecalhoPdf(target)

  document.body.classList.add('printing-controladoria-pdf')
  if (props.layout === 'analise') {
    document.body.classList.add('pdf-layout-analise')
  } else if (props.layout === 'recebimentos') {
    document.body.classList.add('pdf-layout-recebimentos')
  } else {
    document.body.classList.add('pdf-layout-vendas')
  }

  originalDocumentTitle = document.title
  document.title = nomeArquivo.value
  await nextTick()
  if (insertedHeader) {
    await aguardarCarregamentoLogo(insertedHeader)
  }
  window.print()
}

onMounted(() => {
  carregarLogoDataUrl().catch(() => {})
  fetchEmpresas().catch(() => {})
  afterPrintHandler = () => {
    resetarEstadoExportacao()
  }
  focusHandler = () => {
    if (document.body.classList.contains('printing-controladoria-pdf')) {
      setTimeout(() => {
        resetarEstadoExportacao()
      }, 150)
    }
  }
  window.addEventListener('afterprint', afterPrintHandler)
  window.addEventListener('focus', focusHandler)
})

onUnmounted(() => {
  resetarEstadoExportacao()
  if (afterPrintHandler) window.removeEventListener('afterprint', afterPrintHandler)
  if (focusHandler) window.removeEventListener('focus', focusHandler)
})
</script>

<style>
/* Garantir que cores e fundos sejam preservados na impressão */
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.pdf-print-header {
  display: none !important;
}

@media print {
  html,
  body.printing-controladoria-pdf {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    overflow: visible !important;
  }
  /* Oculta todo o conteúdo por padrão quando estiver imprimindo via botão */
  body.printing-controladoria-pdf * { visibility: hidden !important; }

  /* Mostra apenas a seção selecionada para exportação */
  body.printing-controladoria-pdf [data-print-target="true"],
  body.printing-controladoria-pdf [data-print-target="true"] * {
    visibility: visible !important;
  }

  body.printing-controladoria-pdf [data-print-target="true"] {
    position: static !important;
    inset: auto !important;
    width: 100% !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box;
    transform: none !important;
    z-index: auto !important;
    background: #fff !important;
  }

  /* Tamanho de página e margens */
  @page { size: A4 portrait; margin: 0; }
  @page pdf-recebimentos { size: A4 portrait; margin: 0; }

  .pdf-print-header {
    display: block !important;
    margin-bottom: 14px !important;
    border-radius: 10px !important;
    overflow: hidden !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08) !important;
  }

  .pdf-print-header-top {
    background: linear-gradient(90deg, #102a43 0%, #163a5a 50%, #1f4f77 100%) !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 12px 10px !important;
    min-height: 92px !important;
  }

  .pdf-print-divider {
    height: 4px !important;
    background: linear-gradient(90deg, #73c77d 0%, #7ece89 50%, #8ad795 100%) !important;
  }

  .pdf-print-logo {
    width: 260px !important;
    max-width: 85% !important;
    height: auto !important;
    object-fit: contain !important;
    display: block !important;
  }

  body.pdf-layout-analise [data-print-target="true"] button { display: none !important; }
  body.pdf-layout-analise [data-print-target="true"] {
    position: static !important;
    inset: auto !important;
    min-height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    z-index: auto !important;
  }
  body.pdf-layout-analise .pdf-print-header {
    margin-bottom: 8px !important;
    border-radius: 0 !important;
  }
  body.pdf-layout-analise .pdf-print-header-top {
    min-height: 80px !important;
    padding: 8px !important;
  }
  body.pdf-layout-analise .pdf-print-logo {
    width: 230px !important;
    max-width: 92% !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-grid-primary,
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-grid-secondary {
    gap: 8px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-grid-primary {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-grid-secondary {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-card {
    padding: 8px !important;
    border-radius: 8px !important;
    min-height: 64px !important;
    box-shadow: none !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-card .h-8.w-8 {
    width: 18px !important;
    height: 18px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-card .ml-4 {
    margin-left: 8px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-card .text-2xl {
    font-size: 13px !important;
    line-height: 1.15 !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-card .text-xl {
    font-size: 12px !important;
    line-height: 1.15 !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-card .text-sm {
    font-size: 10px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-card .text-xs {
    font-size: 9px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-stats-card p {
    margin-top: 1px !important;
    margin-bottom: 1px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-graficos-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 6px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .p-6 { padding: 24px !important; }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card h3 { font-size: 18px !important; margin-bottom: 24px !important; }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .h-80 { height: 320px !important; }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .analise-pie-layout {
    display: flex !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .analise-chart-canvas-wrap {
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .analise-valores-laterais {
    margin-top: 0 !important;
    width: 170px !important;
    min-width: 170px !important;
    flex: 0 0 170px !important;
    padding: 8px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .mt-4 {
    margin-top: 8px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .pt-4 {
    padding-top: 6px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .grid.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    column-gap: 4px !important;
    row-gap: 6px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .text-xs {
    font-size: 9px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-grafico-card .truncate {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
    line-height: 1.15 !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-primeira-pagina {
    page-break-inside: auto !important;
    break-inside: auto !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-detalhes-adquirentes {
    page-break-before: always !important;
    break-before: page !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-modalidade-section {
    page-break-before: auto !important;
    break-before: auto !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
    margin-top: 6px !important;
    padding: 10px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-modalidades-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 6px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-modalidade-card {
    padding: 7px !important;
    border-radius: 8px !important;
    min-height: 70px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-modalidade-card .mb-3 {
    margin-bottom: 4px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-modalidade-card .space-y-2 > * + * {
    margin-top: 2px !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-modalidade-card .text-sm {
    font-size: 9px !important;
    line-height: 1.15 !important;
  }
  body.pdf-layout-analise [data-print-target="true"] .analise-modalidade-card .text-xs {
    font-size: 8px !important;
    line-height: 1.1 !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] {
    display: block !important;
    overflow: visible !important;
    background: #fff !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] > * + * {
    margin-top: 10px !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .pointer-events-none.absolute {
    display: none !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-header,
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-stats,
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-section,
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-grafico {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-header > .relative > .flex {
    gap: 10px !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-primary {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-insights {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-secondary {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-grafico-botoes {
    display: none !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-grafico-body {
    display: block !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-canvas,
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-grafico .h-80 {
    height: 220px !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-tabela {
    overflow: visible !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-tabela thead {
    position: static !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-tabela th,
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .analise-recebimentos-print-tabela td {
    font-size: 9px !important;
    padding: 6px 8px !important;
    line-height: 1.35 !important;
    white-space: normal !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .grid.grid-cols-1.gap-8 {
    display: block !important;
  }
  body.pdf-layout-analise #analise-de-recebimentos-root[data-print-target="true"] .grid.grid-cols-1.gap-8 > * + * {
    margin-top: 10px !important;
  }

  body.pdf-layout-recebimentos [data-print-target="true"] {
    page: pdf-recebimentos;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 10px !important;
    line-height: 1.15 !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .space-y-6 > * {
    margin-top: 6px !important;
    margin-bottom: 0 !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .rounded-2xl {
    border-radius: 8px !important;
    box-shadow: none !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .text-3xl { font-size: 16px !important; line-height: 1.1 !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .text-2xl { font-size: 14px !important; line-height: 1.1 !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .text-xl { font-size: 12px !important; line-height: 1.1 !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .text-lg { font-size: 11px !important; line-height: 1.1 !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .text-sm { font-size: 10px !important; line-height: 1.1 !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .text-xs { font-size: 9px !important; line-height: 1.05 !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .px-8 { padding-left: 8px !important; padding-right: 8px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .px-6 { padding-left: 6px !important; padding-right: 6px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .p-6 { padding: 8px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .p-5 { padding: 7px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .p-4 { padding: 6px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .py-6 { padding-top: 8px !important; padding-bottom: 8px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .py-5 { padding-top: 6px !important; padding-bottom: 6px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .py-4 { padding-top: 5px !important; padding-bottom: 5px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .min-h-\[120px\],
  body.pdf-layout-recebimentos [data-print-target="true"] .sm\:min-h-\[140px\] { min-height: 64px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .grid {
    gap: 6px !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .overflow-hidden,
  body.pdf-layout-recebimentos [data-print-target="true"] .overflow-x-auto { overflow: visible !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] table {
    width: 100% !important;
    table-layout: auto !important;
    border-collapse: collapse !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] th,
  body.pdf-layout-recebimentos [data-print-target="true"] td {
    padding: 8px 5px !important;
    font-size: 8px !important;
    line-height: 1.5 !important;
    white-space: normal !important;
    word-break: break-word !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] thead th {
    font-size: 8px !important;
    letter-spacing: 0 !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .col-acoes-pdf { display: none !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .pdf-observacao-btn {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    border-radius: 0 !important;
    width: 100% !important;
    pointer-events: none !important;
    justify-content: flex-start !important;
    color: inherit !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .pdf-observacao-btn svg { display: none !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .w-3.h-3.rounded-full {
    width: 6px !important;
    height: 6px !important;
    margin-right: 4px !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .w-8,
  body.pdf-layout-recebimentos [data-print-target="true"] .h-8,
  body.pdf-layout-recebimentos [data-print-target="true"] .w-10,
  body.pdf-layout-recebimentos [data-print-target="true"] .h-10,
  body.pdf-layout-recebimentos [data-print-target="true"] .w-12,
  body.pdf-layout-recebimentos [data-print-target="true"] .h-12 {
    width: 14px !important;
    height: 14px !important;
  }

  /* Compactação dos cards de estatísticas */
  body.pdf-layout-vendas [data-print-target="true"] .grid { gap: 8px !important; }
  body.pdf-layout-vendas [data-print-target="true"] .grid > div {
    width: 100% !important;
    max-width: 220px !important;
    margin: 0 auto !important;
    padding: 10px !important;
    min-height: 80px !important;
    border-radius: 10px !important;
    box-shadow: none !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] .grid > div p { margin: 2px 0 !important; }
  body.pdf-layout-vendas [data-print-target="true"] .grid > div p.font-bold { font-size: 16px !important; }
  body.pdf-layout-vendas [data-print-target="true"] .grid > div p:not(.font-bold) { font-size: 12px !important; }
  body.pdf-layout-vendas [data-print-target="true"] .grid > div svg { width: 24px !important; height: 24px !important; }

  /* Forçar 4 colunas para manter os cards lado a lado */
  body.pdf-layout-vendas [data-print-target="true"] .grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; justify-items: center !important; }

  /* Ajustes no header para caber melhor no A4 */
  body.pdf-layout-vendas [data-print-target="true"] .rounded-2xl { padding: 16px !important; }
  body.pdf-layout-vendas [data-print-target="true"] h1 { font-size: 22px !important; }
  body.pdf-layout-vendas [data-print-target="true"] .text-gray-600 { font-size: 12px !important; }
  body.pdf-layout-vendas [data-print-target="true"] .bg-blue-50, 
  body.pdf-layout-vendas [data-print-target="true"] .bg-green-50 { padding: 6px 8px !important; }
  body.pdf-layout-vendas [data-print-target="true"] button { display: none !important; }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child button {
    display: inline-flex !important;
    align-items: center !important;
    background: transparent !important;
    border: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    pointer-events: none !important;
  }

  body.pdf-layout-vendas [data-print-target="true"] .overflow-x-auto { overflow: visible !important; }
  body.pdf-layout-vendas [data-print-target="true"] table { table-layout: auto !important; width: 100% !important; }
  body.pdf-layout-vendas [data-print-target="true"] thead th { padding: 7px 6px !important; font-size: 9px !important; line-height: 1.35 !important; white-space: normal !important; }
  body.pdf-layout-vendas [data-print-target="true"] tbody td, 
  body.pdf-layout-vendas [data-print-target="true"] tfoot td { padding: 9px 6px !important; font-size: 10px !important; line-height: 1.5 !important; white-space: normal !important; }
  body.pdf-layout-vendas [data-print-target="true"] td.bg-gray-50, 
  body.pdf-layout-vendas [data-print-target="true"] td.bg-white\/20 { border-radius: 6px !important; }

  body.pdf-layout-vendas [data-print-target="true"] thead th:first-child,
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child,
  body.pdf-layout-vendas [data-print-target="true"] tfoot td:first-child { width: 18% !important; }
  body.pdf-layout-vendas [data-print-target="true"] thead th:first-child { font-size: 8px !important; }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child span { font-size: 9px !important; }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child { padding-left: 6px !important; padding-right: 6px !important; }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child .rounded-full { width: 10px !important; height: 10px !important; margin-right: 6px !important; }

  body.pdf-layout-vendas [data-print-target="true"] table thead th:nth-child(12):nth-last-child(1),
  body.pdf-layout-vendas [data-print-target="true"] table tbody td:nth-child(12):nth-last-child(1),
  body.pdf-layout-vendas [data-print-target="true"] table tfoot td:nth-child(12):nth-last-child(1),
  body.pdf-layout-vendas [data-print-target="true"] table thead th:nth-child(10):nth-last-child(2),
  body.pdf-layout-vendas [data-print-target="true"] table tbody td:nth-child(10):nth-last-child(2),
  body.pdf-layout-vendas [data-print-target="true"] table tfoot td:nth-child(10):nth-last-child(2),
  body.pdf-layout-vendas [data-print-target="true"] table thead th:nth-child(11):nth-last-child(1),
  body.pdf-layout-vendas [data-print-target="true"] table tbody td:nth-child(11):nth-last-child(1),
  body.pdf-layout-vendas [data-print-target="true"] table tfoot td:nth-child(11):nth-last-child(1) { display: none !important; }

  body.pdf-layout-vendas [data-print-target="true"] .print-keep { page-break-inside: avoid !important; break-inside: avoid !important; }
  body.pdf-layout-vendas [data-print-target="true"] .print-break-after { page-break-after: always !important; }
  body.pdf-layout-vendas [data-print-target="true"] a[href]::after { content: none !important; }
  body.pdf-layout-vendas [data-print-target="true"] a[href] { text-decoration: none !important; color: inherit !important; }
}
</style>
