<template>
  <div class="overflow-hidden rounded-2xl border border-gray-100 shadow-lg bg-white">
    <div class="overflow-auto max-h-[600px] bg-gradient-to-b from-white to-gray-50/30">
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
        <tbody class="bg-transparent divide-y divide-gray-200/60">
          <!-- Estado Vazio -->
          <tr v-if="dadosTabela.length === 0" class="hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-indigo-50/40 transition-all duration-300">
            <td :colspan="visibleColumns.length" class="px-8 py-16 text-center">
              <div class="flex flex-col items-center max-w-md mx-auto space-y-6">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center shadow-xl">
                  <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div class="text-center space-y-3">
                  <h3 class="text-xl font-bold text-gray-800 tracking-tight">Nenhuma movimentação encontrada</h3>
                  <p class="text-gray-600 font-medium">Selecione uma empresa para visualizar as movimentações bancárias</p>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Linhas de Dados -->
          <tr v-else v-for="(banco, index) in dadosTabela" :key="banco.id || `banco-${index}`" 
              class="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 hover:shadow-sm"
              :class="index % 2 === 0 ? 'bg-white/80' : 'bg-gray-50/50'">
            <td v-for="column in visibleColumns" :key="column" 
                class="px-6 py-5 text-center border-b border-gray-200/50 group-hover:border-blue-200/70 transition-all duration-300">
              
              <!-- Coluna Previsto com Informações Extras -->
              <div v-if="column === 'previsto'" class="space-y-1">
                <div :class="getCellClasses(column)">
                  {{ formatCellValue(column, banco[column]) }}
                </div>
                <div v-if="banco.quantidadeVendas > 0" class="text-xs text-gray-500 font-medium bg-gray-50 rounded-full px-2 py-1 inline-block">
                  {{ banco.quantidadeVendas }} venda{{ banco.quantidadeVendas > 1 ? 's' : '' }}
                </div>
              </div>
              
              <!-- Coluna Status com Badge -->
              <div v-else-if="column === 'status'" class="flex justify-center">
                <span :class="getStatusBadgeClasses(banco[column])">
                  {{ formatCellValue(column, banco[column]) }}
                </span>
              </div>
              
              <!-- Outras Colunas -->
              <div v-else :class="getCellClasses(column)">
                {{ formatCellValue(column, banco[column]) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
  // Priorizar movimentacoes, depois bancos
  const dados = props.movimentacoes?.length > 0 ? props.movimentacoes : props.bancos || []
  
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
  const baseClasses = 'text-sm text-center font-medium transition-colors duration-200'
  
  // Valores monetários positivos (verde moderno)
  if (column === 'previsto') {
    return baseClasses + ' font-bold text-emerald-600 group-hover:text-emerald-700'
  }
  
  if (column === 'deposito') {
    return baseClasses + ' font-semibold text-green-600 group-hover:text-green-700'
  }
  
  // Valores monetários negativos (vermelho moderno)
  if (column === 'debitos') {
    return baseClasses + ' font-semibold text-red-500 group-hover:text-red-600'
  }
  
  // Saldo (azul moderno)
  if (['saldoConciliacao'].includes(column)) {
    return baseClasses + ' font-semibold text-blue-600 group-hover:text-blue-700'
  }
  
  // Status (roxo moderno)
  if (column === 'status') {
    return baseClasses + ' font-semibold text-purple-600 group-hover:text-purple-700'
  }
  
  // Dados gerais (cinza moderno)
  if (['empresa', 'banco', 'agencia', 'conta'].includes(column)) {
    return baseClasses + ' text-gray-700 group-hover:text-gray-800'
  }
  
  // Data (índigo moderno)
  if (column === 'data') {
    return baseClasses + ' text-indigo-600 group-hover:text-indigo-700'
  }
  
  // Adquirente (teal moderno)
  if (column === 'adquirente') {
    return baseClasses + ' text-teal-600 group-hover:text-teal-700'
  }
  
  return baseClasses + ' text-gray-600 group-hover:text-gray-700'
}

// Função para classes CSS dos badges de status
const getStatusBadgeClasses = (status) => {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm'
  
  switch (status?.toLowerCase()) {
    case 'pendente':
      return `${baseClasses} bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200`
    case 'conciliado':
      return `${baseClasses} bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200`
    case 'divergente':
      return `${baseClasses} bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200`
    case 'processando':
      return `${baseClasses} bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200`
    default:
      return `${baseClasses} bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200`
  }
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