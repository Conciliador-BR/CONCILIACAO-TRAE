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
import { onMounted, onUnmounted } from 'vue'
import { DocumentArrowDownIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  targetId: { type: String, default: 'controladoria-vendas-root' }
})

let afterPrintHandler

const handleExport = () => {
  const target = document.getElementById(props.targetId)
  if (!target) {
    window.print()
    return
  }
  document.body.classList.add('printing-controladoria')
  window.print()
}

onMounted(() => {
  afterPrintHandler = () => {
    document.body.classList.remove('printing-controladoria')
  }
  window.addEventListener('afterprint', afterPrintHandler)
})

onUnmounted(() => {
  if (afterPrintHandler) window.removeEventListener('afterprint', afterPrintHandler)
})
</script>

<style>
/* Garantir que cores e fundos sejam preservados na impressão */
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

@media print {
  /* Oculta todo o conteúdo por padrão quando estiver imprimindo via botão */
  body.printing-controladoria * { visibility: hidden !important; }

  /* Mostra apenas a seção de controladoria de vendas */
  body.printing-controladoria #controladoria-vendas-root,
  body.printing-controladoria #controladoria-vendas-root * {
    visibility: visible !important;
  }

  /* Posiciona a seção no topo para caber no PDF */
  body.printing-controladoria #controladoria-vendas-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  /* Tamanho de página e margens */
  @page { size: A4 portrait; margin: 12mm; }

  /* Compactação dos cards de estatísticas */
  #controladoria-vendas-root .grid { gap: 8px !important; }
  #controladoria-vendas-root .grid > div {
    padding: 10px !important;
    min-height: 80px !important;
    border-radius: 10px !important;
    box-shadow: none !important;
  }
  #controladoria-vendas-root .grid > div p { margin: 2px 0 !important; }
  #controladoria-vendas-root .grid > div p.font-bold { font-size: 16px !important; }
  #controladoria-vendas-root .grid > div p:not(.font-bold) { font-size: 12px !important; }
  #controladoria-vendas-root .grid > div svg { width: 24px !important; height: 24px !important; }

  /* Forçar 2 colunas na impressão para reduzir altura total */
  #controladoria-vendas-root .grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }

  /* Ajustes no header para caber melhor no A4 */
  #controladoria-vendas-root .rounded-2xl { padding: 16px !important; }
  #controladoria-vendas-root h1 { font-size: 22px !important; }
  #controladoria-vendas-root .text-gray-600 { font-size: 12px !important; }
  #controladoria-vendas-root .bg-blue-50, 
  #controladoria-vendas-root .bg-green-50 { padding: 6px 8px !important; }
  #controladoria-vendas-root button { display: none !important; }

  #controladoria-vendas-root .overflow-x-auto { overflow: visible !important; }
  #controladoria-vendas-root table { table-layout: fixed !important; width: 100% !important; }
  #controladoria-vendas-root thead th { padding: 6px !important; font-size: 10px !important; white-space: nowrap !important; }
  #controladoria-vendas-root tbody td, 
  #controladoria-vendas-root tfoot td { padding: 6px !important; font-size: 11px !important; white-space: nowrap !important; }
  #controladoria-vendas-root td.bg-gray-50, 
  #controladoria-vendas-root td.bg-white\/20 { border-radius: 6px !important; }

  #controladoria-vendas-root thead th:first-child,
  #controladoria-vendas-root tbody td:first-child,
  #controladoria-vendas-root tfoot td:first-child { width: 18% !important; }
  #controladoria-vendas-root thead th:first-child { font-size: 9px !important; }
  #controladoria-vendas-root tbody td:first-child span { font-size: 10px !important; }
  #controladoria-vendas-root tbody td:first-child { padding-left: 6px !important; padding-right: 6px !important; }
  #controladoria-vendas-root tbody td:first-child .rounded-full { width: 10px !important; height: 10px !important; margin-right: 6px !important; }

  #controladoria-vendas-root .print-keep { page-break-inside: avoid !important; break-inside: avoid !important; }
  #controladoria-vendas-root .print-break-after { page-break-after: always !important; }
}
</style>