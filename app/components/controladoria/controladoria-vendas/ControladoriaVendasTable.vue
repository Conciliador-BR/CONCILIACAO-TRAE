<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 class="text-2xl font-bold text-blue-800 mb-4">{{ title }}</h2>
    
    <!-- Tabela de Conciliações -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-blue-50">
          <tr>
            <th v-for="column in columns" :key="column.key" 
                class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200 last:border-r-0">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(item, index) in data" :key="index" class="hover:bg-gray-50">
            <td v-for="column in columns" :key="column.key" 
                class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'">
              <span v-if="column.type === 'currency'" :class="column.key === 'adquirente' ? 'font-medium' : ''">{{ formatCurrency(item[column.key]) }}</span>
              <span v-else :class="column.key === 'adquirente' ? 'font-medium' : ''">{{ item[column.key] }}</span>
            </td>
          </tr>
        </tbody>
        <!-- Linha de Totais -->
        <tfoot v-if="showTotals" class="bg-yellow-50">
          <tr class="font-bold">
            <td v-for="column in columns" :key="column.key" 
                class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'">
              <span v-if="column.key === 'adquirente'">ÚNICA</span>
              <span v-else-if="column.type === 'currency'">{{ formatCurrency(totals[column.key] || 0) }}</span>
              <span v-else>{{ totals[column.key] || '' }}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'CONCILIAÇÕES VENDAS'
  },
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  showTotals: {
    type: Boolean,
    default: true
  }
})

// Computed para totais
const totals = computed(() => {
  return props.data.reduce((acc, item) => {
    props.columns.forEach(column => {
      if (column.type === 'currency' && typeof item[column.key] === 'number') {
        acc[column.key] = (acc[column.key] || 0) + item[column.key]
      }
    })
    return acc
  }, {})
})

// Métodos
const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>