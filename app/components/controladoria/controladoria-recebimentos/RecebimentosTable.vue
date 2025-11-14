<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <RecebimentosTableHeader
        :visible-columns="orderedColumns"
        :column-titles="columnTitles"
        :dragged-column="draggedColumn"
        @drag-start="$emit('drag-start', $event, $event.column, $event.index)"
        @drag-over="$emit('drag-over', $event)"
        @drag-drop="$emit('drag-drop', $event, $event.index)"
        @drag-end="$emit('drag-end')"
        @start-resize="$emit('start-resize', $event, $event.column)"
      />
      <tbody class="bg-white divide-y divide-gray-200">
        <RecebimentosTableRow
          v-for="(rec, index) in paginatedRecebimentos"
          :key="rec.id || index"
          :recebimento="rec"
          :index="index"
          :visible-columns="orderedColumns"
        />
        <tr v-if="recebimentos.length === 0">
          <td :colspan="orderedColumns.length" class="px-6 py-8 text-center text-gray-500">Nenhum recebimento encontrado</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import RecebimentosTableHeader from './RecebimentosTableHeader.vue'
import RecebimentosTableRow from './RecebimentosTableRow.vue'

const props = defineProps({
  recebimentos: { type: Array, default: () => [] },
  visibleColumns: { type: Array, default: () => [] },
  columnTitles: { type: Object, default: () => ({}) },
  responsiveColumnWidths: { type: Object, default: () => ({}) },
  draggedColumn: { type: String, default: '' },
  columnOrder: { type: Array, default: () => [] }
})

const orderedColumns = computed(() => {
  if (!props.columnOrder || props.columnOrder.length === 0) return props.visibleColumns
  return props.columnOrder.filter(col => props.visibleColumns.includes(col))
})

const currentPage = ref(1)
const itemsPerPage = ref(50)
const totalItems = computed(() => props.recebimentos.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)))
const paginatedRecebimentos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.recebimentos.slice(start, end)
})

watch(() => props.recebimentos.length, () => {
  if (currentPage.value > totalPages.value) currentPage.value = Math.max(1, totalPages.value)
})
</script>