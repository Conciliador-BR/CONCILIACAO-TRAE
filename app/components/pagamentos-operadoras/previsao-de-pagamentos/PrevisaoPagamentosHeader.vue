<template>
  <div class="bg-gray-50 border-b border-gray-200 p-4">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold text-gray-800">Previsão de Pagamentos</h2>
      <div class="flex space-x-2">
        <button 
          @click="atualizarDados"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Atualizar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['dados-atualizados', 'erro-atualizacao'])

const atualizarDados = async () => {
  try {
    // Lógica de atualização
    emit('dados-atualizados')
  } catch (error) {
    emit('erro-atualizacao', error.message)
  }
}
</script>