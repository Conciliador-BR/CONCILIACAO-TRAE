<template>
  <div class="overflow-x-auto">
    <!-- Controles de paginação (iguais ao Vendas) -->
    <div class="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700">Linhas por página:</label>
        <select 
          v-model="itemsPerPage" 
          @change="updatePagination"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
      
      <div class="flex items-center space-x-2">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Anterior
        </button>
        
        <span class="text-sm text-gray-700">
          Página {{ currentPage }} de {{ totalPages }} ({{ totalItems }} registros)
        </span>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Próxima
        </button>
      </div>
    </div>

    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-2xl">
        <tr class="border-b border-blue-700/50">
          <th
            v-for="(column, index) in orderedColumns"
            :key="column"
            class="group relative px-6 py-6 text-left cursor-pointer transition-all duration-300 hover:bg-white/5"
            :class="{ 'bg-slate-700/50': draggedColumn === column }"
            :style="{ width: responsiveColumnWidths[column] + 'px' }"
            draggable="true"
            @dragstart="$emit('drag-start', $event, column, index)"
            @dragover="$emit('drag-over', $event)"
            @drop="$emit('drag-drop', $event, index)"
            @dragend="$emit('drag-end', $event)"
            style="cursor: move;"
          >
            <!-- overlay sutil -->
            <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <!-- título -->
            <div class="relative">
              <div class="text-sm font-bold text-white group-hover:text-blue-200 transition-colors duration-300 tracking-wide uppercase">
                {{ columnTitles[column] || column }}
              </div>
              <div class="mt-2 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <!-- resizer -->
            <div
              class="absolute right-0 top-0 bottom-0 w-1 bg-blue-400/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-col-resize"
              @mousedown="$emit('start-resize', $event, column)"
            ></div>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(venda, index) in paginatedVendas" :key="venda.id || index" class="hover:bg-gray-50 transition-colors">
          <!-- usa orderedColumns -->
          <td v-for="column in orderedColumns"
              :key="column"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            {{ formatCell(venda, column) }}
          </td>
          <!-- Removendo célula de Ações -->
        </tr>
        <tr v-if="vendas.length === 0">
          <!-- ajusta colspan após remover 'Ações' -->
          <td :colspan="orderedColumns.length" class="px-6 py-8 text-center text-gray-500">
            Nenhum recebimento encontrado
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  vendas: {
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
  }
})

defineEmits(['remover-venda', 'drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])

// Mapeamento colunas → Supabase (inclui dataPagamento)
const supabaseFieldMap = {
  dataVenda: 'data_venda',
  dataPagamento: 'data_recebimento',
  vendaBruta: 'valor_bruto',
  vendaLiquida: 'valor_liquido',
  taxaMdr: 'taxa_mdr',
  despesaMdr: 'despesa_mdr',
  numeroParcelas: 'numero_parceladas',
  valorAntecipado: 'valor_antecipacao',
  despesasAntecipacao: 'despesa_antecipacao',
  valorLiquidoAntec: 'valor_liquido_antecipacao',
  modalidade: 'modalidade',
  nsu: 'nsu',
  bandeira: 'bandeira',
  empresa: 'empresa'
}

// Colunas de moeda
const currencyColumns = new Set([
  'vendaBruta',
  'vendaLiquida',
  'despesaMdr',
  'valorAntecipado',
  'despesasAntecipacao',
  'valorLiquidoAntec'
])

// Computed para ordenar as colunas de acordo com columnOrder
const orderedColumns = computed(() => {
  if (!props.columnOrder || props.columnOrder.length === 0) return props.visibleColumns
  return props.columnOrder.filter(col => props.visibleColumns.includes(col))
})

// Colunas de data (já existentes)
const dateColumns = new Set(['dataVenda', 'dataPagamento'])

// Formatação segura de datas para evitar problemas de timezone
const safeFormatDate = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const str = String(value).trim()

  // DD/MM/YYYY → mantém
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str

  // YYYY-MM-DD → converte sem criar Date UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y}`
  }

  // Fallback: tenta Date e formata localmente
  const dateObj = new Date(str)
  if (isNaN(dateObj.getTime())) return '-'
  const dia = String(dateObj.getDate()).padStart(2, '0')
  const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
  const ano = dateObj.getFullYear()
  return `${dia}/${mes}/${ano}`
}

// Formata a célula usando o mapeamento do Supabase
const formatCell = (venda, column) => {
  const key = supabaseFieldMap[column] || column
  const value = venda ? venda[key] : undefined
  if (value === null || value === undefined || value === '') return '-'

  if (dateColumns.has(column)) {
    return safeFormatDate(value)
  }

  if (currencyColumns.has(column)) {
    const num = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(num)) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
  }

  return value
}

// Estados da paginação
const currentPage = ref(1)
const itemsPerPage = ref(50)

// Computeds para paginação
const totalItems = computed(() => props.vendas.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)))
const paginatedVendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.vendas.slice(start, end)
})

// Métodos de paginação
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}
const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}
const updatePagination = () => {
  currentPage.value = 1 // Reset para primeira página quando mudar itens por página
}

// Reset quando os dados mudarem (mantém página válida)
watch(() => props.vendas.length, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value)
  }
})
</script>