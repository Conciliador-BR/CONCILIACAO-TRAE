<template>
  <div class="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-semibold text-blue-600 mb-3 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          Data Inicial
        </label>
        <input 
          v-model="dataInicial"
          type="date"
          class="w-full px-4 py-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-lg text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 shadow-sm"
        >
      </div>
      <div>
        <label class="block text-sm font-semibold text-blue-600 mb-3 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          Data Final
        </label>
        <input 
          v-model="dataFinal"
          type="date"
          class="w-full px-4 py-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-lg text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 shadow-sm"
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