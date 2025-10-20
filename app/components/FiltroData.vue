<template>
  <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-blue-700 mb-2">
          Data Inicial
        </label>
        <input 
          v-model="dataInicial"
          type="date"
          class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-blue-700 mb-2">
          Data Final
        </label>
        <input 
          v-model="dataFinal"
          type="date"
          class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
      </div>
    </div>
    <!-- REMOVIDO: botão Aplicar Filtro -->
  </div>
</template>

<script setup>
import { useGlobalFilters } from '~/composables/useGlobalFilters'

// Usar filtros globais diretamente
const { filtrosGlobais } = useGlobalFilters()

// Computed para sincronizar com os filtros globais
const dataInicial = computed({
  get: () => filtrosGlobais.dataInicial,
  set: (value) => {
    filtrosGlobais.dataInicial = value
  }
})

const dataFinal = computed({
  get: () => filtrosGlobais.dataFinal,
  set: (value) => {
    filtrosGlobais.dataFinal = value
  }
})

// Manter compatibilidade com props (opcional)
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      dataInicial: '',
      dataFinal: ''
    })
  }
})

const emit = defineEmits(['update:modelValue'])

// Emitir mudanças para manter compatibilidade
watch([dataInicial, dataFinal], () => {
  const novaData = {
    dataInicial: dataInicial.value,
    dataFinal: dataFinal.value
  }
  emit('update:modelValue', novaData)
})
</script>