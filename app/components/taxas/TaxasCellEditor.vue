<template>
  <component
    :is="getCellComponent(column)"
    :value="value"
    @input="$emit('update', $event.target.value)"
    :class="getCellClasses(column)"
    :placeholder="getPlaceholder(column)"
    :readonly="isReadOnly(column)"
    :step="getStep(column)"
  >
    <option v-if="getCellComponent(column) === 'select'" value="">{{ getSelectPlaceholder(column) }}</option>
    <option v-if="getCellComponent(column) === 'select'" v-for="option in getColumnOptions(column)" :key="getOptionKey(option, column)" :value="getOptionValue(option, column)">
      {{ getOptionLabel(option, column) }}
    </option>
  </component>
</template>

<script setup>
// Importar composables
import { useEmpresas } from '~/composables/useEmpresas'
import { useConfigCartoes } from '~/composables/useConfigCartoes'

defineProps({
  column: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: ''
  }
})

defineEmits(['update'])

// Obter dados dos composables
const { getEmpresas } = useEmpresas()
const { getAdquirentes, getBandeiras, getModalidades } = useConfigCartoes()

const empresas = getEmpresas()
const adquirentes = getAdquirentes()
const bandeiras = getBandeiras()
const modalidades = getModalidades()

// Funções auxiliares
const getCellComponent = (column) => {
  return ['empresa', 'adquirente', 'bandeira', 'modalidade'].includes(column) ? 'select' : 'input'
}

const getCellClasses = (column) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  
  if (['parcelas', 'taxa'].includes(column)) {
    return baseClasses + ' text-right'
  }
  
  return baseClasses
}

const getPlaceholder = (column) => {
  const placeholders = {
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
  return false
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
    empresa: empresas,
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