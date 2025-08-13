<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-200">
    <!-- Toolbar -->
    <VendasToolbar 
      @adicionar-venda="adicionarLinha"
    />
    
    <!-- Indicador de Resolução -->
    <div class="px-4 py-2 bg-gray-50 border-b text-xs text-gray-600 flex justify-between items-center">
      <span>Resolução: {{ screenSize.toUpperCase() }} ({{ windowWidth }}px)</span>
      <span>Colunas visíveis: {{ visibleColumns.length }}/{{ allColumns.length }}</span>
    </div>
    
    <!-- Container da Tabela com Scroll Horizontal e Vertical -->
    <div class="overflow-auto max-h-96 max-w-full" style="scrollbar-width: thin;">
      <div class="min-w-full">
        <table class="w-full table-auto" ref="table">
          <colgroup>
            <col v-for="column in visibleColumns" :key="column" :style="{ minWidth: responsiveColumnWidths[column] + 'px' }">
            <col :style="{ minWidth: responsiveColumnWidths.acoes + 'px' }">
          </colgroup>
          
          <!-- Header -->
          <VendasTableHeader
            :column-order="visibleColumns"
            :column-titles="columnTitles"
            :dragged-column="draggedColumn"
            @drag-start="onDragStart"
            @drag-over="onDragOver"
            @drag-drop="onDrop"
            @drag-end="onDragEnd"
            @start-resize="startResize"
          />
          
          <!-- Body -->
          <tbody class="bg-white divide-y divide-gray-200">
            <VendasTableRow
              v-for="(venda, index) in vendas"
              :key="index"
              :venda="venda"
              :index="index"
              :column-order="visibleColumns"
              @update-venda="updateVenda"
              @remover-linha="removerLinha"
            />
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Footer -->
    <VendasFooter
      :total-registros="vendas.length"
      :total-bruto="totalBruto"
      :total-liquido="totalLiquido"
    />
  </div>
</template>

<script setup>
import VendasToolbar from './VendasToolbar.vue'
import VendasTableHeader from './VendasTableHeader.vue'
import VendasTableRow from './VendasTableRow.vue'
import VendasFooter from './VendasFooter.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  empresaSelecionada: {
    type: String,
    default: ''
  },
  filtroData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'vendas-changed'])

// Usar composable responsivo
const {
  screenSize,
  windowWidth,
  getVisibleVendasColumns,
  getResponsiveColumnWidths,
  initializeResponsive
} = useResponsiveColumns()

// Estados reativos
const vendas = ref(props.modelValue.length > 0 ? props.modelValue : [
  {
    id: 1,
    empresa: 'UNIMED SUPERMERCADOS LTDA',
    adquirente: 'Cielo',
    bandeira: 'Visa',
    modalidade: 'Débito',
    parcelas: 1,
    dataVenda: '2025-01-07',
    cancelamento: '',
    previsaoPagamento: '',
    vendaBruto: 45.67,
    taxaMdr: 5.64,
    valorTaxa: 2.57,
    vendaLiquido: 43.10,
    nsu: '123456789'
  }
])

// Todas as colunas disponíveis
const allColumns = [
  'empresa',
  'adquirente', 
  'bandeira',
  'modalidade',
  'parcelas',
  'dataVenda',
  'cancelamento',
  'previsaoPagamento',
  'vendaBruto',
  'taxaMdr',
  'valorTaxa',
  'vendaLiquido',
  'nsu'
]

// Colunas visíveis baseadas na resolução
const visibleColumns = computed(() => getVisibleVendasColumns(allColumns))

// Títulos das colunas
const columnTitles = {
  empresa: 'Empresa',
  adquirente: 'Adquirente',
  bandeira: 'Bandeira',
  modalidade: 'Modalidade',
  parcelas: 'Parcelas',
  dataVenda: 'Data da Venda',
  cancelamento: 'Cancelamento',
  previsaoPagamento: 'Previsão Pagto',
  vendaBruto: 'Venda Bruto',
  taxaMdr: 'Taxa MDR',
  valorTaxa: 'Valor Taxa',
  vendaLiquido: 'Venda Líquido',
  nsu: 'NSU'
}

// Larguras base das colunas
const baseColumnWidths = {
  empresa: 200,
  adquirente: 150,
  bandeira: 130,
  modalidade: 130,
  parcelas: 100,
  dataVenda: 150,
  cancelamento: 150,
  previsaoPagamento: 150,
  vendaBruto: 120,
  taxaMdr: 100,
  valorTaxa: 120,
  vendaLiquido: 120,
  nsu: 120,
  acoes: 80
}

// Larguras responsivas das colunas
const responsiveColumnWidths = computed(() => 
  getResponsiveColumnWidths(baseColumnWidths, 'vendas')
)

// Variáveis para redimensionamento
const isResizing = ref(false)
const currentColumn = ref('')
const startX = ref(0)
const startWidth = ref(0)

// Variáveis para drag and drop de colunas
const draggedColumn = ref('')
const draggedIndex = ref(-1)

// Totais computados
const totalBruto = computed(() => {
  return vendas.value.reduce((total, venda) => total + (venda.vendaBruto || 0), 0)
})

const totalLiquido = computed(() => {
  return vendas.value.reduce((total, venda) => total + (venda.vendaLiquido || 0), 0)
})

// Importar composables
const { getEmpresas } = useEmpresas()
const { getAdquirentes, getBandeiras, getModalidades } = useConfigCartoes()

// Obter dados dos composables
const empresas = getEmpresas()
const adquirentes = getAdquirentes()
const bandeiras = getBandeiras()
const modalidades = getModalidades()

// Funções utilitárias
const adicionarDiasUteis = (dataInicial, diasUteis) => {
  const data = new Date(dataInicial)
  let diasAdicionados = 0
  
  while (diasAdicionados < diasUteis) {
    data.setDate(data.getDate() + 1)
    const diaSemana = data.getDay()
    
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAdicionados++
    }
  }
  
  return data.toISOString().split('T')[0]
}

const calcularPrevisaoPagamento = (venda) => {
  if (!venda.dataVenda || !venda.adquirente || !venda.bandeira || !venda.modalidade || !venda.parcelas) {
    return ''
  }
  
  const taxasSalvas = localStorage.getItem('taxas-conciliacao')
  if (!taxasSalvas) {
    return ''
  }
  
  const taxas = JSON.parse(taxasSalvas)
  
  const taxaCorrespondente = taxas.find(taxa => 
    taxa.adquirente === venda.adquirente &&
    taxa.bandeira === venda.bandeira &&
    taxa.modalidade === venda.modalidade &&
    taxa.parcelas === venda.parcelas
  )
  
  if (!taxaCorrespondente || !taxaCorrespondente.dataCorte) {
    return ''
  }
  
  const dataVenda = venda.dataVenda
  const diasParaPagamento = taxaCorrespondente.dataCorte
  
  return adicionarDiasUteis(dataVenda, diasParaPagamento)
}

const atualizarPrevisaoPagamento = (venda) => {
  const previsaoCalculada = calcularPrevisaoPagamento(venda)
  if (previsaoCalculada) {
    venda.previsaoPagamento = previsaoCalculada
  }
}

const calcularValores = (venda) => {
  if (venda.vendaBruto && venda.taxaMdr) {
    venda.valorTaxa = (venda.vendaBruto * venda.taxaMdr) / 100
    venda.vendaLiquido = venda.vendaBruto - venda.valorTaxa
  }
  
  atualizarPrevisaoPagamento(venda)
}

const adicionarLinha = () => {
  const novaVenda = {
    id: Date.now(),
    empresa: props.empresaSelecionada || (empresas[0]?.nome || ''),
    adquirente: adquirentes[0] || '',
    bandeira: bandeiras[0] || '',
    modalidade: modalidades[0] || '',
    parcelas: 1,
    dataVenda: new Date().toISOString().split('T')[0],
    cancelamento: '',
    previsaoPagamento: '',
    vendaBruto: 0,
    taxaMdr: 0,
    valorTaxa: 0,
    vendaLiquido: 0,
    nsu: ''
  }
  vendas.value.push(novaVenda)
  salvarDados()
}

const removerLinha = (index) => {
  vendas.value.splice(index, 1)
  salvarDados()
}

const salvarDados = () => {
  localStorage.setItem('vendas-conciliacao', JSON.stringify(vendas.value))
  emit('update:modelValue', vendas.value)
  emit('vendas-changed', vendas.value)
}

// Handler para atualização de vendas
const handleUpdateVenda = (vendaAtualizada, eventType, column) => {
  const index = vendas.value.findIndex(v => v.id === vendaAtualizada.id)
  if (index !== -1) {
    vendas.value[index] = vendaAtualizada
    
    // Aplicar lógica específica baseada no tipo de evento e coluna
    if (eventType === 'change') {
      if (['adquirente', 'bandeira', 'modalidade', 'parcelas', 'dataVenda'].includes(column)) {
        atualizarPrevisaoPagamento(vendaAtualizada)
      }
    } else if (eventType === 'blur') {
      if (['vendaBruto', 'taxaMdr'].includes(column)) {
        calcularValores(vendaAtualizada)
      } else if (['adquirente', 'bandeira', 'modalidade', 'parcelas', 'dataVenda'].includes(column)) {
        atualizarPrevisaoPagamento(vendaAtualizada)
      }
    }
    
    salvarDados()
  }
}

// Funções de redimensionamento
const startResize = (event, column) => {
  event.preventDefault()
  event.stopPropagation()
  isResizing.value = true
  currentColumn.value = column
  startX.value = event.clientX
  startWidth.value = responsiveColumnWidths.value[column]
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const onResize = (event) => {
  if (!isResizing.value) return
  
  const diff = event.clientX - startX.value
  const newWidth = Math.max(80, startWidth.value + diff)
  
  baseColumnWidths[currentColumn.value] = newWidth
}

const stopResize = () => {
  isResizing.value = false
  currentColumn.value = ''
  
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  localStorage.setItem('column-widths', JSON.stringify(baseColumnWidths))
}

// Funções de drag and drop para reordenar colunas
const onDragStart = (event, column, index) => {
  if (isResizing.value) {
    event.preventDefault()
    return
  }
  
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
    const newColumnOrder = [...allColumns]
    const draggedItem = newColumnOrder.splice(draggedIndex.value, 1)[0]
    newColumnOrder.splice(targetIndex, 0, draggedItem)
    
    allColumns.splice(0, allColumns.length, ...newColumnOrder)
    
    localStorage.setItem('column-order', JSON.stringify(allColumns))
  }
}

const onDragEnd = () => {
  draggedColumn.value = ''
  draggedIndex.value = -1
}

// Watchers para props
watch(() => props.empresaSelecionada, (novaEmpresa) => {
  vendas.value.forEach(venda => {
    if (novaEmpresa) {
      venda.empresa = novaEmpresa
    }
  })
  salvarDados()
})

watch(() => props.filtroData, (novoFiltro) => {
  if (novoFiltro?.dataInicial) {
    vendas.value.forEach(venda => {
      if (!venda.dataVenda) {
        venda.dataVenda = novoFiltro.dataInicial
        atualizarPrevisaoPagamento(venda)
      }
    })
    salvarDados()
  }
}, { deep: true })

// Carregar dados salvos
onMounted(() => {
  initializeResponsive()
  
  const dadosSalvos = localStorage.getItem('vendas-conciliacao')
  if (dadosSalvos) {
    const vendasSalvas = JSON.parse(dadosSalvos)
    vendas.value = vendasSalvas.map(venda => ({
      ...venda,
      dataVenda: venda.dataVenda || ''
    }))
    
    vendas.value.forEach(venda => {
      atualizarPrevisaoPagamento(venda)
    })
  }
  
  const largurasSalvas = localStorage.getItem('column-widths')
  if (largurasSalvas) {
    Object.assign(baseColumnWidths, JSON.parse(largurasSalvas))
  }
  
  const ordemSalva = localStorage.getItem('column-order')
  if (ordemSalva) {
    const ordemSalvaArray = JSON.parse(ordemSalva)
    allColumns.splice(0, allColumns.length, ...ordemSalvaArray)
  }
})

// Listener para mudanças no localStorage das taxas
if (process.client) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'taxas-conciliacao') {
      vendas.value.forEach(venda => {
        atualizarPrevisaoPagamento(venda)
      })
      salvarDados()
    }
  })
}

watch(vendas, () => {
  emit('vendas-changed', vendas.value)
}, { deep: true })
</script>

<style scoped>
/* Estilizar barras de rolagem */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>