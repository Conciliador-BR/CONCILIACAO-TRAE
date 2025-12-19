<template>
  <div class="bg-white border-t border-gray-200">
    <!-- Totais (Resumo) -->
    <div v-if="totais" class="overflow-x-auto border-b border-gray-200 bg-gray-50">
      <table class="table-fixed w-full divide-y divide-gray-200">
        <tbody class="bg-gray-50">
          <tr>
            <td v-for="column in visibleColumns" :key="column"
                :style="{ width: (responsiveColumnWidths[column] || 100) + 'px' }"
                class="px-3 py-3 text-xs sm:text-sm font-bold border-r border-gray-200 last:border-r-0"
            >
              <!-- Previsto -->
              <div v-if="column === 'previsto'" class="flex flex-col items-center justify-center">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span class="text-emerald-700 font-mono">{{ formatCurrency(totais.previsto) }}</span>
              </div>
              
              <!-- Débitos Antecipação -->
              <div v-else-if="column === 'debitosAntecipacao'" class="flex flex-col items-end justify-center text-right">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span class="text-rose-700 font-mono">{{ formatCurrency(totais.debitosAntecipacao) }}</span>
              </div>
              
              <!-- Débitos -->
              <div v-else-if="column === 'debitos'" class="flex flex-col items-end justify-center text-right">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span class="text-rose-700 font-mono">{{ formatCurrency(totais.debitos) }}</span>
              </div>
              
              <!-- Depósito -->
              <div v-else-if="column === 'deposito'" class="flex flex-col items-end justify-center text-right">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span class="text-blue-700 font-mono">{{ formatCurrency(totais.deposito) }}</span>
              </div>
              
              <!-- Saldo -->
              <div v-else-if="column === 'saldoConciliacao'" class="flex flex-col items-end justify-center text-right">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span :class="totais.saldoConciliacao >= 0 ? 'text-emerald-700' : 'text-red-700'" class="font-mono">
                   {{ formatCurrency(totais.saldoConciliacao) }}
                 </span>
              </div>

              <!-- Label column (first column) -->
              <div v-else-if="column === visibleColumns[0]" class="flex items-center h-full">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Totais</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Controles de Paginação -->
    <div class="px-4 py-3 flex items-center justify-between">
      <!-- Seletor de itens por página -->
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700">Mostrar:</span>
        <select 
          :value="itemsPerPage" 
          @change="$emit('update:itemsPerPage', parseInt($event.target.value))"
          class="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="size in availablePageSizes" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
        <span class="text-sm text-gray-700">por página</span>
      </div>
      
      <!-- Informações da paginação -->
      <div class="flex items-center space-x-4">
        <span class="text-sm text-gray-700">
          Mostrando {{ startItem }} a {{ endItem }} de {{ totalItems }} registros
        </span>
        
        <!-- Controles de navegação -->
        <div class="flex items-center space-x-1">
          <button 
            @click="$emit('prevPage')"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Anterior
          </button>
          
          <!-- Números das páginas -->
          <div class="flex items-center space-x-1">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              @click="$emit('setPage', page)"
              :class="[
                'px-3 py-1 text-sm border rounded transition-colors',
                page === currentPage 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'border-gray-300 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            @click="$emit('nextPage')"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: Number,
  totalPages: Number,
  totalItems: Number,
  itemsPerPage: Number,
  availablePageSizes: Array,
  totais: {
    type: Object,
    default: null
  },
  visibleColumns: {
    type: Array,
    default: () => []
  },
  responsiveColumnWidths: {
    type: Object,
    default: () => ({})
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

defineEmits(['setPage', 'nextPage', 'prevPage', 'update:itemsPerPage'])

// Calcular itens visíveis na página atual
const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage
  return Math.min(end, props.totalItems)
})

// Calcular páginas visíveis (máximo 5 páginas)
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(props.totalPages, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})
</script>