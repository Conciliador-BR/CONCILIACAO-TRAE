<template>
  <button 
    @click="aplicarFiltro"
    :disabled="!empresaSelecionada"
    :class="[
      'px-6 py-2 rounded-lg font-medium transition-all duration-200',
      empresaSelecionada 
        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
    ]"
  >
    Aplicar Filtro
  </button>
  <p v-if="!empresaSelecionada" class="text-sm text-red-500 mt-1">
    Selecione uma empresa para aplicar o filtro
  </p>
</template>

<script setup>
const props = defineProps({
  empresaSelecionada: {
    type: [String, Number],
    default: ''
  },
  filtroData: {
    type: Object,
    default: () => ({ dataInicial: '', dataFinal: '' })
  }
})

const emit = defineEmits(['aplicar-filtro'])

const aplicarFiltro = () => {
  console.log('Botão aplicar filtro clicado com:', {
    empresa: props.empresaSelecionada,
    dataInicial: props.filtroData.dataInicial,
    dataFinal: props.filtroData.dataFinal
  })
  
  if (!props.empresaSelecionada) {
    console.warn('Nenhuma empresa selecionada')
    return
  }
  
  emit('aplicar-filtro', {
    empresa: props.empresaSelecionada,
    dataInicial: props.filtroData.dataInicial,
    dataFinal: props.filtroData.dataFinal
  })
}
</script>