<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-200">
    <!-- Mensagem de sucesso -->
    <div v-if="mensagemSucesso" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <strong>✅ Sucesso!</strong> {{ mensagemSucesso }}
    </div>
    
    <!-- Mensagem de erro -->
    <div v-if="erroSupabase" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      <strong>❌ Erro!</strong> Falha ao enviar para o Supabase: {{ erroSupabase }}
    </div>
    
    <!-- Loading indicator -->
    <div v-if="salvandoTaxas" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
      <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <strong>🔄 Enviando...</strong> Salvando taxas no Supabase...
    </div>

    <!-- Mensagem de status detalhado -->
    <div v-if="ultimoResultado" class="px-4 py-3 rounded mb-4" :class="ultimoResultado.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'">
      <div class="flex items-center mb-2">
        <span v-if="ultimoResultado.ok" class="text-green-600">✅</span>
        <span v-else class="text-yellow-600">⚠️</span>
        <strong class="ml-2">Resultado do Envio:</strong>
      </div>
      <div class="text-sm">
        <p><strong>Processadas:</strong> {{ ultimoResultado.processadas }}</p>
        <p><strong>Sucesso:</strong> {{ ultimoResultado.sucesso }}</p>
        <p><strong>Falhas:</strong> {{ ultimoResultado.falha }}</p>
        <div v-if="ultimoResultado.erros && ultimoResultado.erros.length > 0" class="mt-2">
          <p><strong>Erros:</strong></p>
          <ul class="list-disc list-inside text-xs">
            <li v-for="(erro, index) in ultimoResultado.erros.slice(0, 3)" :key="index">{{ erro }}</li>
            <li v-if="ultimoResultado.erros.length > 3" class="text-gray-600">... e mais {{ ultimoResultado.erros.length - 3 }} erros</li>
          </ul>
        </div>
      </div>
    </div>

    <TaxasHeader @adicionar-taxa="adicionarTaxa" @salvar="handleSalvar" />
    <TaxasStatusBar 
      :screen-size="screenSize" 
      :window-width="windowWidth" 
      :visible-columns="visibleColumns.length" 
      :total-columns="allColumns.length" 
    />
    <TaxasTable 
      :taxas="taxas"
      :visible-columns="visibleColumns"
      :column-titles="columnTitles"
      :responsive-column-widths="responsiveColumnWidths"
      :dragged-column="draggedColumn"
      :column-order="columnOrder"
      :empresas="empresas"
      :is-editing="isEditing"
      @update-taxa="updateTaxa"
      @remover-taxa="removerTaxa"
      @editar-taxa="handleEditar"
      @drag-start="onDragStart"
      @drag-over="onDragOver"
      @drag-drop="onDrop"
      @drag-end="onDragEnd"
      @start-resize="startResize"
    />
    <TaxasFooter 
      :total-taxas="taxas.length"
      :taxa-media="taxaMedia"
    />
  </div>
</template>

<script setup>
// Importar composables
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
// Remover a importação do useTaxas que contém a função obsoleta
// import { useTaxas } from '~/composables/useTaxas'
import { useTaxasSupabase } from '~/composables/PageTaxas/useTaxasSupabase'

// Importar componentes filhos
import TaxasHeader from './TaxasHeader.vue'
import TaxasStatusBar from './TaxasStatusBar.vue'
import TaxasTable from './TaxasTable.vue'
import TaxasFooter from './TaxasFooter.vue'
import BotaoSalvar from './BotaoSalvar.vue' // Importar o botão Salvar

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  empresaSelecionada: {
    type: String,
    default: ''
  },
  empresas: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// Usar o composable useTaxas
// Remover o uso do composable obsoleto
// const { saveTaxas } = useTaxas()

// Usar o novo composable do Supabase
const { 
  salvarTaxasNoSupabase, 
  loading: salvandoTaxas, 
  success: mensagemSucesso,
  error: erroSupabase,
  resumo
} = useTaxasSupabase()

// Estado para mostrar resultado detalhado
const ultimoResultado = ref(null)

// Estado para controle de edição
const isEditing = ref(-1) // -1: nenhuma linha editável, ou o índice da linha em edição

const handleSalvar = async () => {
  // Limpar resultado anterior
  ultimoResultado.value = null
  
  // Desabilitar edição após salvar
  isEditing.value = -1
  
  console.log('🚀 Iniciando envio das taxas para o Supabase...')
  
  // Salvar no Supabase
  const resultado = await salvarTaxasNoSupabase(taxas.value)
  
  // Armazenar resultado para exibição
  ultimoResultado.value = resultado
  
  if (resultado.ok) {
    console.log('✅ Taxas enviadas com sucesso para o Supabase!')
    console.log('📊 Estatísticas:', {
      processadas: resultado.processadas,
      sucesso: resultado.sucesso,
      falhas: resultado.falha
    })
    
    // Salvar também no localStorage para cache local
    localStorage.setItem('taxas-conciliacao', JSON.stringify(taxas.value))
    
    // Limpar mensagem após 5 segundos
    setTimeout(() => {
      ultimoResultado.value = null
    }, 5000)
  } else {
    console.error('❌ Erro ao enviar taxas para o Supabase:')
    console.error('📋 Detalhes do erro:', resultado)
    
    // Manter mensagem de erro por mais tempo
    setTimeout(() => {
      ultimoResultado.value = null
    }, 10000)
  }
}

const handleEditar = (index) => {
  isEditing.value = index // Libera apenas esta linha para edição
}

// Usar composable responsivo
const {
  screenSize,
  windowWidth,
  getVisibleTaxasColumns,
  getResponsiveColumnWidths,
  initializeResponsive
} = useResponsiveColumns()

const taxas = ref(props.modelValue.length > 0 ? [...props.modelValue] : [])

// Todas as colunas disponíveis
const allColumns = ref(['id', 'empresa', 'adquirente', 'bandeira', 'modalidade', 'parcelas', 'taxa', 'dataCorte'])

// Ordem das colunas (para drag and drop)
const columnOrder = computed(() => {
  const savedOrder = localStorage.getItem('taxas-column-order')
  if (savedOrder) {
    const parsed = JSON.parse(savedOrder)
    // Garantir que a coluna ID esteja sempre presente e seja a primeira
    let order = parsed.filter(col => allColumns.value.includes(col) && col !== 'id')
    order.unshift('id')
    return order
  }
  return [...allColumns.value]
})

// Colunas visíveis baseadas na resolução
const visibleColumns = computed(() => getVisibleTaxasColumns(columnOrder.value))

// Títulos das colunas
const columnTitles = {
  id: 'ID',
  empresa: 'Empresa',
  adquirente: 'Adquirente',
  bandeira: 'Bandeira',
  modalidade: 'Modalidade',
  parcelas: 'Parcelas',
  taxa: 'Taxa (%)',
  dataCorte: 'Data de Corte'
}

// Larguras base das colunas
const baseColumnWidths = ref({
  id: 60,
  empresa: 200,
  adquirente: 150,
  bandeira: 130,
  modalidade: 160,
  parcelas: 100,
  taxa: 120,
  dataCorte: 150,
  acoes: 80
})

// Larguras responsivas das colunas - CORRIGIDO
const responsiveColumnWidths = computed(() => {
  const responsive = getResponsiveColumnWidths(baseColumnWidths.value, 'taxas')
  // Aplicar larguras base se foram modificadas pelo redimensionamento
  Object.keys(baseColumnWidths.value).forEach(column => {
    if (baseColumnWidths.value[column] !== responsive[column]) {
      responsive[column] = baseColumnWidths.value[column]
    }
  })
  return responsive
})

// Variáveis para redimensionamento
const isResizing = ref(false)
const currentColumn = ref('')
const startX = ref(0)
const startWidth = ref(0)

// Variáveis para drag and drop de colunas
const draggedColumn = ref('')
const draggedIndex = ref(-1)

const taxaMedia = computed(() => {
  if (taxas.value.length === 0) return 0
  const soma = taxas.value.reduce((total, taxa) => total + (taxa.percentualTaxa || 0), 0)
  return soma / taxas.value.length
})

const updateTaxa = (index, column, value) => {
  const columnFieldMap = {
    empresa: 'empresa',
    adquirente: 'adquirente',
    bandeira: 'bandeira',
    modalidade: 'modalidade',
    parcelas: 'parcelas',
    taxa: 'percentualTaxa',
    dataCorte: 'dataCorte'
  }
  
  const field = columnFieldMap[column] || column
  if (['parcelas', 'percentualTaxa', 'dataCorte'].includes(field)) {
    taxas.value[index][field] = parseFloat(value) || 0
  } else {
    taxas.value[index][field] = value
  }
  salvarTaxas() // Usar a função local ao invés da obsoleta
}

const removerTaxa = (index) => {
  taxas.value.splice(index, 1)
  salvarTaxas() // Usar a função local ao invés da obsoleta
}

const adicionarTaxa = () => {
  // Gerar ID único baseado no timestamp e índice
  const novoId = `taxa_${Date.now()}_${taxas.value.length + 1}`
  
  const novaTaxa = {
    id: novoId, // Adicionar ID único
    empresa: props.empresaSelecionada || '',
    adquirente: '',
    bandeira: '',
    modalidade: '',
    parcelas: 1,
    percentualTaxa: 0,
    dataCorte: 1
  }
  taxas.value.push(novaTaxa)
  salvarTaxas() // Usar a função local ao invés da obsoleta
}

// Funções de redimensionamento - MELHORADAS
const startResize = (event, column) => {
  event.preventDefault()
  event.stopPropagation()
  
  // Verificar se a coluna existe
  if (!visibleColumns.value.includes(column)) {
    console.warn(`Coluna ${column} não está visível`)
    return
  }
  
  isResizing.value = true
  currentColumn.value = column
  startX.value = event.clientX
  startWidth.value = baseColumnWidths.value[column] || 150
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  
  console.log(`Iniciando redimensionamento da coluna: ${column}, largura inicial: ${startWidth.value}px`)
}

const onResize = (event) => {
  if (!isResizing.value || !currentColumn.value) return
  
  const diff = event.clientX - startX.value
  const newWidth = Math.max(80, startWidth.value + diff)
  
  // Atualizar diretamente o baseColumnWidths
  baseColumnWidths.value[currentColumn.value] = newWidth
  
  // Forçar reatividade
  baseColumnWidths.value = { ...baseColumnWidths.value }
}

const stopResize = () => {
  if (!isResizing.value) return
  
  console.log(`Finalizando redimensionamento da coluna: ${currentColumn.value}, nova largura: ${baseColumnWidths.value[currentColumn.value]}px`)
  
  isResizing.value = false
  currentColumn.value = ''
  
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // Salvar as larguras atualizadas
  localStorage.setItem('taxas-column-widths', JSON.stringify(baseColumnWidths.value))
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
    const newColumnOrder = [...columnOrder.value]
    const draggedItem = newColumnOrder.splice(draggedIndex.value, 1)[0]
    newColumnOrder.splice(targetIndex, 0, draggedItem)
    
    allColumns.value.splice(0, allColumns.value.length, ...newColumnOrder)
    
    localStorage.setItem('taxas-column-order', JSON.stringify(newColumnOrder))
  }
}

const onDragEnd = () => {
  draggedColumn.value = ''
  draggedIndex.value = -1
}

const salvarTaxas = () => {
  localStorage.setItem('taxas-conciliacao', JSON.stringify(taxas.value))
  emit('update:modelValue', taxas.value)
  saveTaxas(taxas.value) // <-- sincroniza o composable compartilhado
}

// Watch para sincronizar com props
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.length > 0) {
    taxas.value = [...newValue]
  }
}, { deep: true })

// Watch para emitir mudanças - corrigido para evitar loop infinito
watch(taxas, (newTaxas) => {
  // Evitar loop infinito
  if (JSON.stringify(newTaxas) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', newTaxas)
  }
}, { deep: true })

// Carregar dados salvos
onMounted(() => {
  initializeResponsive()
  
  if (props.modelValue.length === 0) {
    const taxasSalvas = localStorage.getItem('taxas-conciliacao')
    if (taxasSalvas) {
      const dadosSalvos = JSON.parse(taxasSalvas)
      taxas.value = dadosSalvos
      emit('update:modelValue', dadosSalvos)
    }
  } else {
    taxas.value = [...props.modelValue]
  }
  
  const largurasSalvas = localStorage.getItem('taxas-column-widths')
  if (largurasSalvas) {
    Object.assign(baseColumnWidths.value, JSON.parse(largurasSalvas))
  }
  
  const ordemSalva = localStorage.getItem('taxas-column-order')
  if (ordemSalva) {
    const parsed = JSON.parse(ordemSalva)
    allColumns.value.splice(0, allColumns.value.length, ...parsed.filter(col => allColumns.value.includes(col)))
  }
})
</script>