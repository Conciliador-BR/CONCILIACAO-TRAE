<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <BancosHeader 
      @dados-atualizados="handleDadosAtualizados"
      @erro-atualizacao="handleErroAtualizacao"
    />
    
    <!-- Status Bar -->
    <BancosStatusBar 
      :loading="loading"
      :error="error"
      :total-items="totalItems"
    />
    
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
    
    <!-- Table - Ocupar todo o espaço restante -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <BancosTable 
        :movimentacoes="movimentacoes"
        :visible-columns="visibleColumns"
        :column-titles="columnTitles"
        :responsive-column-widths="responsiveColumnWidths"
        :dragged-column="draggedColumn"
        :column-order="columnOrder"
        :previsoes-diarias="previsoesDiarias"
        @drag-start="onDragStart"
        @drag-over="onDragOver"
        @drag-drop="onDrop"
        @drag-end="onDragEnd"
        @start-resize="startResize"
      />
      
      <!-- Paginação -->
      <BancosPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="itemsPerPage"
        :available-page-sizes="availablePageSizes"
        @set-page="setPage"
        @next-page="handleNextPage"
        @prev-page="handlePrevPage"
        @update:items-per-page="setItemsPerPage"
      />
    </div>
    
    <!-- Footer -->
    <BancosFooter 
      :total-movimentacoes="totalItems"
      :total-creditos="totalCreditos"
      :total-debitos="totalDebitos"
      :saldo-total="saldoTotal"
      :media-creditos="mediaCreditos"
      :total-geral-previsto="totalGeralPrevisto"
      :total-dias-com-previsao="totalDiasComPrevisao"
      :total-vendas-previstas="totalVendasPrevistas"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useBancosSupabase } from '~/composables/PageBancos/useBancosSupabase'
import { useBancosPrevisao } from '~/composables/PageBancos/useBancosPrevisao'

// Componentes
import BancosHeader from './BancosHeader.vue'
import BancosStatusBar from './BancosStatusBar.vue'
import BancosTable from './BancosTable.vue'
import BancosFooter from './BancosFooter.vue'
import BancosPagination from './BancosPagination.vue'

// Composables (declaração única)
const { empresaSelecionada } = useEmpresas()
const { screenSize, windowWidth } = useResponsiveColumns()
const {
  loading,
  error,
  movimentacoes,
  totalCreditos,
  totalDebitos,
  saldoTotal,
  mediaCreditos,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  availablePageSizes,
  fetchMovimentacoes,
  setPage,
  setItemsPerPage,
  updateMovimentacao,
  deleteMovimentacao
} = useBancosSupabase()

const {
  loading: loadingPrevisao,
  error: errorPrevisao,
  previsoesDiarias,
  totalGeralPrevisto,
  totalDiasComPrevisao,
  totalVendasPrevistas,
  calcularPrevisoesDiarias
} = useBancosPrevisao()

// Estados locais
const draggedColumn = ref(null)

// Colunas visíveis
const allColumns = ref([
  'empresa',
  'banco', 
  'agencia',
  'conta',
  'data',
  'adquirente',
  'previsto',
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
  empresa: 'Empresa',
  banco: 'Banco',
  agencia: 'Agência', 
  conta: 'Conta',
  data: 'Data',
  adquirente: 'Adquirente',
  previsto: 'Previsto',
  debitos: 'Débitos',
  deposito: 'Depósito',
  saldoConciliacao: 'Saldo',
  status: 'Status'
})

// Larguras responsivas das colunas
const responsiveColumnWidths = computed(() => {
  const baseWidths = {
    empresa: 150,
    banco: 120,
    agencia: 100,
    conta: 120,
    data: 120,
    adquirente: 140,
    previsto: 120,
    debitos: 120,
    deposito: 120,
    saldoConciliacao: 120,
    status: 100
  }
  
  return baseWidths
})

// Função principal para recarregar todos os dados
const recarregarDados = async () => {
  try {
    console.log('🔄 Iniciando recarregamento de dados bancários...')
    
    // Executar ambas as operações em paralelo
    await Promise.all([
      fetchMovimentacoes(),
      calcularPrevisoesDiarias()
    ])
    
    console.log('✅ Dados recarregados com sucesso')
    console.log('📊 Movimentações carregadas:', movimentacoes.value?.length || 0)
    console.log('📈 Previsões calculadas:', previsoesDiarias.value?.length || 0)
  } catch (err) {
    console.error('💥 Erro ao recarregar dados:', err)
    error.value = err.message || 'Erro ao carregar dados'
  }
}

// Handlers para paginação
const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
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
  console.log('Dados atualizados, recarregando movimentações e previsões...')
  await recarregarDados()
}

const handleErroAtualizacao = (erro) => {
  error.value = erro
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

// Variável para armazenar a função de cleanup do watcher
let stopWatchingEmpresa = null

// Watchers e lifecycle
onMounted(async () => {
  console.log('🚀 Componente bancos montado, carregando dados...')
  
  // Aguardar próximo tick para garantir que tudo está montado
  await nextTick()
  
  // Carregar dados iniciais
  await recarregarDados()
  
  // Configurar watcher com cleanup adequado
  stopWatchingEmpresa = watch(empresaSelecionada, async (novaEmpresa, empresaAnterior) => {
    // Só recarregar se a empresa realmente mudou
    if (novaEmpresa !== empresaAnterior) {
      console.log('🏢 Empresa alterada, recarregando dados bancários e previsões:', novaEmpresa)
      await recarregarDados()
    }
  }, { immediate: false })
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  console.log('🧹 Limpando watchers do componente bancos...')
  
  // Limpar watcher da empresa
  if (stopWatchingEmpresa) {
    stopWatchingEmpresa()
    stopWatchingEmpresa = null
  }
  
  // Limpar outros recursos se necessário
  draggedColumn.value = null
})
</script>