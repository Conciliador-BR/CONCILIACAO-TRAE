<template>
  <!-- Remover rounded-lg, shadow-sm e border para ocupar toda a tela -->
  <div class="bg-white w-full h-screen flex flex-col">
    <!-- Header -->
    <PrevisaoPagamentosHeader 
      @dados-atualizados="handleDadosAtualizados"
      @erro-atualizacao="handleErroAtualizacao"
    />

    <!-- Resumo Financeiro -->
    <div v-if="!loading && !error && previsoes && previsoes.length > 0" class="px-6 py-4">
      <ResumoPagamentos 
        :venda-bruta-total="vendaBrutaTotal"
        :venda-liquida-total="vendaLiquidaTotal"
        :total-mdr="totalMdr"
        :media-taxa-mdr="mediaTaxaMdr"
        :total-items="totalItems"
      />
    </div>

    <!-- Filtros -->
    <div v-if="!loading && !error" class="px-6">
      <FiltroModalidade 
        @aplicar-filtros="aplicarFiltroModalidade"
      />
    </div>

    <!-- Status Bar -->
    <PrevisaoPagamentosStatusBar 
      :screen-size="screenSize"
      :window-width="windowWidth"
      :visible-columns="allColumns.length"
      :total-columns="allColumns.length"
    />

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Carregando previsões do Supabase...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center text-red-600">
        <p>Erro: {{ error }}</p>
        <button @click="fetchPrevisoes" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Tentar Novamente
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!previsoes || previsoes.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-500">
        <p>Nenhuma venda encontrada para calcular previsões.</p>
        <button @click="fetchPrevisoes" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Recarregar
        </button>
      </div>
    </div>

    <!-- Table - Ocupar todo o espaço restante -->
    <div v-else class="flex-1 flex flex-col min-h-0">
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

    <!-- Footer com novos cálculos -->
    <PrevisaoPagamentosFooter 
      :total-vendas="totalItems"
      :venda-bruta-total="vendaBrutaTotal"
      :venda-liquida-total="vendaLiquidaTotal"
      :total-mdr="totalMdr"
      :media-taxa-mdr="mediaTaxaMdr"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { usePrevisaoSupabase } from '~/composables/PagePagamentos/filtrar_tabelas_previsao/usePrevisaoSupabase'

// Componentes
import PrevisaoPagamentosHeader from './PrevisaoPagamentosHeader.vue'
import PrevisaoPagamentosStatusBar from './PrevisaoPagamentosStatusBar.vue'
import PrevisaoPagamentosTable from './PrevisaoPagamentosTable.vue'
import PrevisaoPagamentosFooter from './PrevisaoPagamentosFooter.vue'
import PrevisaoPagamentsPagination from './PrevisaoPagamentsPagination.vue'
import ResumoPagamentos from './ResumoPagamentos.vue'
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
const handleDadosAtualizados = async () => {
  console.log('Dados atualizados, recarregando previsões...')
  await fetchPrevisoes()
}

const handleErroAtualizacao = (erro) => {
  error.value = erro
}

// Função para aplicar filtros
const aplicarFiltroModalidade = (filtros) => {
  console.log('🔄 [CONTAINER] Aplicando filtros:', filtros)
  
  // Aplicar filtros usando o composable
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
  console.log('🔄 [CONTAINER] Filtros globais recebidos:', dadosFiltros)
  console.log('📅 [CONTAINER] Filtros de data:', {
    dataInicial: dadosFiltros.dataInicial,
    dataFinal: dadosFiltros.dataFinal
  })
  
  // Aplicar filtros usando o usePrevisaoSupabase
  await aplicarFiltros({
    empresa: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  })
  
  console.log('✅ [CONTAINER] Filtros aplicados com sucesso')
}

// Watchers e lifecycle
onMounted(async () => {
  console.log('🚀 Componente montado, carregando previsões...')
  
  // Aplicar filtros globais existentes na inicialização
  if (filtrosGlobais.dataInicial || filtrosGlobais.dataFinal || filtrosGlobais.empresaSelecionada) {
    console.log('📅 [CONTAINER] Aplicando filtros globais existentes na inicialização:', filtrosGlobais)
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
  console.log('🎧 [CONTAINER] Listener configurado para filtros globais')
})

// Watcher para mudanças nos filtros globais
watch(() => [filtrosGlobais.dataInicial, filtrosGlobais.dataFinal, filtrosGlobais.empresaSelecionada], 
  async ([novaDataInicial, novaDataFinal, novaEmpresa], [antigaDataInicial, antigaDataFinal, antigaEmpresa]) => {
    // Verificar se houve mudança real nos filtros
    const mudouData = novaDataInicial !== antigaDataInicial || novaDataFinal !== antigaDataFinal
    const mudouEmpresa = novaEmpresa !== antigaEmpresa
    
    if (mudouData || mudouEmpresa) {
      console.log('🔄 [CONTAINER] Filtros globais mudaram, reaplicando...')
      console.log('📅 [CONTAINER] Nova data:', { dataInicial: novaDataInicial, dataFinal: novaDataFinal })
      console.log('🏢 [CONTAINER] Nova empresa:', novaEmpresa)
      
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
  console.log('🧹 Limpando listeners do componente previsões...')
  if (stopListening) {
    stopListening()
    stopListening = null
  }
})
</script>