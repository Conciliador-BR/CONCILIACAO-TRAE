<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6">
    <!-- Container Principal -->
    <div class="max-w-7xl mx-auto">
      <!-- Header Principal -->
      <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl mb-6 overflow-hidden">
        <div class="px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-white mb-1">Recebimentos</h1>
                <p class="text-blue-100">Gerencie e acompanhe seus recebimentos</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <span class="text-blue-100 text-sm">Total de registros</span>
                <div class="text-white font-bold text-lg">{{ vendas.length }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Header Component -->
        <div class="bg-white/5 backdrop-blur-sm border-t border-white/10">
          <RecebimentosHeader 
            @dados-atualizados="handleDadosAtualizados"
            @erro-atualizacao="handleErroAtualizacao"
          />
        </div>
      </div>

      <!-- Status Bar -->
      <RecebimentosStatusBar 
        :screen-size="screenSize" 
        :window-width="windowWidth" 
        :visible-columns="allColumns.length" 
        :total-columns="allColumns.length" 
        class="mb-6"
      />

      <!-- Container da Tabela -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
          <p class="text-gray-600 font-medium">Carregando recebimentos...</p>
          <p class="text-gray-500 text-sm mt-1">Aguarde enquanto processamos os dados</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p class="text-red-600 font-medium mb-2">Erro ao carregar recebimentos</p>
          <p class="text-gray-600 text-sm mb-4">{{ error }}</p>
          <button @click="emit('tentar-refetch')" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Tentar novamente
          </button>
        </div>

        <!-- Tabela -->
        <RecebimentosTable 
          v-else
          :vendas="vendas"
          :visible-columns="allColumns"
          :column-titles="columnTitles"
          :responsive-column-widths="baseColumnWidths"
          :dragged-column="draggedColumn"
          :column-order="columnOrder"
          @remover-venda="handleRemoverVenda"
          @drag-start="onDragStart"
          @drag-over="onDragOver"
          @drag-drop="onDrop"
          @drag-end="onDragEnd"
          @start-resize="startResize"
        />
      </div>

      <!-- Footer -->
      <RecebimentosFooter 
        :total-vendas="vendas.length"
        :venda-bruta-total="vendaBrutaTotal"
        :venda-liquida-total="vendaLiquidaTotal"
        class="mt-6"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

// Importar componentes filhos
import RecebimentosHeader from './RecebimentosHeader.vue'
import RecebimentosStatusBar from './RecebimentosStatusBar.vue'
import RecebimentosTable from './RecebimentosTable.vue'
import RecebimentosFooter from './RecebimentosFooter.vue'

// Props
const props = defineProps({
  vendas: {
    type: Array,
    default: () => []
  }
})

// Emit para pedir refetch ao pai
const emit = defineEmits(['tentar-refetch'])

// Estados
const loading = ref(false)
const error = ref(null)
const draggedColumn = ref('')
const draggedIndex = ref(-1)

// Usar composables
const {
  screenSize,
  windowWidth,
  initializeResponsive
} = useResponsiveColumns()

const { fetchEmpresas } = useEmpresas()
const { filtrosGlobais } = useGlobalFilters()

// Remover dependência de useVendas e calcular totais a partir do props.vendas
const vendaBrutaTotal = computed(() => {
  return (props.vendas || []).reduce((total, venda) => {
    // Supabase: valor_bruto
    const valor = typeof venda?.valor_bruto === 'number'
      ? venda.valor_bruto
      : parseFloat(venda?.valor_bruto)
    return total + (isNaN(valor) ? 0 : valor)
  }, 0)
})

const vendaLiquidaTotal = computed(() => {
  return (props.vendas || []).reduce((total, venda) => {
    // Supabase: valor_liquido
    const valor = typeof venda?.valor_liquido === 'number'
      ? venda.valor_liquido
      : parseFloat(venda?.valor_liquido)
    return total + (isNaN(valor) ? 0 : valor)
  }, 0)
})

// Definir colunas específicas para recebimentos
const baseColumns = ref([
  'empresa',
  'matriz',
  'adquirente',
  'dataVenda',
  'modalidade', 
  'nsu',
  'vendaBruta',
  'vendaLiquida',
  'taxaMdr',
  'despesaMdr',
  'numeroParcelas',
  'bandeira',
  'valorAntecipado',
  'despesasAntecipacao',
  'valorLiquidoAntec'
])

// Computed para controlar colunas visíveis - sempre mostrar todas as colunas
const allColumns = computed(() => {
  return [...baseColumns.value]
})

// Ordem das colunas (para drag and drop)
const columnOrder = computed(() => {
  if (!process.client) return [...allColumns.value]
  
  const savedOrder = localStorage.getItem('recebimentos-column-order')
  if (savedOrder) {
    const parsed = JSON.parse(savedOrder)
    return parsed.filter(col => allColumns.value.includes(col))
  }
  return [...allColumns.value]
})

// Títulos das colunas
const columnTitles = ref({
  dataVenda: 'Data da Venda',
  modalidade: 'Modalidade',
  nsu: 'NSU',
  vendaBruta: 'Venda Bruta',
  vendaLiquida: 'Venda Líquida',
  taxaMdr: 'Taxa MDR',
  despesaMdr: 'Despesa MDR',
  numeroParcelas: 'Parcelas',
  bandeira: 'Bandeira',
  valorAntecipado: 'Valor Antecipado',
  despesasAntecipacao: 'Despesas Antecipação',
  valorLiquidoAntec: 'Valor Líquido Antec.',
  empresa: 'Empresa',
  matriz: 'Matriz',
  adquirente: 'Adquirente'
})

// Larguras base das colunas
const baseColumnWidths = ref({
  dataVenda: 120,
  modalidade: 130,
  nsu: 100,
  vendaBruta: 120,
  vendaLiquida: 120,
  taxaMdr: 100,
  despesaMdr: 120,
  numeroParcelas: 120,
  bandeira: 100,
  valorAntecipado: 140,
  despesasAntecipacao: 160,
  valorLiquidoAntec: 150,
  empresa: 150,
  matriz: 100,
  adquirente: 120
})

// Handlers
const handleDadosAtualizados = () => {
  console.log('Dados de recebimentos atualizados')
}

const handleErroAtualizacao = (erro) => {
  error.value = erro
}

const handleRemoverVenda = (vendaId) => {
  console.log('Remover recebimento:', vendaId)
}

// Drag and drop handlers
const onDragStart = (event, column, index) => {
  draggedColumn.value = column
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/html', column)
}

const onDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

const onDrop = (event, targetIndex) => {
  event.preventDefault()
  
  if (draggedIndex.value !== -1 && draggedIndex.value !== targetIndex) {
    const newOrder = [...columnOrder.value]
    const draggedCol = newOrder[draggedIndex.value]
    newOrder.splice(draggedIndex.value, 1)
    newOrder.splice(targetIndex, 0, draggedCol)
    
    if (process.client) {
      localStorage.setItem('recebimentos-column-order', JSON.stringify(newOrder))
    }
  }
}

const onDragEnd = () => {
  draggedColumn.value = ''
  draggedIndex.value = -1
}

const startResize = (event, column) => {
  // Lógica de redimensionamento
}

// Lifecycle
onMounted(() => {
  initializeResponsive()
})

// Watch para detectar mudanças nos filtros globais
watch(() => filtrosGlobais.value, () => {
  // Emitir evento para o componente pai refetch os dados
  emit('tentar-refetch')
}, { deep: true })
</script>