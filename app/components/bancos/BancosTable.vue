<template>
  <div class="overflow-hidden rounded-2xl border border-gray-100 shadow-lg bg-white">
    <div class="overflow-auto max-h-[1000px] bg-gradient-to-b from-white to-gray-50/30">
      <table class="w-full table-auto">
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
              class="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 hover:shadow-sm relative after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-slate-200 after:via-gray-300 after:to-slate-200"
              :class="index % 2 === 0 ? 'bg-white/80' : 'bg-gray-50/50'">
            <td v-for="column in visibleColumns" :key="column" 
                class="px-6 py-6 text-center border-b border-gray-200/50 group-hover:border-blue-200/70 transition-all duration-300">
              
              <!-- Coluna Previsto com Informações Extras -->
              <div v-if="column === 'previsto'" class="space-y-1">
                <div :class="getCellClasses('previsto') + ' text-xl md:text-2xl font-bold'">
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
              
              <!-- Coluna Data clicável sem fundo -->
              <div v-else-if="column === 'data'" :class="getCellClasses('data') + ' cursor-pointer text-indigo-600 hover:underline'" @click="handleDataClick(banco[column])" title="Clique para filtrar vendas desta data">
                {{ formatCellValue(column, banco[column]) }}
              </div>

              <!-- Coluna Adquirente sem fundo -->
              <div v-else-if="column === 'adquirente'" :class="getCellClasses('adquirente') + ' font-semibold'">
                {{ formatCellValue(column, banco[column]) }}
              </div>

              <!-- Info sem fundo para empresa/banco/agencia/conta -->
              <div v-else-if="['empresa','banco','agencia','conta'].includes(column)" :class="getCellClasses(column)">
                {{ formatCellValue(column, banco[column]) }}
              </div>
              
              <!-- Valores monetários sem fundo -->
              <div v-else-if="['debitos','debitosAntecipacao','deposito','saldoConciliacao'].includes(column)" :class="getCellClasses(column) + (column === 'deposito' ? ' text-xl md:text-2xl font-bold' : ' text-lg md:text-xl font-semibold')">
                {{ formatCellValue(column, banco[column]) }}
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
const emit = defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize', 'data-clicked'])

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

// Função para classes CSS das células
const getCellClasses = (column) => {
  const baseClasses = 'text-lg text-center font-medium transition-colors duration-200'
  
  // Valores monetários positivos (verde moderno)
  if (column === 'previsto') {
    return baseClasses + ' font-bold text-emerald-600 group-hover:text-emerald-700'
  }
  
  if (column === 'deposito') {
    return baseClasses + ' font-semibold text-green-600 group-hover:text-green-700'
  }
  
  // Valores monetários negativos (vermelho moderno)
  if (column === 'debitos' || column === 'debitosAntecipacao') {
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
  
  return baseClasses + ' text-gray-700 group-hover:text-gray-800'
}

// Função para classes CSS dos badges de status
const getStatusBadgeClasses = (status) => {
  const base = 'inline-flex items-center px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow-sm border'
  switch (status?.toLowerCase()) {
    case 'pendente':
      return `${base} bg-amber-50 text-amber-700 border-amber-200`
    case 'consistente':
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`
    case 'conciliado':
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`
    case 'inconsistente':
      return `${base} bg-rose-50 text-rose-700 border-rose-200`
    case 'divergente':
      return `${base} bg-rose-50 text-rose-700 border-rose-200`
    case 'processando':
      return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`
    default:
      return `${base} bg-slate-50 text-slate-700 border-slate-200`
  }
}

const getMoneyPillClasses = (column, value) => {
  const baseSm = 'inline-flex items-center px-3 py-1.5 rounded-xl font-mono text-sm tracking-tight shadow-sm border'
  const baseMd = 'inline-flex items-center px-3 py-1.5 rounded-xl font-mono text-base md:text-lg font-semibold tracking-tight shadow-sm border'
  const baseLg = 'inline-flex items-center px-3 py-1.5 rounded-xl font-mono text-lg md:text-xl font-bold tracking-tight shadow-sm border'
  const base = (column === 'previsto' || column === 'deposito') ? baseLg 
    : (column === 'debitos' || column === 'debitosAntecipacao' || column === 'saldoConciliacao') ? baseMd 
    : baseSm
  if (column === 'previsto') return `${base} bg-blue-50 text-blue-700 border-blue-200`
  if (column === 'deposito') return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`
  if (column === 'debitos' || column === 'debitosAntecipacao') return `${base} bg-rose-50 text-rose-700 border-rose-200`
  if (column === 'saldoConciliacao') {
    const n = Number(value || 0)
    return n >= 0 
      ? `${base} bg-emerald-50 text-emerald-700 border-emerald-200`
      : `${base} bg-red-50 text-red-700 border-red-200`
  }
  return `${base} bg-slate-50 text-slate-700 border-slate-200`
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
