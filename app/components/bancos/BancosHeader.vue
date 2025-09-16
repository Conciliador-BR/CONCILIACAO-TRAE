<template>
  <div class="bg-blue-50 border-b border-blue-200 p-4">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold text-blue-800">Movimentações Bancárias</h2>
      <button 
        @click="$emit('dados-atualizados')"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Atualizar
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['dados-atualizados', 'erro-atualizacao'])
</script>