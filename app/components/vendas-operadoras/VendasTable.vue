<template>
  <div>
    <!-- Controles de paginação no topo -->
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

        <label class="text-sm font-medium text-gray-700">Autorizadora:</label>
        <select
          v-model="autorizadoraFiltro"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          <option v-for="op in autorizadorasDisponiveis" :key="op" :value="op">{{ op }}</option>
        </select>
        
        <!-- Botão Atualizar Vendas -->
        <BotaoAtualizarVendas 
          @atualizado="handleAtualizarVendas"
          @erro="handleErroAtualizacao"
        />
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
        <span class="text-xs text-slate-600">
          Filtros ativos: {{ activeFiltersCount + (autorizadoraFiltro ? 1 : 0) }}
        </span>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Próxima
        </button>

        <span class="text-sm text-gray-700 ml-3">Ir para:</span>
        <input
          v-model="paginaDestino"
          type="number"
          min="1"
          :max="Math.max(1, totalPages)"
          @keydown.enter="irParaPagina"
          class="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          @click="irParaPagina"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          OK
        </button>
      </div>
    </div>

    <!-- Tabela com altura aumentada -->
    <div class="overflow-auto max-h-[2000px] border border-gray-200 rounded-lg" style="scrollbar-width: thin;">
      <div class="min-w-full">
        <table class="w-full table-fixed" ref="table">
          <colgroup>
            <col v-for="column in visibleColumns" :key="column" :style="{ width: responsiveColumnWidths[column] + 'px' }">
          </colgroup>
          <VendasTableHeader 
            :visible-columns="visibleColumns"
            :column-titles="columnTitles"
            :dragged-column="draggedColumn"
            :column-filters="columnFilters"
            @drag-start="handleDragStart"
            @drag-over="handleDragOver"
            @drag-drop="handleDragDrop"
            @drag-end="handleDragEnd"
            @start-resize="handleStartResize"
            @clear-filters="clearAllFilters"
          />
          <tbody class="bg-white divide-y divide-gray-200">
            <VendasTableRow
              v-for="(venda, index) in paginatedVendas"
              :key="index"
              :venda="venda"
              :index="index"
              :visible-columns="visibleColumns"
            />
            <tr v-if="filteredRows.length === 0">
              <td :colspan="visibleColumns.length" class="px-6 py-8 text-center text-gray-500">
                Nenhuma venda encontrada
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td
                v-for="column in visibleColumns"
                :key="`total-${column}`"
                class="px-6 py-3 whitespace-nowrap text-sm font-semibold border-r border-gray-200 last:border-r-0"
                :class="numericColumns.has(column) ? 'text-slate-900 text-right' : 'text-slate-500'"
              >
                <span v-if="column === visibleColumns[0]">Totais (filtrados)</span>
                <span v-else-if="numericColumns.has(column)">{{ formatTotalCell(column) }}</span>
                <span v-else>-</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import VendasTableHeader from './VendasTableHeader.vue'
import VendasTableRow from './VendasTableRow.vue'
import BotaoAtualizarVendas from './BotaoAtualizarVendas.vue'

const props = defineProps({
  vendas: {
    type: Array,
    required: true
  },
  visibleColumns: {
    type: Array,
    required: true
  },
  columnTitles: {
    type: Object,
    required: true
  },
  responsiveColumnWidths: {
    type: Object,
    required: true
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

const emit = defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize', 'atualizar-vendas', 'erro-atualizacao'])

const dateColumns = new Set(['dataVenda'])
const numericColumns = new Set([
  'vendaBruta',
  'vendaLiquida',
  'taxaMdr',
  'despesaMdr',
  'numeroParcelas',
  'valorAntecipado',
  'despesasAntecipacao',
  'valorLiquidoAntec'
])
const currencyColumns = new Set([
  'vendaBruta',
  'vendaLiquida',
  'despesaMdr',
  'valorAntecipado',
  'despesasAntecipacao',
  'valorLiquidoAntec'
])

const columnFilters = reactive({})
const autorizadoraFiltro = ref('')
watch(() => props.visibleColumns, (cols) => {
  ;(cols || []).forEach((col) => {
    if (typeof columnFilters[col] === 'undefined') columnFilters[col] = ''
  })
}, { immediate: true, deep: true })

const autorizadorasDisponiveis = computed(() => {
  return Array.from(new Set((props.vendas || [])
    .map((v) => String(getRawValue(v, 'adquirente') || '').trim().toUpperCase())
    .filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
})

const normalizeText = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()

const getRawValue = (row, column) => {
  const map = {
    empresa: ['empresa'],
    matriz: ['matriz'],
    adquirente: ['adquirente'],
    dataVenda: ['dataVenda', 'data_venda'],
    modalidade: ['modalidade'],
    nsu: ['nsu'],
    vendaBruta: ['vendaBruta', 'valor_bruto'],
    vendaLiquida: ['vendaLiquida', 'valor_liquido'],
    taxaMdr: ['taxaMdr', 'taxa_mdr'],
    despesaMdr: ['despesaMdr', 'despesa_mdr'],
    numeroParcelas: ['numeroParcelas', 'numero_parcelas', 'numero_parceladas'],
    bandeira: ['bandeira'],
    valorAntecipado: ['valorAntecipado', 'valor_antecipacao'],
    despesasAntecipacao: ['despesasAntecipacao', 'despesa_antecipacao'],
    valorLiquidoAntec: ['valorLiquidoAntec', 'valor_liquido_antecipacao'],
    previsaoPgto: ['previsaoPgto', 'previsao_pgto'],
    auditoria: ['auditoria']
  }
  const keys = map[column] || [column]
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

const parseNumeric = (value) => {
  if (value === null || value === undefined || value === '') return NaN
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  const normalized = String(value).replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : NaN
}

const toIsoDate = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/')
    return `${y}-${m}-${d}`
  }
  const dateObj = new Date(str)
  if (isNaN(dateObj.getTime())) return ''
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const activeFiltersCount = computed(() => {
  return (props.visibleColumns || []).reduce((acc, col) => acc + (String(columnFilters[col] || '').trim() ? 1 : 0), 0)
})

const filteredRows = computed(() => {
  const rows = props.vendas || []
  return rows.filter((row) => {
    if (autorizadoraFiltro.value) {
      const adquirente = String(getRawValue(row, 'adquirente') || '').trim().toUpperCase()
      if (adquirente !== autorizadoraFiltro.value) return false
    }
    return (props.visibleColumns || []).every((col) => {
      const filterValue = String(columnFilters[col] || '').trim()
      if (!filterValue) return true
      const rawValue = getRawValue(row, col)
      if (dateColumns.has(col)) {
        return toIsoDate(rawValue) === filterValue
      }
      if (numericColumns.has(col)) {
        const rowNumber = parseNumeric(rawValue)
        const filterNumber = parseNumeric(filterValue)
        if (!Number.isFinite(rowNumber) || !Number.isFinite(filterNumber)) return false
        return rowNumber >= filterNumber
      }
      return normalizeText(rawValue).includes(normalizeText(filterValue))
    })
  })
})

// Estados da paginação
const currentPage = ref(1)
const itemsPerPage = ref(50) // Padrão 50 linhas
const paginaDestino = ref('1')

// Computeds para paginação
const totalItems = computed(() => filteredRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)))

const paginatedVendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRows.value.slice(start, end)
})

const totalsByColumn = computed(() => {
  const totals = {}
  numericColumns.forEach((col) => { totals[col] = 0 })
  ;(filteredRows.value || []).forEach((row) => {
    numericColumns.forEach((col) => {
      const n = parseNumeric(getRawValue(row, col))
      if (Number.isFinite(n)) totals[col] += n
    })
  })
  return totals
})

// Métodos de paginação
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const updatePagination = () => {
  currentPage.value = 1 // Reset para primeira página quando mudar itens por página
  paginaDestino.value = '1'
}

const clearAllFilters = () => {
  ;(props.visibleColumns || []).forEach((col) => {
    columnFilters[col] = ''
  })
  autorizadoraFiltro.value = ''
  currentPage.value = 1
  paginaDestino.value = '1'
}

const irParaPagina = () => {
  const total = Math.max(1, totalPages.value)
  const pagina = Number(paginaDestino.value)
  if (!Number.isFinite(pagina)) return
  const paginaFinal = Math.min(total, Math.max(1, Math.floor(pagina)))
  currentPage.value = paginaFinal
  paginaDestino.value = String(paginaFinal)
}

// Watch para resetar página quando vendas mudarem
watch(() => props.vendas.length, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value)
  }
  paginaDestino.value = String(Math.max(1, currentPage.value))
})
watch(filteredRows, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value)
  }
  paginaDestino.value = String(Math.max(1, currentPage.value))
})

const formatTotalCell = (column) => {
  const total = Number(totalsByColumn.value?.[column] || 0)
  if (!Number.isFinite(total)) return '-'
  if (currencyColumns.has(column)) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
  }
  if (column === 'taxaMdr') return `${total.toFixed(2)}%`
  if (column === 'numeroParcelas') return String(Math.round(total))
  return total.toFixed(2)
}

// Handlers para os eventos de drag and drop
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

// Métodos para o botão de atualizar vendas
const handleAtualizarVendas = () => {
  emit('atualizar-vendas')
}

const handleErroAtualizacao = (erro) => {
  emit('erro-atualizacao', erro)
}
</script>

<style scoped>
/* Estilizar barras de rolagem */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
