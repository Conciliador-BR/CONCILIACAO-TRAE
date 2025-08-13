<template>
  <div class="p-4 bg-blue-50 border-b border-blue-200">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-blue-800">Cadastro de Taxas</h3>
      <button 
        @click="$emit('adicionar-taxa')"
        class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-md font-medium"
      >
        + Adicionar Taxa
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['adicionar-taxa'])
</script>