<template>
  <div class="bg-gradient-to-r from-slate-50 via-gray-100 to-slate-50 border-b border-gray-200/50 px-8 py-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">Gestão de Recebimentos</h2>
          <p class="text-sm text-gray-600">Controle completo dos recebimentos</p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          @click="atualizarDados"
          :disabled="atualizando"
          class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center space-x-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg v-if="!atualizando" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
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