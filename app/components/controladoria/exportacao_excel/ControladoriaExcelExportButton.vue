<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
    :disabled="disabled || exporting"
    @click="exportar"
  >
    <ArrowDownTrayIcon v-if="!exporting" class="h-4 w-4" />
    <svg v-else class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <span>{{ exporting ? 'Exportando...' : label }}</span>
  </button>
</template>

<script setup>
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { useControladoriaExcelExport } from '~/composables/useControladoriaExcelExport'

const props = defineProps({
  rootId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    default: 'exportacao-controladoria'
  },
  label: {
    type: String,
    default: 'Exportar Excel'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const { exporting, exportarTabelas } = useControladoriaExcelExport()

const exportar = async () => {
  await exportarTabelas({
    rootId: props.rootId,
    fileName: props.fileName
  })
}
</script>
