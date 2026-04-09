<template>
  <button
    type="button"
    class="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    @click="handleExport"
  >
    <DocumentArrowDownIcon class="w-5 h-5 mr-2" />
    <span>Exportar PDF</span>
  </button>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { DocumentArrowDownIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  targetId: { type: String, default: 'controladoria-recebimentos-root' }
})

let afterPrintHandler

const handleExport = () => {
  const target = document.getElementById(props.targetId)
  if (!target) {
    window.print()
    return
  }
  document.body.classList.add('printing-controladoria-recebimentos')
  window.print()
}

onMounted(() => {
  afterPrintHandler = () => {
    document.body.classList.remove('printing-controladoria-recebimentos')
  }
  window.addEventListener('afterprint', afterPrintHandler)
})

onUnmounted(() => {
  if (afterPrintHandler) window.removeEventListener('afterprint', afterPrintHandler)
})
</script>

<style>
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

@media print {
  body.printing-controladoria-recebimentos * { visibility: hidden !important; }

  body.printing-controladoria-recebimentos #controladoria-recebimentos-root,
  body.printing-controladoria-recebimentos #controladoria-recebimentos-root * {
    visibility: visible !important;
  }

  body.printing-controladoria-recebimentos #controladoria-recebimentos-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    font-size: 12px !important;
    line-height: 1.2 !important;
  }

  @page { size: A4 landscape; margin: 8mm; }

  #controladoria-recebimentos-root {
    transform: scale(0.92);
    transform-origin: top left;
    width: 108.7% !important;
  }

  #controladoria-recebimentos-root .space-y-6 > * {
    margin-top: 6px !important;
    margin-bottom: 0 !important;
  }

  #controladoria-recebimentos-root .rounded-2xl {
    border-radius: 8px !important;
    box-shadow: none !important;
  }

  #controladoria-recebimentos-root .text-3xl { font-size: 18px !important; line-height: 1.15 !important; }
  #controladoria-recebimentos-root .text-2xl { font-size: 16px !important; line-height: 1.15 !important; }
  #controladoria-recebimentos-root .text-xl { font-size: 14px !important; line-height: 1.15 !important; }
  #controladoria-recebimentos-root .text-lg { font-size: 13px !important; line-height: 1.15 !important; }
  #controladoria-recebimentos-root .text-sm { font-size: 11px !important; line-height: 1.15 !important; }
  #controladoria-recebimentos-root .text-xs { font-size: 10px !important; line-height: 1.1 !important; }

  #controladoria-recebimentos-root .px-8 { padding-left: 8px !important; padding-right: 8px !important; }
  #controladoria-recebimentos-root .px-6 { padding-left: 6px !important; padding-right: 6px !important; }
  #controladoria-recebimentos-root .p-6 { padding: 8px !important; }
  #controladoria-recebimentos-root .p-5 { padding: 7px !important; }
  #controladoria-recebimentos-root .p-4 { padding: 6px !important; }
  #controladoria-recebimentos-root .py-6 { padding-top: 8px !important; padding-bottom: 8px !important; }
  #controladoria-recebimentos-root .py-5 { padding-top: 6px !important; padding-bottom: 6px !important; }
  #controladoria-recebimentos-root .py-4 { padding-top: 5px !important; padding-bottom: 5px !important; }
  #controladoria-recebimentos-root .min-h-\[120px\],
  #controladoria-recebimentos-root .sm\:min-h-\[140px\] {
    min-height: 64px !important;
  }

  #controladoria-recebimentos-root .grid {
    gap: 6px !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  }

  #controladoria-recebimentos-root .overflow-hidden,
  #controladoria-recebimentos-root .overflow-x-auto {
    overflow: visible !important;
  }

  #controladoria-recebimentos-root table {
    width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
  }

  #controladoria-recebimentos-root th,
  #controladoria-recebimentos-root td {
    padding: 4px 3px !important;
    font-size: 9px !important;
    line-height: 1.1 !important;
    white-space: normal !important;
    word-break: break-word !important;
  }

  #controladoria-recebimentos-root thead th {
    font-size: 9px !important;
    letter-spacing: 0 !important;
  }

  #controladoria-recebimentos-root table th:nth-child(10),
  #controladoria-recebimentos-root table td:nth-child(10) {
    width: 18% !important;
    min-width: 18% !important;
  }

  #controladoria-recebimentos-root .col-acoes-pdf {
    display: none !important;
  }

  #controladoria-recebimentos-root .pdf-observacao-btn {
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

  #controladoria-recebimentos-root .pdf-observacao-btn svg {
    display: none !important;
  }

  #controladoria-recebimentos-root .w-3.h-3.rounded-full {
    width: 6px !important;
    height: 6px !important;
    margin-right: 4px !important;
  }

  #controladoria-recebimentos-root .w-8,
  #controladoria-recebimentos-root .h-8,
  #controladoria-recebimentos-root .w-10,
  #controladoria-recebimentos-root .h-10,
  #controladoria-recebimentos-root .w-12,
  #controladoria-recebimentos-root .h-12 {
    width: 14px !important;
    height: 14px !important;
  }
}
</style>
