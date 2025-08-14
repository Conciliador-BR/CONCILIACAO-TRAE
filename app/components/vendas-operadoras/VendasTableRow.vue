<template>
  <tr class="hover:bg-gray-50">
    <td v-for="column in visibleColumns" :key="column" class="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
      <span :class="getCellClasses(column)">
        {{ formatCellValue(column, venda[getColumnField(column)]) }}
      </span>
    </td>
    <td class="px-6 py-4">
      <VendasActions
        @remover="$emit('remover-venda', index)"
      />
    </td>
  </tr>
</template>

<script setup>
import VendasActions from './VendasActions.vue'

defineProps({
  venda: {
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
  }
})

defineEmits(['remover-venda'])

// Mapeamento de campos para vendas
const columnFieldMap = {
  dataVenda: 'dataVenda',
  modalidade: 'modalidade',
  nsu: 'nsu',
  vendaBruta: 'vendaBruta',
  vendaLiquida: 'vendaLiquida',
  taxaMdr: 'taxaMdr',
  despesaMdr: 'despesaMdr',
  numeroParcelas: 'numeroParcelas',
  bandeira: 'bandeira',
  valorAntecipado: 'valorAntecipado',
  despesasAntecipacao: 'despesasAntecipacao',
  valorLiquidoAntec: 'valorLiquidoAntec',
  empresa: 'empresa',
  matriz: 'matriz'
}

const getColumnField = (column) => {
  return columnFieldMap[column] || column
}

// Função para formatar valores das células
const formatCellValue = (column, value) => {
  if (value === null || value === undefined) return ''
  
  // Formatação para valores monetários
  if (['vendaBruta', 'vendaLiquida', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'].includes(column)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Formatação para taxa MDR (porcentagem)
  if (column === 'taxaMdr') {
    return `${value}%`
  }
  
  // Formatação para data
  if (column === 'dataVenda' && value) {
    return new Date(value).toLocaleDateString('pt-BR')
  }
  
  return value
}

// Função para classes CSS das células
const getCellClasses = (column) => {
  const baseClasses = 'text-sm'
  
  // Alinhamento à direita para valores numéricos
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return baseClasses + ' text-right font-medium'
  }
  
  return baseClasses
}
</script>