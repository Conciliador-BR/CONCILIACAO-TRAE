<template>
  <div class="overflow-auto max-h-[600px] max-w-full border border-gray-200 rounded-lg">
    <table class="w-full table-fixed">
      <colgroup>
        <col v-for="column in visibleColumns" :key="column" :style="{ width: responsiveColumnWidths[column] + 'px' }">
      </colgroup>
      <PrevisaoPagamentosTableHeader 
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
        <tr v-for="(venda, index) in vendas" :key="venda.id || index" class="hover:bg-gray-50">
          <td v-for="column in visibleColumns" :key="column" class="px-4 py-3 text-sm text-gray-900 border-b">
            <!-- Usar componente independente para coluna previsão -->
            <PrevisaoPgtoColumn 
              v-if="column === 'previsaoPgto'" 
              :venda="venda" 
              :debug="false"
            />
            <span v-else :class="getCellClasses(column)">
              {{ formatCellValue(column, venda[column]) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import PrevisaoPagamentosTableHeader from './PrevisaoPagamentosTableHeader.vue'
import PrevisaoPgtoColumn from './PrevisaoPgtoColumn.vue'
import { onMounted } from 'vue'
import { usePrevisaoColuna } from '~/composables/PagePagamentos/usePrevisaoColuna'

defineProps({
  vendas: Array,
  visibleColumns: Array,
  columnTitles: Object,
  responsiveColumnWidths: Object,
  draggedColumn: String,
  columnOrder: Array
})

const emit = defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])
const { inicializar } = usePrevisaoColuna()

// Função para formatar valores das células (igual à página de vendas)
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
  
  // Formatação para data (igual à página de vendas)
  if (column === 'dataVenda' && value) {
    // Se a data já está no formato DD/MM/YYYY, retornar como está
    if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return value
    }
    
    // Se a data está em outro formato, converter para DD/MM/YYYY
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

// Função para classes CSS das células (igual à página de vendas)
const getCellClasses = (column) => {
  const baseClasses = 'text-sm'
  
  // Alinhamento à direita para valores numéricos
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return baseClasses + ' text-right font-medium'
  }
  
  return baseClasses
}

// Inicializar taxas ao montar o componente
onMounted(async () => {
  await inicializar()
})

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
</script>