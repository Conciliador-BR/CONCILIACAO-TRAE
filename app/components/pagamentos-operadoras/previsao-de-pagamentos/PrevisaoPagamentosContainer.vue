<template>
  <!-- Remover rounded-lg, shadow-sm e border para ocupar toda a tela -->
  <div class="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden backdrop-blur-sm flex flex-col">
    

    

    <!-- Cards de Resumo -->
    <div v-if="!loading && !error && allPrevisoes && allPrevisoes.length > 0" class="px-6 py-4">
      <ResumoCardsPrevisao :dados="allPrevisoes" />
    </div>

    <!-- Filtros -->
    <div v-if="!loading && !error" class="px-6">
      <FiltroModalidade 
        @aplicar-filtros="aplicarFiltroModalidade"
      />
    </div>

    

    <!-- Loading -->
    <div v-if="loading" class="px-8 py-16 text-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
          <svg class="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
        <p class="text-gray-700 font-semibold text-lg mb-2">Carregando previsões...</p>
        <p class="text-sm text-gray-600">Aguarde enquanto processamos os dados</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="px-8 py-16 text-center bg-gradient-to-br from-red-50/50 to-rose-50/50">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 shadow-lg">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <p class="text-red-700 font-semibold text-lg mb-2">Erro ao carregar previsões</p>
      <p class="text-sm text-gray-600 mb-6">{{ error }}</p>
      <button @click="fetchPrevisoes" class="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
        Tentar novamente
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!previsoes || previsoes.length === 0" class="px-8 py-16 text-center bg-gradient-to-br from-slate-50/50 to-gray-50/50">
      <p class="text-gray-700 font-semibold text-lg mb-2">Nenhuma venda encontrada para previsões</p>
      <p class="text-sm text-gray-600 mb-6">Ajuste os filtros ou recarregue os dados</p>
      <button @click="fetchPrevisoes" class="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
        Recarregar
      </button>
    </div>

    <!-- Table - Ocupar todo o espaço restante -->
    <div v-else class="overflow-hidden bg-white/50 backdrop-blur-sm">
      <PrevisaoPagamentosTable 
        :vendas="previsoes"
        :visible-columns="allColumns"
        :column-titles="columnTitles"
        :responsive-column-widths="baseColumnWidths"
        :dragged-column="draggedColumn"
        :column-order="columnOrder"
        @drag-start="onDragStart"
        @drag-over="onDragOver"
        @drag-drop="onDrop"
        @drag-end="onDragEnd"
        @start-resize="startResize"
      />
      
      <!-- Paginação -->
      <PrevisaoPagamentsPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="itemsPerPage"
        :available-page-sizes="availablePageSizes"
        @set-page="setPage"
        @next-page="nextPage"
        @prev-page="prevPage"
        @update:items-per-page="setItemsPerPage"
      />
    </div>

    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { usePrevisaoSupabase } from '~/composables/PagePagamentos/filtrar_tabelas_previsao/usePrevisaoSupabase'

// Componentes
import PrevisaoPagamentosTable from './PrevisaoPagamentosTable.vue'
import PrevisaoPagamentsPagination from './PrevisaoPagamentsPagination.vue'
import ResumoCardsPrevisao from './ResumoCardsPrevisao.vue'
 
import FiltroModalidade from './FiltroModalidade.vue'

// Estados
const draggedColumn = ref(null)
const columnOrder = ref([])

// Composables
const { filtrosGlobais, escutarEvento } = useGlobalFilters()
const { screenSize, windowWidth } = useResponsiveColumns()
const {
  loading,
  error,
  previsoes,
  allPrevisoes,
  vendaBrutaTotal,
  vendaLiquidaTotal,
  totalMdr,
  mediaTaxaMdr,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  availablePageSizes,
  fetchPrevisoes,
  aplicarFiltros,
  setPage,
  setItemsPerPage,
  nextPage,
  prevPage
} = usePrevisaoSupabase()

// Colunas
const allColumns = ref([
  'empresa',
  'matriz',
  'adquirente', 
  'bandeira',
  'dataVenda',
  'previsaoPgto',
  'modalidade',
  'nsu',
  'vendaBruta',
  'vendaLiquida',
  'taxaMdr',
  'despesaMdr',
  'numeroParcelas'
])

// Títulos das colunas
const columnTitles = {
  empresa: 'Empresa',
  matriz: 'Matriz',
  adquirente: 'Adquirente',
  bandeira: 'Bandeira',
  dataVenda: 'Data Venda',
  previsaoPgto: 'Previsão Pgto',
  modalidade: 'Modalidade',
  nsu: 'NSU',
  vendaBruta: 'Venda Bruta',
  vendaLiquida: 'Venda Líquida',
  taxaMdr: 'Taxa MDR',
  despesaMdr: 'Despesa MDR',
  numeroParcelas: 'Parcelas'
}

// Larguras das colunas
const baseColumnWidths = ref({
  empresa: 150,
  matriz: 120,
  adquirente: 120,
  bandeira: 100,
  dataVenda: 120,
  previsaoPgto: 120,
  modalidade: 100,
  nsu: 100,
  vendaBruta: 120,
  vendaLiquida: 120,
  taxaMdr: 100,
  despesaMdr: 120,
  numeroParcelas: 100
})

// Handlers

// Função para aplicar filtros
const aplicarFiltroModalidade = (filtros) => {
  aplicarFiltros({
    modalidade: filtros.modalidade,
    bandeira: filtros.bandeira,
    dataVenda: filtros.dataVenda,
    vendaBruta: filtros.vendaBruta,
    nsu: filtros.nsu
  })
}

// Drag and drop handlers
const onDragStart = (event, column, index) => {
  draggedColumn.value = { column, index }
}

const onDragOver = (event) => {
  event.preventDefault()
}

const onDrop = (event, targetIndex) => {
  // Implementar lógica de drop se necessário
}

const onDragEnd = () => {
  draggedColumn.value = null
}

const startResize = (event, column) => {
  // Implementar redimensionamento se necessário
}

// Variável para armazenar a função de cleanup do listener
let stopListening

// Função para aplicar filtros quando recebidos do sistema global
const aplicarFiltrosGlobais = async (dadosFiltros) => {
  await aplicarFiltros({
    empresa: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  })
}

// Watchers e lifecycle
onMounted(async () => {
  if (filtrosGlobais.dataInicial || filtrosGlobais.dataFinal || filtrosGlobais.empresaSelecionada) {
    await aplicarFiltros({
      empresa: filtrosGlobais.empresaSelecionada || '',
      dataInicial: filtrosGlobais.dataInicial || '',
      dataFinal: filtrosGlobais.dataFinal || ''
    })
  } else {
    await fetchPrevisoes()
  }
  
  // Configurar listener para eventos globais
  stopListening = escutarEvento('filtrar-pagamentos', aplicarFiltrosGlobais)
})

// Watcher para mudanças nos filtros globais
watch(() => [filtrosGlobais.dataInicial, filtrosGlobais.dataFinal, filtrosGlobais.empresaSelecionada], 
  async ([novaDataInicial, novaDataFinal, novaEmpresa], [antigaDataInicial, antigaDataFinal, antigaEmpresa]) => {
    // Verificar se houve mudança real nos filtros
    const mudouData = novaDataInicial !== antigaDataInicial || novaDataFinal !== antigaDataFinal
    const mudouEmpresa = novaEmpresa !== antigaEmpresa
    
    if (mudouData || mudouEmpresa) {
      await aplicarFiltros({
        empresa: novaEmpresa || '',
        dataInicial: novaDataInicial || '',
        dataFinal: novaDataFinal || ''
      })
    }
  }, 
  { deep: true }
)

// Cleanup ao desmontar o componente
onUnmounted(() => {
  if (stopListening) {
    stopListening()
    stopListening = null
  }
})
</script>