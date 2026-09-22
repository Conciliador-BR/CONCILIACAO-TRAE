<template>
  <component
    :is="exportComponent"
    v-if="exportComponent"
    :current-page-id="pageId"
    :initial-open="initialOpen"
  />
  <button
    v-else
    type="button"
    class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-700"
    @click="abrirExportacao"
  >
    <DocumentArrowDownIcon class="mr-2 h-5 w-5" />
    <span>Exportar PDF</span>
  </button>
</template>

<script setup>
import { DocumentArrowDownIcon } from '@heroicons/vue/24/solid'
import { markRaw, ref, shallowRef } from 'vue'

defineProps({
  pageId: {
    type: String,
    required: true
  }
})

const exportComponent = shallowRef(null)
const initialOpen = ref(false)

const carregarExportacao = async () => {
  if (exportComponent.value) return exportComponent.value

  const mod = await import('~/components/controladoria/exportacao_pdf/shared/ControladoriaPdfExportBase.vue')
  exportComponent.value = markRaw(mod.default)
  return exportComponent.value
}

const abrirExportacao = async () => {
  initialOpen.value = true
  await carregarExportacao()
}
</script>
