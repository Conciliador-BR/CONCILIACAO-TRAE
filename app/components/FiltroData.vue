<template>
  <div class="bg-white rounded-xl shadow-lg p-5 border-2 border-[#244b77] hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-semibold text-[#244b77] mb-3 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          Data Inicial
        </label>
        <input
          v-model="dataInicial"
          type="date"
          class="date-input w-full px-4 py-3 bg-white border border-white ring-1 ring-[#7ece89] rounded-lg text-base text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#73c77d] hover:ring-[#73c77d] transition-all duration-300 shadow-sm"
        >
      </div>
      <div>
        <label class="block text-sm font-semibold text-[#244b77] mb-3 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          Data Final
        </label>
        <input
          v-model="dataFinal"
          type="date"
          class="date-input w-full px-4 py-3 bg-white border border-white ring-1 ring-[#7ece89] rounded-lg text-base text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#73c77d] hover:ring-[#73c77d] transition-all duration-300 shadow-sm"
        >
      </div>
    </div>
    <!-- REMOVIDO: botão Aplicar Filtro -->
  </div>
</template>

<script setup>
// Manter compatibilidade com props
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

const dataInicial = computed({
  get: () => props.modelValue?.dataInicial || '',
  set: (value) => {
    emit('update:modelValue', {
      dataInicial: value,
      dataFinal: props.modelValue?.dataFinal || ''
    })
  }
})

const dataFinal = computed({
  get: () => props.modelValue?.dataFinal || '',
  set: (value) => {
    emit('update:modelValue', {
      dataInicial: props.modelValue?.dataInicial || '',
      dataFinal: value
    })
  }
})
</script>

<style scoped>
.date-input {
  accent-color: #7ece89;
}

.date-input::-webkit-calendar-picker-indicator {
  opacity: 0.9;
}

</style>
