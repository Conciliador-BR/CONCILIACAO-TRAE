<template>
  <div class="overflow-auto max-h-96 max-w-full" style="scrollbar-width: thin;">
    <div class="min-w-full">
      <table class="w-full table-auto" ref="table">
        <colgroup>
          <col v-for="column in visibleColumns" :key="column" :style="{ minWidth: responsiveColumnWidths[column] + 'px' }">
          <col :style="{ minWidth: responsiveColumnWidths.acoes + 'px' }">
        </colgroup>
        <TaxasTableHeader 
          :visible-columns="visibleColumns"
          :column-titles="columnTitles"
        />
        <tbody class="bg-white divide-y divide-gray-200">
          <TaxasTableRow
            v-for="(taxa, index) in taxas"
            :key="index"
            :taxa="taxa"
            :index="index"
            :visible-columns="visibleColumns"
            @update-taxa="$emit('update-taxa', $event.index, $event.column, $event.value)"
            @remover-taxa="$emit('remover-taxa', $event)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import TaxasTableHeader from './TaxasTableHeader.vue'
import TaxasTableRow from './TaxasTableRow.vue'

defineProps({
  taxas: {
    type: Array,
    required: true
  },
  visibleColumns: {
    type: Array,
    required: true
  },
  columnTitles: {
    type: Object,
    required: true
  },
  responsiveColumnWidths: {
    type: Object,
    required: true
  }
})

defineEmits(['update-taxa', 'remover-taxa'])
</script>

<style scoped>
/* Estilizar barras de rolagem */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>