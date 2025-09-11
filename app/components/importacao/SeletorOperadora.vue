<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-xl font-semibold mb-4">2. Selecione a Operadora</h2>
    <div v-if="disabled" class="text-gray-400 text-sm mb-4">
      ⚠️ Selecione uma empresa primeiro
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button 
        v-for="operadora in operadoras" 
        :key="operadora.id"
        @click="!disabled && $emit('operadora-selecionada', operadora.id)"
        :disabled="disabled"
        :class="[
          'p-4 border-2 rounded-lg transition-all',
          disabled 
            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
            : modelValue === operadora.id 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
        ]"
      >
        <div class="text-center">
          <div class="text-2xl mb-2">{{ operadora.icon }}</div>
          <div class="font-medium">{{ operadora.nome }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['operadora-selecionada'])

const operadoras = [
  { id: 'unica', nome: 'Única', icon: '🏦' },
  { id: 'cielo', nome: 'Cielo', icon: '💳' },
  { id: 'stone', nome: 'Stone', icon: '💎' },
  { id: 'getnet', nome: 'Getnet', icon: '🌐' }
]
</script>