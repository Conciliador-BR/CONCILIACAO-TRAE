<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-200">
    <PrevisaoPagamentosHeader 
      @dados-atualizados="handleDadosAtualizados"
      @erro-atualizacao="handleErroAtualizacao"
    />
    <PrevisaoPagamentosStatusBar 
      :screen-size="screenSize" 
      :window-width="windowWidth" 
      :visible-columns="allColumns.length" 
      :total-columns="allColumns.length" 
    />
    <div v-if="loading" class="p-6 text-center">
      <p class="text-gray-500">Carregando previsões...</p>
    </div>
    <div v-else-if="error" class="p-6 text-center">
      <p class="text-red-500">Erro ao carregar previsões: {{ error }}</p>
      <button @click="fetchVendas" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Tentar novamente
      </button>
    </div>
    <PrevisaoPagamentosTable 
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
    <PrevisaoPagamentosFooter 
      :total-vendas="vendas.length"
      :venda-bruta-total="vendaBrutaTotal"
      :venda-liquida-total="vendaLiquidaTotal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useVendas } from '~/composables/useVendas'
import { useEmpresas } from '~/composables/useEmpresas'

// Componentes específicos de previsão
import PrevisaoPagamentosHeader from './PrevisaoPagamentosHeader.vue'
import PrevisaoPagamentosStatusBar from './PrevisaoPagamentosStatusBar.vue'
import PrevisaoPagamentosTable from './PrevisaoPagamentosTable.vue'
import PrevisaoPagamentosFooter from './PrevisaoPagamentosFooter.vue'

// Props
const props = defineProps({
  vendas: {
    type: Array,
    default: () => []
  }
})

// Estados
const loading = ref(false)
const error = ref(null)
const draggedColumn = ref(null)
const columnOrder = ref([])

// Usar composables
const { empresaSelecionada } = useEmpresas()
const {
  screenSize,
  windowWidth
} = useResponsiveColumns()

const { vendaBrutaTotal, vendaLiquidaTotal, fetchVendas } = useVendas()

// Definir colunas específicas para previsão de pagamentos
const allColumns = ref([
  'dataVenda',
  'modalidade', 
  'nsu',
  'vendaBruta',
  'vendaLiquida',
  'taxaMdr',
  'despesaMdr',
  'numeroParcelas',
  'bandeira',
  'empresa'
])

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
  empresa: 'Empresa'
})

// Larguras base das colunas
const baseColumnWidths = ref({
  dataVenda: '120px',
  modalidade: '100px',
  nsu: '100px',
  vendaBruta: '120px',
  vendaLiquida: '120px',
  taxaMdr: '100px',
  despesaMdr: '120px',
  numeroParcelas: '100px',
  bandeira: '100px',
  empresa: '150px'
})

// Handlers
const handleDadosAtualizados = () => {
  // Lógica para atualizar dados
}

const handleErroAtualizacao = (erro) => {
  error.value = erro
}

const handleRemoverVenda = (vendaId) => {
  // Lógica para remover venda
}

// Drag and drop handlers
const onDragStart = (event, column, index) => {
  draggedColumn.value = { column, index }
}

const onDragOver = (event) => {
  event.preventDefault()
}

const onDrop = (event, targetIndex) => {
  // Lógica de drop
}

const onDragEnd = () => {
  draggedColumn.value = null
}

const startResize = (event, column) => {
  // Lógica de redimensionamento
}
</script>