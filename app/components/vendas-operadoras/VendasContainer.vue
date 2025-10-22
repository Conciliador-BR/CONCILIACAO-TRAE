<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <!-- Status Bar -->
    <VendasStatusBar 
      :screen-size="screenSize" 
      :window-width="windowWidth" 
      :visible-columns="allColumns.length" 
      :total-columns="allColumns.length" 
    />
    
    <!-- Estados de carregamento e erro -->
    <div v-if="loading" class="px-8 py-12 text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
        <svg class="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </div>
      <p class="text-gray-600 font-medium">Carregando vendas...</p>
      <p class="text-sm text-gray-500 mt-1">Aguarde enquanto processamos os dados</p>
    </div>
    
    <div v-else-if="error" class="px-8 py-12 text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <p class="text-red-600 font-medium mb-2">Erro ao carregar vendas</p>
      <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
      <button @click="fetchVendas" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
        Tentar novamente
      </button>
    </div>
    
    <!-- Tabela de vendas -->
    <div v-else class="overflow-hidden">
      <VendasTable 
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
        @atualizar-vendas="handleDadosAtualizados"
        @erro-atualizacao="handleErroAtualizacao"
      />
    </div>
    
    <!-- Footer -->
    <VendasFooter 
      :total-registros="vendas.length"
      :total-bruto="vendaBrutaTotal"
      :total-liquido="vendaLiquidaTotal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useVendas } from '~/composables/useVendas'
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

// Importar componentes filhos
import VendasHeader from './VendasHeader.vue'
import VendasStatusBar from './VendasStatusBar.vue'
import VendasTable from './VendasTable.vue'
import VendasFooter from './VendasFooter.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// Usar composables
const {
  screenSize,
  windowWidth,
  initializeResponsive
} = useResponsiveColumns()

const {
  vendas,
  loading,
  error,
  fetchVendas,
  aplicarFiltros,
  updateVenda,
  deleteVenda,
  vendaBrutaTotal,
  vendaLiquidaTotal
} = useVendas()

const { fetchEmpresas } = useEmpresas()
const { filtrosGlobais } = useGlobalFilters()

// Todas as colunas disponíveis (base)
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
  'valorLiquidoAntec',
  'previsaoPgto'  // ✅ Nova coluna adicionada
])

// Computed para controlar colunas visíveis - sempre mostrar todas as colunas incluindo matriz
const allColumns = computed(() => {
  // Sempre mostrar todas as colunas, incluindo empresa e matriz
  return [...baseColumns.value]
})

// Ordem das colunas (para drag and drop)
const columnOrder = computed(() => {
  if (!process.client) return [...allColumns.value]
  
  const savedOrder = localStorage.getItem('vendas-column-order')
  if (savedOrder) {
    const parsed = JSON.parse(savedOrder)
    return parsed.filter(col => allColumns.value.includes(col))
  }
  return [...allColumns.value]
})

// Títulos das colunas
const columnTitles = {
  dataVenda: 'Data Venda',
  modalidade: 'Modalidade',
  nsu: 'NSU',
  vendaBruta: 'Venda Bruta',
  vendaLiquida: 'Venda Líquida',
  taxaMdr: 'Taxa MDR',
  despesaMdr: 'Despesa MDR',
  numeroParcelas: 'Número Parcelas',
  bandeira: 'Bandeira',
  valorAntecipado: 'Valor Antecipado',
  despesasAntecipacao: 'Despesas Antecipação',
  valorLiquidoAntec: 'Valor Líquido Antec.',
  empresa: 'Empresa',
  matriz: 'Matriz',
  adquirente: 'Adquirente',
  previsaoPgto: 'PREVISAO PGTO'  // ✅ Título da nova coluna
}

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
  adquirente: 120,
  previsaoPgto: 130  // ✅ Largura da nova coluna
})

// Estados para drag and drop
const draggedColumn = ref('')
const draggedIndex = ref(-1)

// Handlers para eventos
const handleUpdateVenda = async (index, column, value) => {
  const venda = vendas.value[index]
  const updatedVenda = { ...venda, [column]: value }
  
  try {
    await updateVenda(venda.id, updatedVenda)
  } catch (err) {
    console.error('Erro ao atualizar venda:', err)
  }
}

const handleRemoverVenda = async (index) => {
  const venda = vendas.value[index]
  
  try {
    await deleteVenda(venda.id)
  } catch (err) {
    console.error('Erro ao remover venda:', err)
  }
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
    const newColumnOrder = [...columnOrder.value]
    const draggedItem = newColumnOrder.splice(draggedIndex.value, 1)[0]
    newColumnOrder.splice(targetIndex, 0, draggedItem)
    
    allColumns.value.splice(0, allColumns.value.length, ...newColumnOrder)
    
    // Função para salvar ordem das colunas
    const saveColumnOrder = (newColumnOrder) => {
      if (process.client) {
        localStorage.setItem('vendas-column-order', JSON.stringify(newColumnOrder))
      }
    }
    
    saveColumnOrder(newColumnOrder)
  }
}

const onDragEnd = () => {
  draggedColumn.value = ''
  draggedIndex.value = -1
}

const startResize = (event, column) => {
  event.preventDefault()
  event.stopPropagation()
  
  const startX = event.clientX
  const startWidth = baseColumnWidths.value[column]
  
  const handleMouseMove = (e) => {
    const deltaX = e.clientX - startX
    const newWidth = Math.max(50, startWidth + deltaX) // Largura mínima de 50px
    baseColumnWidths.value[column] = newWidth
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
    
    // Salvar larguras no localStorage
    const saveColumnWidths = () => {
      if (process.client) {
        localStorage.setItem('vendas-column-widths', JSON.stringify(baseColumnWidths.value))
      }
    }
    
    saveColumnWidths()
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

// Função para carregar larguras das colunas do localStorage
const loadColumnWidths = () => {
  if (!process.client) return
  
  const savedWidths = localStorage.getItem('vendas-column-widths')
  if (savedWidths) {
    try {
      const parsed = JSON.parse(savedWidths)
      Object.assign(baseColumnWidths.value, parsed)
    } catch (error) {
      console.warn('Erro ao carregar larguras das colunas:', error)
    }
  }
}

// Método para aplicar filtro externamente
const aplicarFiltroExterno = (filtros) => {
  aplicarFiltros(filtros)
}

// Handlers para os eventos do botão atualizar
const handleDadosAtualizados = () => {
  console.log('Vendas atualizadas com sucesso!')
  // Aqui você pode adicionar notificações ou outras ações
}

const handleErroAtualizacao = (erro) => {
  console.error('Erro ao atualizar vendas:', erro)
  // Aqui você pode adicionar tratamento de erro ou notificações
}

// Watch para emitir mudanças
watch(vendas, () => {
  emit('update:modelValue', vendas.value)
}, { deep: true })

// Carregar dados ao montar
onMounted(async () => {
  initializeResponsive()
  
  // Carregar empresas e vendas
  await Promise.all([
    fetchEmpresas(),
    fetchVendas()
  ])
  
  // Carregar larguras das colunas
  loadColumnWidths()
})

// Expor método para componente pai
defineExpose({
  aplicarFiltroExterno
})
</script>