<template>
  <div class="bg-white border-t border-[#244b77]/20">
    <!-- Totais (Resumo) -->
    <div v-if="totais" class="overflow-x-auto border-b border-[#244b77]/15 bg-gradient-to-r from-[#f7fcf8] to-white">
      <table class="table-fixed w-full" :style="{ minWidth: `${tableMinWidth}px` }">
        <tbody class="bg-transparent">
          <tr>
            <td v-for="column in visibleColumns" :key="column"
                :style="{ width: (responsiveColumnWidths[column] || 100) + 'px' }"
                class="border-b border-[#244b77]/15 border-r border-[#244b77]/10 px-4 py-3.5 text-xs sm:text-sm font-bold last:border-r-0"
            >
              <!-- Previsto -->
              <div v-if="column === 'previsto'" class="flex flex-col items-center justify-center">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span class="table-strong-text text-emerald-700 font-mono">{{ formatCurrency(totais.previsto) }}</span>
              </div>
              
              <!-- Débitos Antecipação -->
              <div v-else-if="column === 'debitosAntecipacao'" class="flex flex-col items-end justify-center text-right">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span class="table-strong-text text-rose-700 font-mono">{{ formatCurrency(totais.debitosAntecipacao) }}</span>
              </div>
              
              <!-- Débitos -->
              <div v-else-if="column === 'debitos'" class="flex flex-col items-end justify-center text-right">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span class="table-strong-text text-rose-700 font-mono">{{ formatCurrency(totais.debitos) }}</span>
              </div>
              
              <!-- Depósito -->
              <div v-else-if="column === 'deposito'" class="flex flex-col items-end justify-center text-right">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span class="table-strong-text text-blue-700 font-mono">{{ formatCurrency(totais.deposito) }}</span>
              </div>
              
              <!-- Saldo -->
              <div v-else-if="column === 'saldoConciliacao'" class="flex flex-col items-end justify-center text-right">
                 <span class="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-0.5">Total</span>
                 <span :class="totais.saldoConciliacao >= 0 ? 'text-emerald-700' : 'text-red-700'" class="table-strong-text font-mono">
                   {{ formatCurrency(totais.saldoConciliacao) }}
                 </span>
              </div>

              <!-- Label column (first column) -->
              <div v-else-if="column === visibleColumns[0]" class="flex items-center h-full">
                <span class="table-strong-text inline-flex items-center rounded-full bg-[#effbf1] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2f7d32]">Totais filtrados</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Controles de Paginação -->
    <div class="flex items-center justify-between px-4 py-3">
      <!-- Seletor de itens por página -->
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700">Mostrar:</span>
        <select 
          :value="itemsPerPage" 
          @change="$emit('update:itemsPerPage', parseInt($event.target.value))"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
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
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                page === currentPage 
                  ? 'bg-[#244b77] text-white border-[#244b77] shadow-sm ring-2 ring-[#8bb5de]/50'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              ]"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            @click="$emit('nextPage')"
            :disabled="currentPage === totalPages"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

const tableMinWidth = computed(() => {
  const total = (props.visibleColumns || []).reduce((acc, column) => {
    return acc + Number(props.responsiveColumnWidths?.[column] || 120)
  }, 0)

  return Math.max(1190, total)
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

<style scoped>
.table-strong-text {
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(47, 125, 50, 0.12);
}
</style>
