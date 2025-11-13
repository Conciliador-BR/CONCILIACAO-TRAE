<template>
  <div class="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
    <!-- Header decorativo -->
    <div class="bg-gradient-to-r from-slate-50 via-gray-100 to-slate-50 border-b border-gray-200/50 px-8 py-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Gestão de Vendas</h2>
            <p class="text-sm text-gray-600">Controle completo das transações</p>
          </div>
        </div>
        
        <!-- Status Bar -->
        <VendasStatusBar 
          :screen-size="screenSize" 
          :window-width="windowWidth" 
          :visible-columns="allColumns.length" 
          :total-columns="allColumns.length" 
        />
      </div>
    </div>
    
    <!-- Estados de carregamento e erro -->
    <div v-if="loading" class="px-8 py-16 text-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
        <svg class="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </div>
      <p class="text-gray-700 font-semibold text-lg mb-2">Carregando vendas...</p>
      <p class="text-sm text-gray-600">Aguarde enquanto processamos os dados</p>
    </div>
    
    <div v-else-if="error" class="px-8 py-16 text-center bg-gradient-to-br from-red-50/50 to-rose-50/50">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 shadow-lg">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <p class="text-red-700 font-semibold text-lg mb-2">Erro ao carregar vendas</p>
      <p class="text-sm text-gray-600 mb-6">{{ error }}</p>
      <button @click="fetchVendas" class="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
        Tentar novamente
      </button>
    </div>
    
    <!-- Tabela de vendas -->
    <div v-else class="overflow-hidden bg-white/50 backdrop-blur-sm">
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
    <div class="bg-gradient-to-r from-slate-50 via-gray-100 to-slate-50 border-t border-gray-200/50">
      <VendasFooter 
        :total-registros="vendas.length"
        :total-bruto="vendaBrutaTotal"
        :total-liquido="vendaLiquidaTotal"
      />
    </div>
    
    <!-- Decorative footer -->
    <div class="h-2 bg-gradient-to-r from-slate-600 via-gray-700 to-slate-600"></div>
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
  'previsaoPgto',
  'auditoria'
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
  previsaoPgto: 'PREVISAO PGTO',
  auditoria: 'AUDITORIA'
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
  previsaoPgto: 130,
  auditoria: 120
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
