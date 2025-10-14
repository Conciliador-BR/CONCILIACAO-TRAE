<template>
  <button 
    @click="aplicarFiltro"
    :disabled="false"
    :class="[
      'px-6 py-2 rounded-lg font-medium transition-all duration-200',
      'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
    ]"
  >
    Aplicar Filtro
  </button>
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
  
  // ✅ CORREÇÃO: Permitir aplicar filtro mesmo quando empresa está vazia (Todas as Empresas)
  emit('aplicar-filtro', {
    empresa: props.empresaSelecionada || '', // Valor vazio significa "Todas as Empresas"
    dataInicial: props.filtroData.dataInicial,
    dataFinal: props.filtroData.dataFinal
  })
}
</script>