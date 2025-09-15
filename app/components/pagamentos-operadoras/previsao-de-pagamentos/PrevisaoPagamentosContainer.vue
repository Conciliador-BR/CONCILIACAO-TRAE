<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <PrevisaoPagamentosHeader 
      @dados-atualizados="handleDadosAtualizados"
      @erro-atualizacao="handleErroAtualizacao"
    />

    <!-- Status Bar -->
    <PrevisaoPagamentosStatusBar 
      :screen-size="screenSize"
      :window-width="windowWidth"
      :visible-columns="allColumns.length"
      :total-columns="allColumns.length"
    />

    <!-- Loading -->
    <div v-if="loading" class="p-8 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Carregando previsões do Supabase...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-8 text-center text-red-600">
      <p>Erro: {{ error }}</p>
      <button @click="fetchPrevisoes" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Tentar Novamente
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!previsoes || previsoes.length === 0" class="p-8 text-center text-gray-500">
      <p>Nenhuma venda encontrada para calcular previsões.</p>
      <button @click="fetchPrevisoes" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Recarregar
      </button>
    </div>

    <!-- Table -->
    <PrevisaoPagamentosTable v-else
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

    <!-- Footer -->
    <PrevisaoPagamentosFooter 
      :total-vendas="previsoes.length"
      :venda-bruta-total="vendaBrutaTotal"
      :venda-liquida-total="vendaLiquidaTotal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useEmpresas } from '~/composables/useEmpresas'
import { usePrevisaoSupabase } from '~/composables/PagePagamentos/usePrevisaoSupabase'

// Componentes
import PrevisaoPagamentosHeader from './PrevisaoPagamentosHeader.vue'
import PrevisaoPagamentosStatusBar from './PrevisaoPagamentosStatusBar.vue'
import PrevisaoPagamentosTable from './PrevisaoPagamentosTable.vue'
import PrevisaoPagamentosFooter from './PrevisaoPagamentosFooter.vue'

// Estados
const draggedColumn = ref(null)
const columnOrder = ref([])

// Composables
const { empresaSelecionada } = useEmpresas()
const { screenSize, windowWidth } = useResponsiveColumns()
const {
  loading,
  error,
  previsoes,
  vendaBrutaTotal,
  vendaLiquidaTotal,
  fetchPrevisoes
} = usePrevisaoSupabase()

// Colunas
const allColumns = ref([
  'empresa',
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
    console.log('🏢 Empresa alterada, recarregando previsões:', novaEmpresa)
    await fetchPrevisoes()
  }
}, { immediate: true })

onMounted(async () => {
  console.log('🚀 Componente montado, carregando previsões...')
  await fetchPrevisoes()
})
</script>