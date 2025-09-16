<template>
  <div class="overflow-auto h-full w-full border border-gray-200">
    <table class="w-full table-fixed">
      <colgroup>
        <col v-for="column in visibleColumns" :key="column" :style="{ width: responsiveColumnWidths[column] + 'px' }">
      </colgroup>
      <BancosTableHeader 
        :visible-columns="visibleColumns"
        :column-titles="columnTitles"
        :dragged-column="draggedColumn"
        @drag-start="handleDragStart"
        @drag-over="handleDragOver"
        @drag-drop="handleDragDrop"
        @drag-end="handleDragEnd"
        @start-resize="handleStartResize"
      />
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(banco, index) in bancos" :key="banco.id || index" class="hover:bg-gray-50">
          <td v-for="column in visibleColumns" :key="column" class="px-4 py-3 text-sm text-gray-900 border-b">
            <!-- Coluna especial para previsão -->
            <BancosPrevisaoColumn 
              v-if="column === 'previsto'" 
              :data="banco.data"
              :previsoes-diarias="previsoesDiarias"
            />
            <span v-else :class="getCellClasses(column)">
              {{ formatCellValue(column, banco[column]) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import BancosTableHeader from './BancosTableHeader.vue'
import BancosPrevisaoColumn from './BancosPrevisaoColumn.vue'

// Props unificadas e corretas
defineProps({
  bancos: {
    type: Array,
    default: () => []
  },
  visibleColumns: {
    type: Array,
    default: () => []
  },
  columnTitles: {
    type: Object,
    default: () => ({})
  },
  responsiveColumnWidths: {
    type: Object,
    default: () => ({})
  },
  draggedColumn: {
    type: String,
    default: ''
  },
  columnOrder: {
    type: Array,
    default: () => []
  },
  previsoesDiarias: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])

// Função para formatar valores das células
const formatCellValue = (column, value) => {
  if (value === null || value === undefined) return ''
  
  // Formatação para valores monetários
  if (['valorCredito', 'valorDebito', 'saldoAnterior', 'saldoAtual'].includes(column)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Formatação para data
  if (column === 'dataMovimentacao' && value) {
    if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return value
    }
    
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        const dia = String(date.getDate()).padStart(2, '0')
        const mes = String(date.getMonth() + 1).padStart(2, '0')
        const ano = date.getFullYear()
        return `${dia}/${mes}/${ano}`
      }
    } catch (error) {
      console.error('Erro ao formatar data:', error)
    }
    
    return value
  }
  
  return value
}

// Função para classes CSS das células
const getCellClasses = (column) => {
  const baseClasses = 'text-sm'
  
  // Alinhamento à direita para valores numéricos
  if (['valorCredito', 'valorDebito', 'saldoAnterior', 'saldoAtual'].includes(column)) {
    return baseClasses + ' text-right font-medium'
  }
  
  // Cores especiais para crédito e débito
  if (column === 'valorCredito') {
    return baseClasses + ' text-right font-medium text-green-600'
  }
  
  if (column === 'valorDebito') {
    return baseClasses + ' text-right font-medium text-red-600'
  }
  
  return baseClasses
}

// Handlers para eventos de drag and drop
const handleDragStart = (event, column, index) => {
  emit('drag-start', event, column, index)
}

const handleDragOver = (event) => {
  emit('drag-over', event)
}

const handleDragDrop = (event, targetIndex) => {
  emit('drag-drop', event, targetIndex)
}

const handleDragEnd = () => {
  emit('drag-end')
}

const handleStartResize = (event, column) => {
  emit('start-resize', event, column)
}
</script> n   


