<template>
  <button
    type="button"
    class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-700"
    @click="abrirMenu"
  >
    <DocumentArrowDownIcon class="mr-2 h-5 w-5" />
    <span>Exportar PDF</span>
  </button>

  <ControladoriaPdfExportMenu
    :open="widgetVisivel && menuAberto"
    :options="options"
    :selected-ids="selectedPageIds"
    :loading="exportando"
    :status="statusExportacao"
    :progress-label="progressoRotulo"
    :all-selected="allSelected"
    :download-file-name="arquivoPronto?.fileName || ''"
    @close="fecharMenu"
    @minimize="minimizarMenu"
    @confirm="confirmarExportacao"
    @download="baixarArquivoFinal"
    @toggle-option="alternarPage"
    @toggle-all="alternarTodas"
  />

  <ControladoriaPdfExportWidget
    :visible="widgetVisivel && !menuAberto"
    :loading="exportando"
    :title="tituloWidget"
    :status="statusExportacao || 'Selecione as pages e gere os arquivos.'"
    :progress-label="progressoRotulo"
    :progress-percent="percentualProgresso"
    :download-ready="Boolean(arquivoPronto)"
    @open="reabrirMenu"
    @close="fecharMenu"
  />

  <ControladoriaPdfHiddenRenderer :page-ids="renderedPageIds" :render-key="renderCycle" />
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DocumentArrowDownIcon } from '@heroicons/vue/24/solid'
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import ControladoriaPdfExportMenu from '~/components/controladoria/exportacao_pdf/shared/ControladoriaPdfExportMenu.vue'
import ControladoriaPdfExportWidget from '~/components/controladoria/exportacao_pdf/shared/ControladoriaPdfExportWidget.vue'
import ControladoriaPdfHiddenRenderer from '~/components/controladoria/exportacao_pdf/shared/ControladoriaPdfHiddenRenderer.vue'
import { CONTROLADORIA_PDF_OPTIONS, getPdfOptionById } from '~/components/controladoria/exportacao_pdf/shared/exportRegistry'
import { normalizarParaArquivo, sleep, waitForPdfTarget } from '~/components/controladoria/exportacao_pdf/shared/pdfExportUtils'
import { baixarBlob, criarDownloadUrl, gerarArquivoCompactado, gerarPdfBlobDaPage, revogarDownloadUrl } from '~/components/controladoria/exportacao_pdf/shared/pdfGenerationUtils'

const props = defineProps({
  currentPageId: {
    type: String,
    required: true
  }
})

const menuAberto = ref(false)
const widgetVisivel = ref(false)
const exportando = ref(false)
const statusExportacao = ref('')
const selectedPageIds = ref([props.currentPageId])
const renderedPageIds = ref([])
const renderCycle = ref(0)
const logoDataUrl = ref('')
const totalEtapas = ref(0)
const etapaAtual = ref(0)
const arquivoPronto = ref(null)
const arquivosGerados = ref([])

const runtimeConfig = useRuntimeConfig()
const { filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas } = useEmpresas()

const options = CONTROLADORIA_PDF_OPTIONS

const allSelected = computed(() => {
  return selectedPageIds.value.length === options.length
})

const percentualProgresso = computed(() => {
  if (!totalEtapas.value) return arquivoPronto.value ? 100 : 0
  return Math.max(0, Math.min(100, Math.round((etapaAtual.value / totalEtapas.value) * 100)))
})

const progressoRotulo = computed(() => {
  if (!totalEtapas.value) {
    return arquivoPronto.value ? '100%' : 'Aguardando inicio'
  }

  return `${etapaAtual.value}/${totalEtapas.value} etapas`
})

const tituloWidget = computed(() => {
  if (arquivoPronto.value) return 'Arquivo pronto para download'
  if (exportando.value) return 'Processando exportacao em segundo plano'
  return 'Clique para continuar a exportacao'
})

const logoPublicSrc = computed(() => {
  const base = runtimeConfig?.app?.baseURL || '/'
  const baseComBarra = base.endsWith('/') ? base : `${base}/`
  return `${baseComBarra}economic-card-logo.png`
})

const nomeEmpresaSelecionada = computed(() => {
  const empresaId = filtrosGlobais.empresaSelecionada
  if (!empresaId) return 'Todas_as_Empresas'
  const empresa = (empresas.value || []).find(item => item.id == empresaId)
  return empresa?.nome || String(empresaId)
})

const empresaSelecionadaDetalhes = computed(() => {
  const empresaId = filtrosGlobais.empresaSelecionada
  if (!empresaId) return null
  return (empresas.value || []).find(item => item.id == empresaId) || null
})

const obterTokenUnidade = (empresa) => {
  const nomeMatriz = String(empresa?.nomeMatriz || '').trim()
  const nomeMatrizNormalizado = nomeMatriz.toLowerCase()

  if (nomeMatrizNormalizado.includes('matriz')) return 'MATRIZ'

  if (nomeMatrizNormalizado.includes('filial')) {
    const numeroFilial = nomeMatriz.match(/filial\D*(\d{1,2})/i)?.[1]
    if (numeroFilial) {
      return `FILIAL_${String(numeroFilial).padStart(2, '0')}`
    }
    return 'FILIAL'
  }

  return 'UNIDADE'
}

const obterRotuloUnidade = (empresa) => {
  const token = obterTokenUnidade(empresa)
  return token.replace(/_/g, ' ')
}

const tipoUnidadeSelecionada = computed(() => {
  return obterTokenUnidade(empresaSelecionadaDetalhes.value)
})

const nomeArquivoZip = computed(() => {
  const empresa = normalizarParaArquivo(nomeEmpresaSelecionada.value)
  const tipo = normalizarParaArquivo(tipoUnidadeSelecionada.value || 'UNIDADE')
  return `CONTROLADORIA_${empresa}_${tipo}.zip`
})

const abrirMenu = () => {
  if (!widgetVisivel.value) {
    selectedPageIds.value = [props.currentPageId]
  }

  statusExportacao.value = statusExportacao.value || ''
  widgetVisivel.value = true
  menuAberto.value = true
}

const fecharMenu = () => {
  if (exportando.value) return
  limparArquivosGerados()
  menuAberto.value = false
  widgetVisivel.value = false
  statusExportacao.value = ''
  renderedPageIds.value = []
  totalEtapas.value = 0
  etapaAtual.value = 0
}

const minimizarMenu = () => {
  widgetVisivel.value = true
  menuAberto.value = false
}

const reabrirMenu = () => {
  widgetVisivel.value = true
  menuAberto.value = true
}

const alternarPage = (pageId) => {
  if (exportando.value) return

  if (selectedPageIds.value.includes(pageId)) {
    selectedPageIds.value = selectedPageIds.value.filter(id => id !== pageId)
    return
  }

  selectedPageIds.value = [...selectedPageIds.value, pageId]
}

const alternarTodas = () => {
  if (exportando.value) return

  if (allSelected.value) {
    selectedPageIds.value = []
    return
  }

  selectedPageIds.value = options.map(option => option.id)
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

const obterLogoSrcParaPdf = () => {
  if (logoDataUrl.value) return logoDataUrl.value
  return '/economic-card-logo.png'
}

const montarPaginasOcultas = async (pageIds) => {
  const idsParaRenderizar = pageIds.filter((pageId) => {
    const option = getPdfOptionById(pageId)
    if (!option) return false

    if (pageId === props.currentPageId && document.getElementById(option.targetId)) {
      return false
    }

    return true
  })

  renderedPageIds.value = idsParaRenderizar
  renderCycle.value += 1
  await nextTick()
  await sleep(120)
}

const prepararPaginasSelecionadas = async (pageIds) => {
  await montarPaginasOcultas(pageIds)

  for (const pageId of pageIds) {
    const option = getPdfOptionById(pageId)
    if (!option) continue

    statusExportacao.value = `Carregando ${option.label}...`
    const target = await waitForPdfTarget({
      targetId: option.targetId,
      timeoutMs: option.timeoutMs,
      settleMs: option.settleMs
    })

    if (!target) {
      throw new Error(`Nao foi possivel carregar ${option.label} para exportacao.`)
    }
  }
}

const buildFileName = (option) => {
  const empresa = normalizarParaArquivo(nomeEmpresaSelecionada.value)
  return `${option.reportPrefix}_${empresa}_Economic_Card`
}

const limparArquivosGerados = () => {
  if (arquivoPronto.value?.url) {
    revogarDownloadUrl(arquivoPronto.value.url)
  }

  arquivosGerados.value.forEach((file) => {
    if (file.url) {
      revogarDownloadUrl(file.url)
    }
  })

  arquivoPronto.value = null
  arquivosGerados.value = []
}

const exportarPage = async (option) => {
  const target = document.getElementById(option.targetId)

  if (!target) {
    throw new Error(`Target ${option.targetId} nao encontrado.`)
  }

  const fileName = `${buildFileName(option)}.pdf`
  const blob = await gerarPdfBlobDaPage({
    target,
    option,
    logoSrc: obterLogoSrcParaPdf(),
    fileName
  })

  return {
    blob,
    fileName,
    pageId: option.id
  }
}

const prepararDownloadFinal = async (files) => {
  limparArquivosGerados()

  arquivosGerados.value = files.map((file) => ({
    ...file,
    url: criarDownloadUrl(file.blob)
  }))

  if (files.length === 1) {
    arquivoPronto.value = {
      type: 'pdf',
      fileName: files[0].fileName,
      blob: files[0].blob,
      url: arquivosGerados.value[0].url
    }
    return
  }

  const bundle = await gerarArquivoCompactado({
    files,
    fileName: nomeArquivoZip.value
  })

  arquivoPronto.value = {
    type: 'zip',
    fileName: bundle.fileName,
    blob: bundle.blob,
    url: criarDownloadUrl(bundle.blob)
  }
}

const baixarArquivoFinal = () => {
  if (!arquivoPronto.value?.blob) return
  baixarBlob({
    blob: arquivoPronto.value.blob,
    fileName: arquivoPronto.value.fileName
  })
}

const confirmarExportacao = async () => {
  const orderedIds = options
    .map(option => option.id)
    .filter(id => selectedPageIds.value.includes(id))

  if (orderedIds.length === 0) return

  limparArquivosGerados()
  exportando.value = true
  widgetVisivel.value = true
  menuAberto.value = false
  totalEtapas.value = orderedIds.length * 2 + (orderedIds.length > 1 ? 1 : 0)
  etapaAtual.value = 0

  try {
    const pdfs = []

    await prepararPaginasSelecionadas(orderedIds)
    etapaAtual.value = orderedIds.length

    for (const pageId of orderedIds) {
      const option = getPdfOptionById(pageId)
      if (!option) continue

      statusExportacao.value = `Gerando ${option.label}...`
      const arquivoPdf = await exportarPage(option)
      pdfs.push(arquivoPdf)
      etapaAtual.value += 1
      await sleep(150)
    }

    if (pdfs.length > 1) {
      statusExportacao.value = 'Compactando arquivos em um unico download...'
    } else {
      statusExportacao.value = 'Preparando download do PDF...'
    }

    await prepararDownloadFinal(pdfs)

    if (pdfs.length > 1) {
      etapaAtual.value += 1
    }

    statusExportacao.value = 'Exportacao concluida. Clique em download para salvar o arquivo.'
    menuAberto.value = true
  } catch (error) {
    statusExportacao.value = error?.message || 'Nao foi possivel gerar os PDFs selecionados.'
    menuAberto.value = true
  } finally {
    exportando.value = false
    renderedPageIds.value = []
  }
}

watch(() => props.currentPageId, (pageId) => {
  selectedPageIds.value = [pageId]
})

onMounted(() => {
  carregarLogoDataUrl().catch(() => {})
  fetchEmpresas().catch(() => {})
})

onBeforeUnmount(() => {
  limparArquivosGerados()
})
</script>

<style>
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

  body.printing-controladoria-pdf * { visibility: hidden !important; }

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
  body.pdf-layout-recebimentos [data-print-target="true"] .space-y-6 > * { margin-top: 6px !important; margin-bottom: 0 !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .rounded-2xl { padding: 16px !important; border-radius: 8px !important; box-shadow: none !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] h1 { font-size: 22px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .text-gray-600 { font-size: 12px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .bg-blue-50,
  body.pdf-layout-recebimentos [data-print-target="true"] .bg-green-50 { padding: 6px 8px !important; }
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
  body.pdf-layout-recebimentos [data-print-target="true"] .grid { gap: 8px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .grid > div {
    width: 100% !important;
    max-width: 220px !important;
    margin: 0 auto !important;
    padding: 10px !important;
    min-height: 80px !important;
    border-radius: 10px !important;
    box-shadow: none !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .grid > div p { margin: 2px 0 !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .grid > div p.font-bold { font-size: 16px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .grid > div p:not(.font-bold) { font-size: 12px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .grid > div svg { width: 24px !important; height: 24px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; justify-items: center !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] .overflow-hidden,
  body.pdf-layout-recebimentos [data-print-target="true"] .overflow-x-auto { overflow: visible !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] button { display: none !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody td:first-child button {
    display: inline-flex !important;
    align-items: center !important;
    background: transparent !important;
    border: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    pointer-events: none !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] table {
    width: 100% !important;
    table-layout: auto !important;
    border-collapse: collapse !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] thead tr,
  body.pdf-layout-recebimentos [data-print-target="true"] tbody tr,
  body.pdf-layout-recebimentos [data-print-target="true"] tfoot tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] thead th { padding: 7px 6px !important; font-size: 9px !important; line-height: 1.35 !important; letter-spacing: 0 !important; white-space: normal !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody td,
  body.pdf-layout-recebimentos [data-print-target="true"] tfoot td {
    padding: 10px 6px !important;
    font-size: 10px !important;
    line-height: 1.6 !important;
    white-space: normal !important;
    word-break: break-word !important;
    vertical-align: middle !important;
    overflow: visible !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] td.bg-gray-50,
  body.pdf-layout-recebimentos [data-print-target="true"] td.bg-white\/20 {
    border-radius: 6px !important;
    background-clip: padding-box !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .col-adquirente-pdf { width: 16% !important; max-width: 16% !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] thead .col-adquirente-pdf { font-size: 8px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody .col-adquirente-pdf span { font-size: 9px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody .col-adquirente-pdf {
    padding-left: 6px !important;
    padding-right: 6px !important;
    vertical-align: top !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody .col-adquirente-pdf .rounded-full { width: 10px !important; height: 10px !important; margin-right: 6px !important; }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody .col-adquirente-pdf > div {
    display: flex !important;
    align-items: flex-start !important;
    min-height: 32px !important;
    overflow: visible !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody .col-adquirente-pdf button {
    width: 100% !important;
    min-height: 32px !important;
    display: inline-flex !important;
    align-items: flex-start !important;
    justify-content: flex-start !important;
    line-height: 1.6 !important;
    padding-top: 4px !important;
    padding-bottom: 4px !important;
    overflow: visible !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody .col-adquirente-pdf button span {
    display: inline-flex !important;
    align-items: center !important;
    min-height: 24px !important;
    line-height: 1.6 !important;
    vertical-align: middle !important;
    white-space: normal !important;
    word-break: break-word !important;
    padding-top: 2px !important;
    padding-bottom: 2px !important;
    overflow: visible !important;
    text-overflow: clip !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody td.bg-gray-50,
  body.pdf-layout-recebimentos [data-print-target="true"] tbody td.bg-white\/20,
  body.pdf-layout-recebimentos [data-print-target="true"] tfoot td.bg-gray-50,
  body.pdf-layout-recebimentos [data-print-target="true"] tfoot td.bg-white\/20 {
    text-align: right !important;
    vertical-align: middle !important;
    overflow: visible !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody td.bg-gray-50 *,
  body.pdf-layout-recebimentos [data-print-target="true"] tbody td.bg-white\/20 *,
  body.pdf-layout-recebimentos [data-print-target="true"] tfoot td.bg-white\/20 * {
    line-height: 1.45 !important;
    vertical-align: middle !important;
    overflow: visible !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] tbody td > span,
  body.pdf-layout-recebimentos [data-print-target="true"] tfoot td > span {
    display: inline-block !important;
    line-height: 1.5 !important;
    padding-top: 1px !important;
    padding-bottom: 1px !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .truncate {
    white-space: normal !important;
    word-break: break-word !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] input {
    min-height: 30px !important;
    height: auto !important;
    line-height: 1.45 !important;
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }
  body.pdf-layout-recebimentos [data-print-target="true"] .col-antecipacao-pdf { width: 11% !important; max-width: 11% !important; }
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
  body.pdf-layout-vendas [data-print-target="true"] .grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; justify-items: center !important; }
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
  body.pdf-layout-vendas [data-print-target="true"] .overflow-hidden,
  body.pdf-layout-vendas [data-print-target="true"] .overflow-x-auto { overflow: visible !important; }
  body.pdf-layout-vendas [data-print-target="true"] table {
    width: 100% !important;
    table-layout: auto !important;
    border-collapse: collapse !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] thead th {
    padding: 5px 4px !important;
    font-size: 7px !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    white-space: normal !important;
    word-break: break-word !important;
    vertical-align: middle !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] tbody td,
  body.pdf-layout-vendas [data-print-target="true"] tfoot td {
    padding: 6px 4px !important;
    font-size: 8px !important;
    line-height: 1.25 !important;
    white-space: nowrap !important;
    word-break: normal !important;
    vertical-align: middle !important;
    overflow: visible !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] td.bg-gray-50,
  body.pdf-layout-vendas [data-print-target="true"] td.bg-white\/20 {
    border-radius: 6px !important;
    background-clip: padding-box !important;
    padding-top: 10px !important;
    padding-bottom: 10px !important;
    line-height: 1.4 !important;
    vertical-align: middle !important;
    overflow: visible !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] td.bg-gray-50 *,
  body.pdf-layout-vendas [data-print-target="true"] td.bg-white\/20 * {
    line-height: 1.4 !important;
    vertical-align: middle !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] thead th:first-child,
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child,
  body.pdf-layout-vendas [data-print-target="true"] tfoot td:first-child { width: 16% !important; max-width: 16% !important; }
  body.pdf-layout-vendas [data-print-target="true"] thead th:first-child { font-size: 7px !important; }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child {
    white-space: normal !important;
    word-break: break-word !important;
    vertical-align: top !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child span {
    font-size: 8px !important;
    line-height: 1.3 !important;
    white-space: normal !important;
    word-break: break-word !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child { padding-left: 4px !important; padding-right: 4px !important; }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child .rounded-full { width: 8px !important; height: 8px !important; margin-right: 4px !important; }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child > div {
    display: flex !important;
    align-items: flex-start !important;
    min-height: 22px !important;
    overflow: visible !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child button {
    width: 100% !important;
    min-height: 22px !important;
    display: inline-flex !important;
    align-items: flex-start !important;
    justify-content: flex-start !important;
    line-height: 1.3 !important;
    padding-top: 1px !important;
    padding-bottom: 1px !important;
    overflow: visible !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child button span,
  body.pdf-layout-vendas [data-print-target="true"] tbody td:first-child .truncate {
    display: inline !important;
    white-space: normal !important;
    word-break: break-word !important;
    overflow: visible !important;
    text-overflow: clip !important;
    min-width: 0 !important;
    flex: 1 1 auto !important;
  }
  body.pdf-layout-vendas [data-print-target="true"] .col-acoes-pdf { display: none !important; }
  body.pdf-layout-vendas [data-print-target="true"] .print-keep { page-break-inside: avoid !important; break-inside: avoid !important; }
  body.pdf-layout-vendas [data-print-target="true"] .print-break-after { page-break-after: always !important; }
  body.pdf-layout-vendas [data-print-target="true"] a[href]::after { content: none !important; }
  body.pdf-layout-vendas [data-print-target="true"] a[href] { text-decoration: none !important; color: inherit !important; }
}
</style>
