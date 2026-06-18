<template>
  <div class="flex h-full min-w-0 flex-col">
    <div class="overflow-x-auto flex-1 rounded-[28px] border-2 border-[#244b77]/35 bg-gradient-to-br from-white via-[#fcfefc] to-[#f4fbf5] shadow-lg shadow-[#73c77d]/10">
      <table class="table-fixed w-full" :style="{ minWidth: `${tableMinWidth}px` }">
        <thead class="bg-gradient-to-br from-white via-[#fcfefc] to-[#f5fbf6]">
          <tr>
            <th v-for="(column, index) in visibleColumns" :key="column" 
                :class="['group relative border-r border-[#244b77]/10 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#244b77] last:border-r-0 cursor-pointer transition-colors duration-200 text-center hover:bg-[#f4fbf5]']"
                :style="{ width: responsiveColumnWidths[column] + 'px' }"
                draggable="true"
                @dragstart="$emit('drag-start', $event, column, index)"
                @dragover="$emit('drag-over', $event)"
                @drop="$emit('drag-drop', $event, index)"
                @dragend="$emit('drag-end')"
            >
              <div class="bancos-header-title">
                {{ columnTitles[column] }}
              </div>
            </th>
          </tr>
          <tr class="bg-white/95">
            <th :colspan="visibleColumns.length" class="p-0">
              <div class="h-1.5 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#8ad795]"></div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white/95">
          <!-- Estado Vazio -->
          <tr v-if="dadosTabela.length === 0">
            <td :colspan="visibleColumns.length" class="px-6 py-12 text-center">
              <div class="mx-auto max-w-md rounded-2xl border border-dashed border-[#73c77d]/30 bg-[#f7fcf8] px-4 py-6">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#effbf1]">
                  <svg class="h-8 w-8 text-[#2f7d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <p class="mt-4 table-strong-text text-sm font-semibold text-[#2f7d32]">Nenhuma movimentação encontrada</p>
                <p class="mt-1 text-xs text-slate-500">Ajuste os filtros para visualizar os registros.</p>
              </div>
            </td>
          </tr>
          
          <!-- Linhas de Dados -->
          <tr v-else v-for="(banco, index) in dadosTabela" :key="banco.id || `banco-${index}`" 
              class="group border-b border-[#244b77]/10 transition-all duration-200 hover:bg-[#f3fbf4]"
              :class="index % 2 === 0 ? 'bg-white' : 'bg-[#f9fcf9]'">
            <td v-for="column in visibleColumns" :key="column" 
                :class="`${getCellClasses(column)} ${getCellAlignClass(column)} border-r border-[#244b77]/10 last:border-r-0 group-hover:text-[#214f24]`"
                :style="{ width: responsiveColumnWidths[column] + 'px' }">
              
              <!-- Coluna Previsto -->
              <div v-if="column === 'previsto'" class="flex flex-col items-center justify-center">
                <span class="table-strong-text font-bold text-emerald-700">{{ formatCellValue(column, banco[column]) }}</span>
                <span v-if="banco.quantidadeVendas > 0" class="mt-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-gray-600 shadow-sm">
                  {{ banco.quantidadeVendas }} venda{{ banco.quantidadeVendas > 1 ? 's' : '' }}
                </span>
              </div>
              
              <!-- Coluna Status -->
              <div v-else-if="column === 'status'">
                <button
                  type="button"
                  class="focus:outline-none"
                  @click.stop="handleStatusClick(banco, index)"
                >
                <span :class="`${getStatusBadgeClasses(banco[column])} hover:opacity-80`">
                  {{ formatCellValue(column, banco[column]) }}
                </span>
                </button>
              </div>
              
              <!-- Coluna Data -->
              <div v-else-if="column === 'data'">
                <button 
                  @click.stop="handleDataClick(banco[column])"
                  class="table-strong-text font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                  title="Filtrar por esta data"
                >
                  {{ formatCellValue(column, banco[column]) }}
                </button>
              </div>

              <!-- Coluna Adquirente -->
              <div v-else-if="column === 'adquirente'" class="table-strong-text truncate font-medium text-[#295c2d]" :title="formatCellValue(column, banco[column])">
                {{ formatCellValue(column, banco[column]) }}
              </div>
              
              <!-- Coluna Depósito -->
              <div v-else-if="column === 'deposito'" class="table-strong-text font-bold text-blue-700">
                {{ formatCellValue(column, banco[column]) }}
              </div>

              <!-- Coluna Débitos -->
              <div v-else-if="['debitos', 'debitosAntecipacao'].includes(column)" class="table-strong-text font-medium text-red-600">
                {{ formatCellValue(column, banco[column]) }}
              </div>

              <!-- Coluna Saldo -->
              <div v-else-if="column === 'saldoConciliacao'" :class="banco[column] >= 0 ? 'table-strong-text text-emerald-700 font-bold' : 'table-strong-text text-red-600 font-bold'">
                {{ formatCellValue(column, banco[column]) }}
              </div>

              <!-- Outras Colunas -->
              <div v-else class="table-cell-text truncate" :title="formatCellValue(column, banco[column])">
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
  },
})

// Emits
const emit = defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize', 'data-clicked', 'status-clicked'])

// Computed para dados da tabela - priorizar movimentacoes
const dadosTabela = computed(() => {
  // Priorizar movimentacoes, depois bancos
  const dados = props.movimentacoes?.length > 0 ? props.movimentacoes : props.bancos || []
  
  return dados
})

const tableMinWidth = computed(() => {
  const total = (props.visibleColumns || []).reduce((acc, column) => {
    return acc + Number(props.responsiveColumnWidths?.[column] || 120)
  }, 0)

  return Math.max(1190, total)
})

// Função para formatar valores das células
const formatCellValue = (column, value) => {
  if (value === null || value === undefined) return ''
  
  // Formatação para valores monetários
  if (['previsto', 'debitos', 'debitosAntecipacao', 'deposito', 'saldoConciliacao'].includes(column)) {
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
    } catch (error) {}
    
    return value
  }
  
  // Formatação para status
  if (column === 'status') {
    const v = String(value || '').toLowerCase()
    const statusMap = {
      consistente: 'Conciliado',
      inconsistente: 'Divergente',
      conciliado: 'Conciliado',
      divergente: 'Divergente'
    }
    return statusMap[v] || (value || 'Pendente')
  }
  
  return value
}

// Função para lidar com clique na data
const handleDataClick = (data) => {
  if (data) {
    emit('data-clicked', data)
  }
}

const handleStatusClick = (banco, index) => {
  emit('status-clicked', { banco, index })
}

// Função para classes CSS das células
const getCellClasses = (column) => {
  const baseClasses = 'table-cell-text px-2 py-2 text-[11px] sm:px-3 sm:py-2 sm:text-xs md:text-sm transition-all duration-300 whitespace-nowrap'
  
  if (['previsto', 'deposito'].includes(column)) {
    return `${baseClasses} table-strong-text font-semibold`
  }
  return baseClasses
}

const isNumericColumn = (column) => {
  return ['previsto', 'debitosAntecipacao', 'debitos', 'deposito', 'saldoConciliacao'].includes(column)
}

const isDateColumn = (column) => column === 'data'

const getHeaderAlignClass = (column) => {
  return isNumericColumn(column) ? 'text-right' : 'text-left'
}

const getCellAlignClass = (column) => {
  if (isNumericColumn(column)) return 'text-right'
  if (isDateColumn(column)) return 'text-center'
  return 'text-left'
}

const getStatusBadgeClasses = (status) => {
  const baseClasses = 'table-strong-text px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium border shadow-sm'
  switch (status?.toLowerCase()) {
    case 'pendente':
      return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`
    case 'consistente':
      return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`
    case 'conciliado':
      return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`
    case 'inconsistente':
      return `${baseClasses} bg-rose-50 text-rose-700 border-rose-200`
    case 'divergente':
      return `${baseClasses} bg-rose-50 text-rose-700 border-rose-200`
    case 'processando':
      return `${baseClasses} bg-indigo-50 text-indigo-700 border-indigo-200`
    default:
      return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`
  }
}

const getMoneyPillClasses = (column) => {
  const baseClasses = 'inline-block px-2 py-1 md:px-3 md:py-1 rounded-md font-medium text-xs md:text-sm 2xl:text-base'
  
  if (column === 'previsto') return `${baseClasses} text-emerald-700`
  if (column === 'deposito') return `${baseClasses} text-blue-700`
  if (['debitos', 'debitosAntecipacao'].includes(column)) return `${baseClasses} text-rose-700`
  if (column === 'saldoConciliacao') return `${baseClasses}`
  
  return baseClasses
}

const getDataChipClasses = () => {
  return 'text-indigo-600 hover:underline'
}

const getAdquirentePillClasses = (name) => {
  return 'font-semibold'
}

const getInfoTagClasses = (column) => {
  return ''
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

<style scoped>
.bancos-header-title {
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(36, 75, 119, 0.14);
}

.table-cell-text {
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
}

.table-strong-text {
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(47, 125, 50, 0.12);
}
</style>
