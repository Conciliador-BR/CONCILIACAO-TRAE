<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-200">
    <VendasHeader />
    <VendasStatusBar 
      :screen-size="screenSize" 
      :window-width="windowWidth" 
      :visible-columns="allColumns.length" 
      :total-columns="allColumns.length" 
    />
    <div v-if="loading" class="p-6 text-center">
      <p class="text-gray-500">Carregando vendas...</p>
    </div>
    <div v-else-if="error" class="p-6 text-center">
      <p class="text-red-500">Erro ao carregar vendas: {{ error }}</p>
      <button @click="fetchVendas" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Tentar novamente
      </button>
    </div>
    <VendasTable 
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
    <VendasFooter 
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
  // REMOVIDO: empresaSelecionada e filtroData props
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

// REMOVER A SEGUNDA DECLARAÇÃO DUPLICADA!

// Todas as colunas disponíveis
const allColumns = ref([
  'empresa',
  'matriz', 
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

// Ordem das colunas (para drag and drop)
const columnOrder = computed(() => {
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
  matriz: 'Matriz'
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
  acoes: 80
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
    
    localStorage.setItem('vendas-column-order', JSON.stringify(newColumnOrder))
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
    localStorage.setItem('vendas-column-widths', JSON.stringify(baseColumnWidths.value))
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

// Watch para emitir mudanças
watch(vendas, () => {
  emit('update:modelValue', vendas.value)
}, { deep: true })

// ✅ ADICIONAR O COMPOSABLE useEmpresas:
const { fetchEmpresas } = useEmpresas()

// Carregar dados ao montar
onMounted(async () => {
  initializeResponsive()
  
  // Carregar empresas e vendas
  await Promise.all([
    fetchEmpresas(),
    fetchVendas()
  ])
  
  // Carregar larguras das colunas do localStorage
  const savedWidths = localStorage.getItem('vendas-column-widths')
  if (savedWidths) {
    try {
      const parsedWidths = JSON.parse(savedWidths)
      Object.assign(baseColumnWidths.value, parsedWidths)
    } catch (error) {
      console.warn('Erro ao carregar larguras das colunas:', error)
    }
  }
})

// Watch para aplicar filtros quando props mudarem
watch([() => props.empresaSelecionada, () => props.filtroData], () => {
  aplicarFiltros({
    empresa: props.empresaSelecionada,
    dataInicial: props.filtroData.dataInicial,
    dataFinal: props.filtroData.dataFinal
  })
}, { deep: true })

// REMOVIDO: Watch automático para filtros
// O filtro agora só será aplicado quando o botão for clicado

// Método para aplicar filtro externamente
const aplicarFiltroExterno = (filtros) => {
  aplicarFiltros(filtros)
}

// Expor método para componente pai
defineExpose({
  aplicarFiltroExterno
})
</script>