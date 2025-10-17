<template>
  <div class="border-b border-gray-200 px-6 py-4">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Cadastro de Bancos</h2>
        <p class="text-gray-600 mt-1">Gerencie as informações bancárias das empresas</p>
      </div>
      <div class="flex space-x-3">
        <button 
          @click="$emit('adicionar-banco')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <span>Adicionar Banco</span>
        </button>
        <button 
          @click="$emit('salvar')"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <span>Salvar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['adicionar-banco', 'salvar'])
</script>