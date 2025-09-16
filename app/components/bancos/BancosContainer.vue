<template>
  <div class="bg-white w-full h-screen flex flex-col">
    <!-- Header -->
    <BancosHeader 
      @dados-atualizados="handleDadosAtualizados"
      @erro-atualizacao="handleErroAtualizacao"
    />

    <!-- Status Bar -->
    <BancosStatusBar 
      :screen-size="screenSize"
      :window-width="windowWidth"
      :visible-columns="allColumns.length"
      :total-columns="allColumns.length"
    />

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Carregando dados bancários e previsões...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center text-red-600">
        <p>Erro: {{ error }}</p>
        <button @click="recarregarDados" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Tentar Novamente
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!movimentacoes || movimentacoes.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-500">
        <p>Nenhuma movimentação bancária encontrada.</p>
        <button @click="recarregarDados" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Recarregar
        </button>
      </div>
    </div>

    <!-- Table -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <BancosTable 
        :movimentacoes="movimentacoes"
        :visible-columns="allColumns"
        :column-titles="columnTitles"
        :responsive-column-widths="baseColumnWidths"
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
      :previsto-total="totalGeralPrevisto"
      :total-dias-com-previsao="totalDiasComPrevisao"
      :total-vendas-previstas="totalVendasPrevistas"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
  previsoesDiarias,
  totalGeralPrevisto,
  totalDiasComPrevisao,
  totalVendasPrevistas,
  calcularPrevisoesDiarias,
  formatCurrency
} = useBancosPrevisao()

// Estados locais
const draggedColumn = ref(null)
const columnOrder = ref([])

// Colunas
const allColumns = ref([
  'empresa',
  'banco',
  'agencia',
  'conta',
  'dataMovimentacao',
  'tipoOperacao',
  'numeroDocumento',
  'historico',
  'valorCredito',
  'valorDebito',
  'previsto',
  'saldoAnterior',
  'saldoAtual'
])

// Títulos das colunas
const columnTitles = {
  empresa: 'Empresa',
  banco: 'Banco',
  agencia: 'Agência',
  conta: 'Conta',
  dataMovimentacao: 'Data',
  tipoOperacao: 'Tipo',
  numeroDocumento: 'Documento',
  historico: 'Histórico',
  valorCredito: 'Crédito',
  valorDebito: 'Débito',
  previsto: 'Previsto',
  saldoAnterior: 'Saldo Anterior',
  saldoAtual: 'Saldo Atual'
}

// Larguras das colunas
const baseColumnWidths = ref({
  empresa: 150,
  banco: 120,
  agencia: 100,
  conta: 120,
  dataMovimentacao: 120,
  tipoOperacao: 100,
  numeroDocumento: 120,
  historico: 200,
  valorCredito: 120,
  valorDebito: 120,
  previsto: 120,
  saldoAnterior: 120,
  saldoAtual: 120
})

// Função para recarregar todos os dados
const recarregarDados = async () => {
  try {
    await Promise.all([
      fetchMovimentacoes(),
      calcularPrevisoesDiarias()
    ])
  } catch (err) {
    console.error('Erro ao recarregar dados:', err)
    error.value = err.message || 'Erro ao carregar dados'
  }
}

// Handlers de paginação
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

// Watchers e lifecycle
watch(empresaSelecionada, async (novaEmpresa) => {
  if (novaEmpresa) {
    console.log('🏢 Empresa alterada, recarregando dados bancários e previsões:', novaEmpresa)
    await recarregarDados()
  }
}, { immediate: true })

onMounted(async () => {
  console.log('🚀 Componente bancos montado, carregando dados...')
  await recarregarDados()
})
</script>