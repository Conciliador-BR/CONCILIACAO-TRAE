<template>
  <tr class="hover:bg-gray-50">
    <td v-for="column in visibleColumns" :key="column" class="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
      <div v-if="column === 'id'" class="text-center">
        {{ index + 1 }}
      </div>
      <TaxasCellEditor
        v-else
        :column="column"
        :value="taxa[getColumnField(column)]"
        :empresas-disponiveis="empresas"
        :index="index"
        @update="$emit('update-taxa', { index, column, value: $event })"
      />
    </td>
    <td class="px-6 py-4">
      <TaxasActions
        @remover="$emit('remover-taxa', index)"
      />
    </td>
  </tr>
</template>

<script setup>
import TaxasCellEditor from './TaxasCellEditor.vue'
import TaxasActions from './TaxasActions.vue'

defineProps({
  taxa: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  visibleColumns: {
    type: Array,
    required: true
  },
  empresas: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update-taxa', 'remover-taxa'])

// Mapeamento de campos
const columnFieldMap = {
  id: 'id',
  empresa: 'empresa',
  adquirente: 'adquirente',
  bandeira: 'bandeira',
  modalidade: 'modalidade',
  parcelas: 'parcelas',
  taxa: 'percentualTaxa',
  dataCorte: 'dataCorte'
}

const getColumnField = (column) => {
  return columnFieldMap[column] || column
}
</script>