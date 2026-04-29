<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <BancosHeader 
      :total-movimentacoes="totalItems"
      :saldo-total="saldoTotal"
      @dados-atualizados="handleDadosAtualizados"
      @erro-atualizacao="handleErroAtualizacao"
    />
    
    <!-- Navegação das Abas -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mt-4">
      <div class="px-12 py-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <nav class="flex items-center space-x-8">
          <button
            @click="abaAtiva = 'movimentacoes'"
            class="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 border"
            :class="abaAtiva === 'movimentacoes' 
              ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 hover:text-blue-800'
              : 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800'"
          >
            Movimentações
          </button>
          <button
            @click="abaAtiva = 'extrato-detalhado'"
            class="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 border"
            :class="abaAtiva === 'extrato-detalhado' 
              ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 hover:text-blue-800'
              : 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800'"
          >
            Extrato Detalhado
          </button>
        </nav>
      </div>
    </div>
    
    <!-- Conteúdo das Abas -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[750px] mt-6">
      <div class="p-0 h-full">
        <!-- Conteúdo da Aba Movimentações -->
        <div v-show="abaAtiva === 'movimentacoes'" class="flex-1 flex flex-col h-full">
    
    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Carregando dados bancários...</p>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button 
          @click="recarregarDados"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="!movimentacoes || movimentacoes.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-gray-400 text-6xl mb-4">🏦</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma movimentação encontrada</h3>
        <p class="text-gray-600 mb-4">Selecione uma empresa para visualizar os dados bancários</p>
        <button 
          @click="recarregarDados"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Recarregar dados
        </button>
      </div>
    </div>
    
    <!-- Conteúdo quando há dados -->
    <div v-else class="flex-1 flex flex-col min-h-[650px]">
      
      <!-- Container fluido para alinhar cards e tabela -->
      <div class="w-full space-y-4">
        <!-- Cards de Resumo em container separado com rolagem própria -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div class="p-0 mx-auto" :style="{ maxWidth: containerMaxWidthPx + 'px' }">
            <BancosResumoCards 
              :movimentacoes="cleanMovimentacoes" 
              :active-filter="selectedAdquirente"
              @filter-adquirente="handleFilterAdquirente"
            />
          </div>
        </div>

        <!-- Tabela -->
        <div class="p-0 mx-auto" :style="{ maxWidth: containerMaxWidthPx + 'px' }">
          <BancosTable 
            :movimentacoes="localPaginatedMovimentacoes"
            :visible-columns="visibleColumns"
            :column-titles="columnTitles"
            :responsive-column-widths="responsiveColumnWidths"
            :dragged-column="draggedColumn"
            :column-order="columnOrder"
            :previsoes-diarias="previsoesDiarias"
            :totais="totaisTabela"
            @drag-start="onDragStart"
            @drag-over="onDragOver"
            @drag-drop="onDrop"
            @drag-end="onDragEnd"
            @start-resize="startResize"
            @data-clicked="handleDataClick"
            @status-clicked="handleStatusClicked"
          />
        </div>
      </div>

      <!-- Paginação -->
      <BancosPagination
        :current-page="currentPage"
        :total-pages="localTotalPages"
        :total-items="localTotalItems"
        :items-per-page="itemsPerPage"
        :available-page-sizes="availablePageSizes"
        :totais="totaisTabela"
        :visible-columns="visibleColumns"
        :responsive-column-widths="responsiveColumnWidths"
        @set-page="setPage"
        @next-page="handleNextPage"
        @prev-page="handlePrevPage"
        @update:items-per-page="setItemsPerPage"
      />
    </div>
        </div>
        
        <!-- Conteúdo da Aba Extrato Detalhado -->
        <ExtratoDetalhadoContainer v-show="abaAtiva === 'extrato-detalhado'" />
      </div>
    </div>
  </div>

  <MovimentacaoConciliacaoContainer
    :movimentacao="movimentacaoSelecionada"
    @close="fecharConciliacao"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useBancosVendas } from '~/composables/PageBancos/useBancosVendas'
import { useBancosPrevisao } from '~/composables/PageBancos/useBancosPrevisao'

// Componentes
import BancosHeader from './BancosHeader.vue'
import BancosTable from './BancosTable.vue'
import BancosResumoCards from './BancosResumoCards.vue'
import BancosPagination from './BancosPagination.vue'
import ExtratoDetalhadoContainer from './ExtratoDetalhadoContainer.vue'
import MovimentacaoConciliacaoContainer from './MovimentacaoConciliacaoContainer.vue'

// Composables (declaração única)
const { empresaSelecionada } = useEmpresas()
const { screenSize, windowWidth, initializeResponsive, getResponsiveColumnWidths } = useResponsiveColumns()
const {
  loading,
  error,
  movimentacoes,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  availablePageSizes,
  saldoTotal,
  fetchMovimentacoes,
  setPage,
  setItemsPerPage,
  filtrarVendasPorData,
  configurarListenerGlobal,
  dadosCarregados
} = useBancosVendas()

const {
  loading: loadingPrevisao,
  error: errorPrevisao,
  previsoesDiarias,
  calcularPrevisoesDiarias
} = useBancosPrevisao()

// Estados locais
const draggedColumn = ref(null)
const abaAtiva = ref('movimentacoes')
const selectedAdquirente = ref(null)
const movimentacaoSelecionada = ref(null)

// Largura máxima do container adaptada à resolução
const containerMaxWidthPx = computed(() => {
  const w = windowWidth.value || 1920
  const margin = 32
  const maxW = Math.min(w - margin, 2200 - margin)
  return Math.max(980 - margin, Math.round(maxW))
})
// Computed para filtrar movimentações localmente (Removendo OUTROS)
const cleanMovimentacoes = computed(() => {
  if (!movimentacoes.value) return []
  return movimentacoes.value.filter(mov => !mov.adquirente || mov.adquirente.toUpperCase() !== 'OUTROS')
})

const filteredMovimentacoes = computed(() => {
  if (!selectedAdquirente.value) {
    return cleanMovimentacoes.value
  }
  
  return cleanMovimentacoes.value.filter(mov => 
    mov.adquirente === selectedAdquirente.value
  )
})

// Computed para paginação local (baseada no filtro)
const localTotalItems = computed(() => filteredMovimentacoes.value.length)
const localTotalPages = computed(() => Math.ceil(localTotalItems.value / itemsPerPage.value))

const localPaginatedMovimentacoes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredMovimentacoes.value.slice(start, end)
})

// Handler para filtro de adquirente
const handleFilterAdquirente = (adquirente) => {
  selectedAdquirente.value = adquirente
  movimentacaoSelecionada.value = null
  setPage(1) // Resetar para primeira página ao filtrar
}

const handleStatusClicked = ({ banco }) => {
  movimentacaoSelecionada.value = banco || null
}

const fecharConciliacao = () => {
  movimentacaoSelecionada.value = null
}

// Colunas visíveis
const allColumns = ref([
  'data',
  'adquirente',
  'previsto',
  'debitosAntecipacao',
  'debitos',
  'deposito',
  'saldoConciliacao',
  'status'
])

const visibleColumns = computed(() => {
  return allColumns.value
})

// Ordem das colunas (para drag and drop)
const columnOrder = computed(() => {
  return [...allColumns.value]
})

// Títulos das colunas
const columnTitles = ref({
  data: 'Data',
  adquirente: 'Adquirente',
  previsto: 'Previsto',
  debitosAntecipacao: 'Débitos c/ antecipação',
  debitos: 'Débitos',
  deposito: 'Depósito',
  saldoConciliacao: 'Saldo',
  status: 'Status'
})

// Larguras base das colunas (padrão Controladoria Recebimentos)
const responsiveColumnWidths = computed(() => {
  const baseWidths = {
    data: 95,
    adquirente: 260,
    previsto: 150,
    debitosAntecipacao: 150,
    debitos: 140,
    deposito: 150,
    saldoConciliacao: 150,
    status: 130
  }
  return getResponsiveColumnWidths(baseWidths, 'vendas')
})

// Função principal para recarregar todos os dados
const recarregarDados = async (forcarRecarregamento = false) => {
  try {
    await Promise.all([
      fetchMovimentacoes({}, forcarRecarregamento),
      calcularPrevisoesDiarias()
    ])
  } catch (err) {
    error.value = err.message || 'Erro ao carregar dados'
  }
}

// Totais calculados para o footer da tabela
const totaisTabela = computed(() => {
  const totais = {
    previsto: 0,
    debitosAntecipacao: 0,
    debitos: 0,
    deposito: 0,
    saldoConciliacao: 0
  }
  
  // Usar dados filtrados (sem "OUTROS" e com filtro de adquirente se houver)
  const dados = filteredMovimentacoes.value
  
  if (!dados || dados.length === 0) return totais
  
  dados.forEach(item => {
    totais.previsto += Number(item.previsto || 0)
    totais.debitosAntecipacao += Number(item.debitosAntecipacao || 0)
    totais.debitos += Number(item.debitos || 0)
    totais.deposito += Number(item.deposito || 0)
    totais.saldoConciliacao += Number(item.saldoConciliacao || 0)
  })
  
  return totais
})

// Handlers para paginação
const handleNextPage = () => {
  if (currentPage.value < localTotalPages.value) {
    setPage(currentPage.value + 1)
  }
}

const handlePrevPage = () => {
  if (currentPage.value > 1) {
    setPage(currentPage.value - 1)
  }
}

// Handlers
const handleDadosAtualizados = async () => {
  await recarregarDados(true)
}

const handleErroAtualizacao = (erro) => {
  error.value = erro
}

// Função para lidar com clique na data
const handleDataClick = async (data) => {
  if (data) {
    // Filtrar vendas por data específica
    await filtrarVendasPorData(data)
  }
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

// Variáveis para armazenar as funções de cleanup
let stopWatchingEmpresa = null
let stopListeningGlobal = null

// Watchers e lifecycle
onMounted(async () => {
  await nextTick()
  initializeResponsive()
  if (!dadosCarregados.value) {
    await recarregarDados()
  }
  stopListeningGlobal = configurarListenerGlobal()
  stopWatchingEmpresa = watch(empresaSelecionada, async (novaEmpresa, empresaAnterior) => {
    if (novaEmpresa !== empresaAnterior) {
      movimentacaoSelecionada.value = null
      await recarregarDados(true)
    }
  }, { immediate: false })
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  // Limpando watchers do componente bancos...
  
  // Limpar watcher da empresa
  if (stopWatchingEmpresa) {
    stopWatchingEmpresa()
    stopWatchingEmpresa = null
  }
  
  // Limpar listener global
  if (stopListeningGlobal) {
    stopListeningGlobal()
    stopListeningGlobal = null
  }
  
  // Limpar outros recursos se necessário
  draggedColumn.value = null
})
</script>
