<template>
  <input 
    v-if="column === 'id'" 
    type="text" 
    :value="index + 1" 
    readonly 
    class="w-full px-3 py-2 text-center font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md cursor-not-allowed"
  />
  <component
    v-else
    :is="getCellComponent(column)"
    :value="value"
    @input="handleInput"
    @change="handleChange"
    :class="getCellClasses(column)"
    :placeholder="getPlaceholder(column)"
    :readonly="isReadOnly(column)"
    :step="getStep(column)"
  >
    <option v-if="getCellComponent(column) === 'select'" value="">{{ getSelectPlaceholder(column) }}</option>
    <option 
      v-if="getCellComponent(column) === 'select'" 
      v-for="option in getColumnOptions(column)" 
      :key="getOptionKey(option, column)" 
      :value="getOptionValue(option, column)"
    >
      {{ getOptionLabel(option, column) }}
    </option>
  </component>
</template>

<script setup>
// Importar composables
import { useEmpresas } from '~/composables/useEmpresas'
import { useConfigCartoes } from '~/composables/useConfigCartoes'

const props = defineProps({
  column: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: ''
  },
  empresasDisponiveis: {
    type: Array,
    default: () => []
  },
  index: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update'])

// Função para obter o número da linha (índice + 1)
// Garantir que a função não cause re-renders infinitos
// Remover a função getLineNumber() - não precisamos mais dela
// const getLineNumber = () => {
//   return props.index + 1
// }
// Função para normalizar dados
const normalizarDado = (valor, column) => {
  if (!valor) return valor
  
  // Campos que devem ser normalizados (maiúsculo e sem acentos)
  const camposParaNormalizar = ['modalidade', 'bandeira', 'adquirente']
  
  if (camposParaNormalizar.includes(column)) {
    const valorOriginal = valor
    const valorNormalizado = valor.toString()
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^A-Z0-9\s]/g, '') // Remove caracteres especiais, mantém espaços
    
    console.log(`Normalizando ${column}: "${valorOriginal}" -> "${valorNormalizado}"`)
    return valorNormalizado
  }
  
  return valor
}

// Handlers para input e change
const handleInput = (event) => {
  const valor = event.target.value
  console.log(`Input em ${props.column}: "${valor}"`)
  const valorNormalizado = normalizarDado(valor, props.column)
  console.log(`Valor normalizado: "${valorNormalizado}"`)
  emit('update', valorNormalizado)
}

const handleChange = (event) => {
  const valor = event.target.value
  console.log(`Change em ${props.column}: "${valor}"`)
  const valorNormalizado = normalizarDado(valor, props.column)
  console.log(`Valor normalizado: "${valorNormalizado}"`)
  emit('update', valorNormalizado)
}

// Obter dados dos composables
const { getAdquirentes, getBandeiras, getModalidades } = useConfigCartoes()

// Usar empresas passadas como prop em vez de buscar localmente
const empresas = computed(() => {
  console.log('Empresas disponíveis no TaxasCellEditor:', props.empresasDisponiveis)
  return props.empresasDisponiveis
})

const adquirentes = getAdquirentes()
const bandeiras = getBandeiras()
const modalidades = getModalidades()

// Remover ou comentar a busca local de empresas
// onMounted(async () => {
//   await fetchEmpresas()
// })

// Funções auxiliares
const getCellComponent = (column) => {
  if (column === 'empresa') return 'select'
  if (column === 'adquirente') return 'select'
  if (column === 'bandeira') return 'select'
  if (column === 'modalidade') return 'select'
  if (column === 'parcelas') return 'input'
  if (column === 'taxa') return 'input'
  if (column === 'dataCorte') return 'input'
  return 'input'
}

const getCellClasses = (column) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  
  if (column === 'id') {
    return baseClasses + ' bg-gray-100 text-gray-600 cursor-not-allowed'
  }
  
  if (['parcelas', 'taxa'].includes(column)) {
    return baseClasses + ' text-right'
  }
  
  return baseClasses
}

const getPlaceholder = (column) => {
  const placeholders = {
    id: '',
    empresa: 'Selecione a empresa',
    adquirente: 'Selecione o adquirente',
    bandeira: 'Selecione a bandeira',
    modalidade: 'Selecione a modalidade',
    parcelas: 'Ex: 1',
    taxa: 'Ex: 2.5',
    dataCorte: 'dd/mm/aaaa'
  }
  return placeholders[column] || ''
}

const isReadOnly = (column) => {
  return column === 'id'
}

const getStep = (column) => {
  return ['taxa'].includes(column) ? '0.01' : '1'
}

const getSelectPlaceholder = (column) => {
  const placeholders = {
    empresa: 'Selecione a empresa',
    adquirente: 'Selecione o adquirente',
    bandeira: 'Selecione a bandeira',
    modalidade: 'Selecione a modalidade'
  }
  return placeholders[column] || 'Selecione...'
}

const getColumnOptions = (column) => {
  const options = {
    empresa: empresas.value,
    adquirente: adquirentes,
    bandeira: bandeiras,
    modalidade: modalidades
  }
  return options[column] || []
}

const getOptionKey = (option, column) => {
  return typeof option === 'object' ? option.id || option.value : option
}

const getOptionValue = (option, column) => {
  return typeof option === 'object' ? option.value || option.nome : option
}

const getOptionLabel = (option, column) => {
  return typeof option === 'object' ? option.label || option.nome : option
}
</script>