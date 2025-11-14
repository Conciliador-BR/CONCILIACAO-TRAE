<template>
  <div class="bg-gradient-to-r from-slate-50 via-gray-100 to-slate-50 border-b border-gray-200/50 px-12 py-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.005 9.005 0 003 12c0 4.418 3.582 8 8 8s8-3.582 8-8a8.968 8.968 0 00-2.599-6.401M12 6v6l4 2" />
          </svg>
        </div>
        <div>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Previsão de Pagamentos</h2>
          <p class="text-base text-gray-600">Estimativa e controle de recebimentos futuros</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <button 
          @click="atualizarDados"
          class="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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