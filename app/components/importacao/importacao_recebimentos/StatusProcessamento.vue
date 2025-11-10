<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6" v-if="arquivo">
    <h2 class="text-xl font-semibold mb-4">3. Processamento</h2>
    <div class="flex items-center space-x-4">
      <div v-if="status === 'processando'" class="flex items-center">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span class="ml-2">Processando arquivo...</span>
      </div>
      <div v-else-if="status === 'sucesso'" class="flex items-center text-green-600">
        <div class="text-xl">✅</div>
        <span class="ml-2">{{ totalRecebimentos }} recebimentos processados com sucesso!</span>
      </div>
      <div v-else-if="status === 'erro'" class="flex items-center text-red-600">
        <div class="text-xl">❌</div>
        <span class="ml-2">{{ mensagemErro }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  arquivo: { type: Object, default: null },
  status: { type: String, default: 'idle' },
  totalRecebimentos: { type: Number, default: 0 },
  mensagemErro: { type: String, default: '' }
})
</script>