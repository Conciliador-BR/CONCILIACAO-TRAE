<template>
  <div class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Recebimentos</h2>
        <p class="text-sm text-gray-600">Controle de recebimentos realizados</p>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          @click="atualizarDados"
          :disabled="atualizando"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <span v-if="atualizando">Atualizando...</span>
          <span v-else>Atualizar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['dados-atualizados', 'erro-atualizacao'])

const atualizando = ref(false)

const atualizarDados = async () => {
  atualizando.value = true
  try {
    // Simular atualização
    await new Promise(resolve => setTimeout(resolve, 1000))
    emit('dados-atualizados')
  } catch (error) {
    emit('erro-atualizacao', error.message)
  } finally {
    atualizando.value = false
  }
}
</script>