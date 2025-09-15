<template>
  <div class="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
    <h2 class="text-lg font-semibold text-gray-800">Cadastro de Taxas</h2>
    <div>
      <button
        @click="$emit('adicionar-taxa')"
        class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        + Adicionar Taxa
      </button>
      <BotaoSalvar @click="$emit('salvar')" />
    </div>
  </div>
</template>

<script setup>
import BotaoSalvar from './BotaoSalvar.vue'
defineEmits(['adicionar-taxa', 'salvar'])
</script>