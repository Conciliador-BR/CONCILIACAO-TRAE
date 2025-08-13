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
          @change="emitirMudanca"
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
          @change="emitirMudanca"
          class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
      </div>
    </div>
    <div class="mt-4">
      <button 
        @click="aplicarFiltro"
        class="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-md font-medium"
      >
        Aplicar Filtro
      </button>
    </div>
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

const emit = defineEmits(['update:modelValue', 'data-changed', 'aplicar-filtro'])

const dataInicial = ref(props.modelValue.dataInicial)
const dataFinal = ref(props.modelValue.dataFinal)

const emitirMudanca = () => {
  const novaData = {
    dataInicial: dataInicial.value,
    dataFinal: dataFinal.value
  }
  emit('update:modelValue', novaData)
  emit('data-changed', novaData)
}

const aplicarFiltro = () => {
  const filtroData = {
    dataInicial: dataInicial.value,
    dataFinal: dataFinal.value
  }
  
  // Emitir eventos para atualizar o model e aplicar o filtro
  emit('update:modelValue', filtroData)
  emit('aplicar-filtro', filtroData)
  
  // Feedback visual opcional
  console.log('Filtro aplicado:', filtroData)
}

const aplicarFiltroRapido = (tipo) => {
  const hoje = new Date()
  let inicio, fim
  
  switch (tipo) {
    case 'hoje':
      inicio = fim = hoje.toISOString().split('T')[0]
      break
    case 'ontem':
      const ontem = new Date(hoje)
      ontem.setDate(hoje.getDate() - 1)
      inicio = fim = ontem.toISOString().split('T')[0]
      break
    case 'semana':
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - hoje.getDay())
      inicio = inicioSemana.toISOString().split('T')[0]
      fim = hoje.toISOString().split('T')[0]
      break
    case 'mes':
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      fim = hoje.toISOString().split('T')[0]
      break
  }
  
  dataInicial.value = inicio
  dataFinal.value = fim
  emitirMudanca()
}

// Watch para sincronizar com props
watch(() => props.modelValue, (newValue) => {
  dataInicial.value = newValue.dataInicial
  dataFinal.value = newValue.dataFinal
}, { deep: true })
</script>