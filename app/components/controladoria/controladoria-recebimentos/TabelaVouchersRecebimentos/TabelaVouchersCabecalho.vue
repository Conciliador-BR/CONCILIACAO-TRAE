<template>
  <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
    <div>
      <h2 class="text-xl font-semibold text-gray-900">Vouchers (Recebimentos)</h2>
      <p class="text-sm text-gray-600 mt-1">
        Adquirente de Cartões
        <span v-if="!empresaSelecionada" class="text-amber-600 font-medium ml-2 text-xs">
          (Selecione uma empresa)
        </span>
      </p>
    </div>
    <button
      @click="$emit('recarregar')"
      class="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
      :disabled="!empresaSelecionada || loading"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Recarregar
    </button>
  </div>
  <div v-if="error" class="bg-red-50 text-red-700 px-6 py-3 text-sm border-b border-red-100">
    {{ error }}
  </div>
  <div v-if="successMessage" class="bg-green-50 text-green-700 px-6 py-3 text-sm border-b border-green-100 flex justify-between items-center">
    <span>{{ successMessage }}</span>
    <button @click="$emit('limpar-sucesso')" class="text-green-800 hover:text-green-900">&times;</button>
  </div>
</template>

<script setup>
defineProps({
  empresaSelecionada: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  successMessage: {
    type: String,
    default: ''
  }
})

defineEmits(['recarregar', 'limpar-sucesso'])
</script>
