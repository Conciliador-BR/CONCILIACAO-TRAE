<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-200">
    <TaxasHeader @adicionar-taxa="adicionarTaxa" />
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
      @update-taxa="updateTaxa"
      @remover-taxa="removerTaxa"
    />
    <TaxasFooter 
      :total-taxas="taxas.length"
      :taxa-media="taxaMedia"
    />
  </div>
</template>

<script setup>
// Importar componentes filhos
import TaxasHeader from './TaxasHeader.vue'
import TaxasStatusBar from './TaxasStatusBar.vue'
import TaxasTable from './TaxasTable.vue'
import TaxasFooter from './TaxasFooter.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  empresaSelecionada: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

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
const allColumns = ['empresa', 'adquirente', 'bandeira', 'modalidade', 'parcelas', 'taxa', 'dataCorte']

// Colunas visíveis baseadas na resolução
const visibleColumns = computed(() => getVisibleTaxasColumns(allColumns))

// Títulos das colunas
const columnTitles = {
  empresa: 'Nome Empresa',
  adquirente: 'Adquirente',
  bandeira: 'Bandeira',
  modalidade: 'Modalidade',
  parcelas: 'Parcelas',
  taxa: 'Taxa (%)',
  dataCorte: 'Data de Corte'
}

// Larguras base das colunas
const baseColumnWidths = {
  empresa: 200,
  adquirente: 150,
  bandeira: 130,
  modalidade: 160,
  parcelas: 100,
  taxa: 120,
  dataCorte: 150,
  acoes: 80
}

// Larguras responsivas das colunas
const responsiveColumnWidths = computed(() => 
  getResponsiveColumnWidths(baseColumnWidths, 'taxas')
)

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
  salvarTaxas()
}

const removerTaxa = (index) => {
  taxas.value.splice(index, 1)
  salvarTaxas()
}

const adicionarTaxa = () => {
  const novaTaxa = {
    id: Date.now(),
    empresa: props.empresaSelecionada || '',
    adquirente: '',
    bandeira: '',
    modalidade: '',
    parcelas: 1,
    percentualTaxa: 0,
    dataCorte: 1
  }
  taxas.value.push(novaTaxa)
  salvarTaxas()
}

const salvarTaxas = () => {
  localStorage.setItem('taxas-conciliacao', JSON.stringify(taxas.value))
  emit('update:modelValue', taxas.value)
}

// Watch para sincronizar com props
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.length > 0) {
    taxas.value = [...newValue]
  }
}, { deep: true })

// Watch para emitir mudanças
watch(taxas, () => {
  emit('update:modelValue', taxas.value)
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
    Object.assign(baseColumnWidths, JSON.parse(largurasSalvas))
  }
})
</script>