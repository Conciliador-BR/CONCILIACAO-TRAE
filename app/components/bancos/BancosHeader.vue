<template>
  <div class="bg-gradient-to-r from-slate-50 via-gray-100 to-slate-50 border-b border-gray-200/50 px-12 py-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
        <div>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Movimentações Financeiras</h2>
          <p class="text-base text-gray-600">Conciliação e controle das movimentações</p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          @click="$emit('dados-atualizados')"
          class="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Atualizar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['dados-atualizados', 'erro-atualizacao'])
</script>
