<template>
  <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <button 
      @click="aplicarFiltro"
      :disabled="!empresaSelecionada"
      :class="[
        'w-full px-6 py-3 rounded-md font-medium transition-all duration-200 shadow-md',
        empresaSelecionada 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      ]"
    >
      Aplicar Filtro
    </button>
    <p v-if="!empresaSelecionada" class="text-sm text-red-500 mt-2 text-center">
      Selecione uma empresa para aplicar o filtro
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  empresaSelecionada: {
    type: String,
    required: true
  },
  filtroData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['aplicar-filtro'])

const aplicarFiltro = () => {
  if (!props.empresaSelecionada) {
    alert('Por favor, selecione uma empresa antes de aplicar o filtro.')
    return
  }
  
  emit('aplicar-filtro', {
    empresa: props.empresaSelecionada,
    dataInicial: props.filtroData.dataInicial,
    dataFinal: props.filtroData.dataFinal
  })
  
  console.log('Filtro aplicado:', {
    empresa: props.empresaSelecionada,
    dataInicial: props.filtroData.dataInicial,
    dataFinal: props.filtroData.dataFinal
  })
}
</script>