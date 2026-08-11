<template>
  <div class="overflow-hidden rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_20px_50px_rgba(16,42,67,0.10)]">
    <TaxasHeader
      :total-taxas="taxas.length"
      :empresa-label="empresaHeaderLabel"
      @adicionar-taxa="adicionarTaxa"
      @salvar="handleSalvar"
    />

    <div class="space-y-4 bg-gradient-to-b from-[#FBFDFF] via-white to-[#F7FAFC] px-3 sm:px-4 lg:px-5 py-4 sm:py-5">
      <!-- Mensagem de sucesso -->
      <div v-if="mensagemSucesso" class="flex items-center rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-sm">
        <svg class="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <strong>✅ Sucesso!</strong> {{ mensagemSucesso }}
      </div>
    
      <!-- Mensagem de erro -->
      <div v-if="erroSupabase" class="flex items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-sm">
        <svg class="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      <strong>❌ Erro!</strong> Falha ao enviar para o Supabase: {{ erroSupabase }}
      </div>
    
      <!-- Loading indicator -->
      <div v-if="salvandoTaxas" class="flex items-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 shadow-sm">
        <svg class="mr-2 w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <strong>🔄 Enviando...</strong> Salvando taxas no Supabase...
      </div>

      <!-- Mensagem de status detalhado -->
      <div v-if="ultimoResultado" class="rounded-2xl px-4 py-3 shadow-sm" :class="ultimoResultado.ok ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-yellow-200 bg-yellow-50 text-yellow-800'">
        <div class="mb-2 flex items-center">
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

      <div class="rounded-[24px] border border-[#DCE7F3] bg-white p-3 shadow-[0_10px_25px_rgba(16,42,67,0.06)]">
        <TaxasStatusBar
          :screen-size="screenSize"
          :window-width="windowWidth"
          :visible-columns="visibleColumns.length"
          :total-columns="allColumns.length"
        />
      </div>

      <div class="overflow-hidden rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_14px_30px_rgba(16,42,67,0.07)]">
        <TaxasTable
          :taxas="paginatedTaxas"
          :visible-columns="visibleColumns"
          :column-titles="columnTitles"
          :responsive-column-widths="responsiveColumnWidths"
          :dragged-column="draggedColumn"
          :column-order="columnOrder"
          :empresas="empresas"
          :is-editing="isEditing"
          :selected-empresa-nome="selectedEmpresaNome"
          :selected-empresa-ec="selectedEmpresaEC"
          :render-count="itemsPerPage"
          @update-taxa="updateTaxa"
          @remover-taxa="removerTaxa"
          @editar-taxa="handleEditar"
          @drag-start="onDragStart"
          @drag-over="onDragOver"
          @drag-drop="onDrop"
          @drag-end="onDragEnd"
          @start-resize="startResize"
        />
      </div>

      <div class="flex flex-col gap-3 rounded-[24px] border border-[#DCE7F3] bg-white px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div class="text-sm text-[#486581]">
          Pagina <span class="font-semibold text-[#102A43]">{{ currentPage }}</span> de
          <span class="font-semibold text-[#102A43]">{{ totalPages }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-xl border border-[#D5E3F1] bg-[#F7FAFC] px-4 py-2 text-sm font-semibold text-[#486581] transition-colors hover:bg-white hover:text-[#102A43] disabled:cursor-not-allowed disabled:opacity-50"
            @click="prevPage"
            :disabled="currentPage === 1"
          >
            Anterior
          </button>
          <button
            class="rounded-xl bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#102a43]/20 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            @click="nextPage"
            :disabled="currentPage === totalPages"
          >
            Proxima
          </button>
        </div>
      </div>

      <div class="rounded-[24px] border border-[#DCE7F3] bg-white p-4 shadow-sm">
        <TaxasFooter
          :total-taxas="taxas.length"
          :taxa-media="taxaMedia"
        />
      </div>
    </div>
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

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  empresaSelecionada: {
    type: [String, Number],
    default: ''
  },
  empresas: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue','salvou-taxas'])

// Usar o composable useTaxas
// Remover o uso do composable obsoleto
// const { saveTaxas } = useTaxas()

// Usar o novo composable do Supabase
const { 
  salvarTaxasNoSupabase, 
  loading: salvandoTaxas, 
  success: mensagemSucesso,
  error: erroSupabase,
  resumo,
  removerTaxa: removerTaxaSupabase
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
    
    if (import.meta.client) {
      localStorage.setItem('taxas-conciliacao', JSON.stringify(taxas.value))
    }
    
    // Limpar mensagem após 5 segundos
    setTimeout(() => {
      ultimoResultado.value = null
    }, 5000)
    emit('salvou-taxas')
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
const currentPage = ref(1)
const itemsPerPage = computed(() => {
  const count = taxas.value.length
  if (count <= 10) return 10
  if (count <= 15) return count
  return 15
})
const totalPages = computed(() => {
  const ipp = itemsPerPage.value
  return Math.max(1, Math.ceil(taxas.value.length / ipp))
})
const paginatedTaxas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return taxas.value.slice(start, end)
})
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const selectedEmpresa = computed(() => {
  const val = props.empresaSelecionada
  if (!val) return null
  const byId = props.empresas.find(e => e.id == val)
  if (byId) return byId
  const valStr = String(val).trim().toLowerCase()
  return props.empresas.find(e => (e.nome && e.nome.trim().toLowerCase() === valStr) || (e.displayName && e.displayName.trim().toLowerCase() === valStr)) || null
})
const selectedEmpresaNome = computed(() => (selectedEmpresa.value && selectedEmpresa.value.nome) ? selectedEmpresa.value.nome : '')
const selectedEmpresaEC = computed(() => {
  if (selectedEmpresa.value && selectedEmpresa.value.matriz) return selectedEmpresa.value.matriz
  const nome = selectedEmpresaNome.value
  if (!nome) return ''
  const byNome = props.empresas.find(e => e.nome && e.nome.trim().toLowerCase() === nome.trim().toLowerCase())
  return byNome ? (byNome.matriz || '') : ''
})
// Preencher empresa e EC apenas para linhas novas (sem valor definido)
watch([selectedEmpresaNome, selectedEmpresaEC], ([nome, ec]) => {
  taxas.value.forEach(t => {
    if (!t.empresa) t.empresa = nome || ''
    if (!t.ec && ec !== '') t.ec = ec || ''
  })
}, { immediate: false })

// Todas as colunas disponíveis
const allColumns = ref(['id', 'empresa', 'ec', 'adquirente', 'bandeira', 'modalidade', 'vouchers', 'parcelas', 'taxa', 'dataCorte'])

// Ordem das colunas (para drag and drop)
  const columnOrder = computed(() => {
    if (import.meta.client) {
      const savedOrder = localStorage.getItem('taxas-column-order')
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder)
        let order = parsed.filter(col => allColumns.value.includes(col) && col !== 'id')
        order.unshift('id')
        allColumns.value.forEach(col => { if (!order.includes(col)) order.push(col) })
        const idxEmp = order.indexOf('empresa')
        const idxEc = order.indexOf('ec')
        if (idxEmp !== -1) {
          const desiredIdx = idxEmp + 1
          if (idxEc === -1) {
            order.splice(desiredIdx, 0, 'ec')
          } else if (idxEc !== desiredIdx) {
            const [ecCol] = order.splice(idxEc, 1)
            order.splice(desiredIdx, 0, ecCol)
          }
        }
        const idxAdq = order.indexOf('adquirente')
        const idxVouch = order.indexOf('vouchers')
        if (idxAdq !== -1) {
          const desiredVouchIdx = idxAdq + 1
          if (idxVouch === -1) {
            order.splice(desiredVouchIdx, 0, 'vouchers')
          } else if (idxVouch !== desiredVouchIdx) {
            const [vouchCol] = order.splice(idxVouch, 1)
            order.splice(desiredVouchIdx, 0, vouchCol)
          }
        }
        return order
      }
    }
    const base = [...allColumns.value]
    const idxEmp = base.indexOf('empresa')
    const idxEc = base.indexOf('ec')
    if (idxEmp !== -1 && idxEc !== -1 && idxEc !== idxEmp + 1) {
      const [ecCol] = base.splice(idxEc, 1)
      base.splice(idxEmp + 1, 0, ecCol)
    }
    const idxAdqBase = base.indexOf('adquirente')
    const idxVouchBase = base.indexOf('vouchers')
    if (idxAdqBase !== -1 && idxVouchBase !== -1 && idxVouchBase !== idxAdqBase + 1) {
      const [vouchCol] = base.splice(idxVouchBase, 1)
      base.splice(idxAdqBase + 1, 0, vouchCol)
    }
    return base
  })

// Colunas visíveis baseadas na resolução
const visibleColumns = computed(() => getVisibleTaxasColumns(columnOrder.value))

// Títulos das colunas
const columnTitles = {
  id: 'ID',
  empresa: 'Empresa',
  ec: 'EC',
  adquirente: 'Adquirente',
  bandeira: 'Bandeira',
  modalidade: 'Modalidade',
  vouchers: 'Vouchers',
  parcelas: 'Parcelas',
  taxa: 'Taxa (%)',
  dataCorte: 'Data de Corte'
}

// Larguras base das colunas
const baseColumnWidths = ref({
  id: 60,
  empresa: 200,
  ec: 120,
  adquirente: 150,
  bandeira: 130,
  modalidade: 160,
  vouchers: 180,
  parcelas: 100,
  taxa: 120,
  dataCorte: 150,
  acoes: 80
})

// Larguras responsivas das colunas
const responsiveColumnWidths = computed(() => {
  return getResponsiveColumnWidths(baseColumnWidths.value, 'taxas')
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

const empresaHeaderLabel = computed(() => selectedEmpresaNome.value || 'Todas as empresas')

const updateTaxa = (index, column, value) => {
  const columnFieldMap = {
    empresa: 'empresa',
    adquirente: 'adquirente',
    bandeira: 'bandeira',
    modalidade: 'modalidade',
    vouchers: 'vouchers',
    parcelas: 'parcelas',
    taxa: 'percentualTaxa',
    dataCorte: 'dataCorte'
  }
  
  const field = columnFieldMap[column] || column
  if (['parcelas', 'percentualTaxa', 'dataCorte'].includes(field)) {
    taxas.value[index][field] = parseFloat(value) || 0
  } else if (['adquirente','bandeira','modalidade','vouchers'].includes(field)) {
    taxas.value[index][field] = Array.isArray(value) ? value : (value ? [value] : [])
  } else {
    taxas.value[index][field] = value
  }
  salvarTaxas() // Usar a função local ao invés da obsoleta
}

const removerTaxa = async (index) => {
  const item = taxas.value[index]
  try {
    await removerTaxaSupabase(item, { criterio: 'chave_composta' })
  } catch (e) {
    console.error('Erro ao remover taxa no Supabase:', e)
  }
  taxas.value.splice(index, 1)
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  salvarTaxas()
  emit('salvou-taxas')
}

const adicionarTaxa = () => {
  // Gerar ID único baseado no timestamp e índice
  const novoId = `taxa_${Date.now()}_${taxas.value.length + 1}`
  
  const novaTaxa = {
    id: novoId, // Adicionar ID único
    empresa: selectedEmpresaNome.value || '',
    ec: selectedEmpresaEC.value || '',
    adquirente: '',
    bandeira: '',
    modalidade: '',
    vouchers: '',
    parcelas: 1,
    percentualTaxa: 0,
    dataCorte: 1
  }
  taxas.value.push(novaTaxa)
  isEditing.value = taxas.value.length - 1
  const ipp = itemsPerPage.value
  const tp = Math.max(1, Math.ceil(taxas.value.length / ipp))
  currentPage.value = tp
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
  
  if (import.meta.client) {
    localStorage.setItem('taxas-column-widths', JSON.stringify(baseColumnWidths.value))
  }
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
    
    if (import.meta.client) {
      localStorage.setItem('taxas-column-order', JSON.stringify(newColumnOrder))
    }
  }
}

const onDragEnd = () => {
  draggedColumn.value = ''
  draggedIndex.value = -1
}

const salvarTaxas = () => {
  if (import.meta.client) {
    localStorage.setItem('taxas-conciliacao', JSON.stringify(taxas.value))
  }
  emit('update:modelValue', taxas.value)
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
    const validSaved = parsed.filter(col => allColumns.value.includes(col))
    const missing = allColumns.value.filter(col => !validSaved.includes(col))
    const merged = [...validSaved, ...missing]
    const idxEmp = merged.indexOf('empresa')
    const idxEc = merged.indexOf('ec')
    if (idxEmp !== -1) {
      const desiredIdx = idxEmp + 1
      if (idxEc === -1) {
        merged.splice(desiredIdx, 0, 'ec')
      } else if (idxEc !== desiredIdx) {
        const [ecCol] = merged.splice(idxEc, 1)
        merged.splice(desiredIdx, 0, ecCol)
      }
    }
    const idxAdq = merged.indexOf('adquirente')
    const idxVouch = merged.indexOf('vouchers')
    if (idxAdq !== -1) {
      const desiredVouchIdx = idxAdq + 1
      if (idxVouch === -1) {
        merged.splice(desiredVouchIdx, 0, 'vouchers')
      } else if (idxVouch !== desiredVouchIdx) {
        const [vouchCol] = merged.splice(idxVouch, 1)
        merged.splice(desiredVouchIdx, 0, vouchCol)
      }
    }
    allColumns.value.splice(0, allColumns.value.length, ...merged)
  }
})
</script>
