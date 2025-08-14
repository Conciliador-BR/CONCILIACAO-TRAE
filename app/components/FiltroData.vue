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

const dataInicial = ref(props.modelValue.dataInicial)
const dataFinal = ref(props.modelValue.dataFinal)

// Apenas atualizar o model, sem emitir eventos de mudança
const atualizarModel = () => {
  const novaData = {
    dataInicial: dataInicial.value,
    dataFinal: dataFinal.value
  }
  emit('update:modelValue', novaData)
}

// Watch para atualizar o model quando as datas mudarem
watch([dataInicial, dataFinal], () => {
  atualizarModel()
})

// Watch para sincronizar com props
watch(() => props.modelValue, (newValue) => {
  dataInicial.value = newValue.dataInicial
  dataFinal.value = newValue.dataFinal
}, { deep: true })
</script>