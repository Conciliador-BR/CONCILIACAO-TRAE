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
        <tr v-if="dadosTabela.length === 0" class="hover:bg-gray-50">
          <td :colspan="visibleColumns.length" class="px-4 py-8 text-center text-gray-500">
            <div class="flex flex-col items-center">
              <div class="text-4xl mb-2">📊</div>
              <p>Nenhum dado encontrado</p>
              <p class="text-sm">Selecione uma empresa para visualizar as movimentações</p>
            </div>
          </td>
        </tr>
        <tr v-else v-for="(banco, index) in dadosTabela" :key="banco.id || `banco-${index}`" class="hover:bg-gray-50">
          <td v-for="column in visibleColumns" :key="column" class="px-4 py-3 text-sm text-gray-900 border-b text-center">
            <!-- ✅ CORREÇÃO: Centralizar valores previsto igual outras colunas -->
            <div v-if="column === 'previsto'">
              <div :class="getCellClasses(column)">
                {{ formatCellValue(column, banco[column]) }}
              </div>
              <div v-if="banco.quantidadeVendas > 0" class="text-xs text-gray-500 mt-1">
                {{ banco.quantidadeVendas }} venda{{ banco.quantidadeVendas > 1 ? 's' : '' }}
              </div>
            </div>
            <div v-else :class="getCellClasses(column)">
              {{ formatCellValue(column, banco[column]) }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BancosTableHeader from './BancosTableHeader.vue'
import BancosPrevisaoColumn from './BancosPrevisaoColumn.vue'

// Props unificadas e corretas
const props = defineProps({
  movimentacoes: {
    type: Array,
    default: () => []
  },
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

// Computed para dados da tabela - priorizar movimentacoes
const dadosTabela = computed(() => {
  console.log('🔍 Dados recebidos no BancosTable:')
  console.log('- Movimentações:', props.movimentacoes?.length || 0)
  console.log('- Bancos:', props.bancos?.length || 0)
  
  // Priorizar movimentacoes, depois bancos
  const dados = props.movimentacoes?.length > 0 ? props.movimentacoes : props.bancos || []
  
  console.log('- Dados finais para tabela:', dados.length)
  if (dados.length > 0) {
    console.log('- Amostra dos dados:', dados.slice(0, 2))
  }
  
  return dados
})

// Função para formatar valores das células
const formatCellValue = (column, value) => {
  if (value === null || value === undefined) return ''
  
  // Formatação para valores monetários
  if (['previsto', 'debitos', 'deposito', 'saldoConciliacao'].includes(column)) {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return 'R$ 0,00'
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }
  
  // Formatação para data
  if (column === 'data' && value) {
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
  
  // Formatação para status
  if (column === 'status') {
    const statusMap = {
      'conciliado': 'Conciliado',
      'pendente': 'Pendente',
      'divergente': 'Divergente'
    }
    return statusMap[value] || value || 'Pendente'
  }
  
  return value
}

// Função para classes CSS das células
const getCellClasses = (column) => {
  const baseClasses = 'text-sm text-center'
  
  // ✅ CORREÇÃO: Centralizar todas as colunas
  if (column === 'previsto') {
    return baseClasses + ' font-bold text-green-600'
  }
  
  // Cores especiais para diferentes tipos de valores (mantendo centralização)
  if (column === 'deposito') {
    return baseClasses + ' font-medium text-green-600'
  }
  
  if (column === 'debitos') {
    return baseClasses + ' font-medium text-red-600'
  }
  
  if (['saldoConciliacao'].includes(column)) {
    return baseClasses + ' font-medium'
  }
  
  if (column === 'status') {
    return baseClasses + ' font-medium'
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
</script>