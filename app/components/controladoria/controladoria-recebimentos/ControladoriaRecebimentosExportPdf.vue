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
  }

  @page { size: A4 portrait; margin: 12mm; }

  #controladoria-recebimentos-root .rounded-2xl { padding: 16px !important; }
  #controladoria-recebimentos-root .rounded-2xl .text-3xl { font-size: 22px !important; }
  #controladoria-recebimentos-root .rounded-2xl .text-gray-600 { font-size: 12px !important; }
}
</style>
