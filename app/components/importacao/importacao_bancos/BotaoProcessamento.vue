<template>
  <div class="flex space-x-4 justify-center">
    <button 
      @click="processar"
      :disabled="processando || !podeProcessar"
      class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
    >
      {{ processando ? 'Processando...' : 'Processar Arquivo' }}
    </button>
    <button 
      @click="remover"
      class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
    >
      Remover
    </button>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  processando: {
    type: Boolean,
    default: false
  },
  podeProcessar: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['processar', 'remover'])

// Métodos
const processar = () => {
  emit('processar')
}

const remover = () => {
  emit('remover')
}
</script>