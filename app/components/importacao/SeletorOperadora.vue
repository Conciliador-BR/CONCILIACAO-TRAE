<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-xl font-semibold mb-4">2. Selecione a Operadora</h2>
    <div v-if="disabled" class="text-gray-400 text-sm mb-4">
      ⚠️ Selecione uma empresa primeiro
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div 
        v-for="operadora in operadoras" 
        :key="operadora.id"
        @click="!disabled && $emit('operadora-selecionada', operadora.id)"
        :class="[
          'border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center',
          disabled 
            ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
            : modelValue === operadora.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        ]"
      >
        <div class="flex flex-col items-center">
          <div :class="['w-12 h-12 rounded-full flex items-center justify-center mb-2', operadora.cor]">
            <span class="text-white font-bold text-lg">{{ operadora.sigla }}</span>
          </div>
          <span class="text-sm font-medium text-gray-700">{{ operadora.nome }}</span>
        </div>
      </div>
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
  { id: 'unica', nome: 'Única', sigla: 'UN', cor: 'bg-green-600' },
  { id: 'cielo', nome: 'Cielo', sigla: 'CI', cor: 'bg-yellow-500' },
  { id: 'stone', nome: 'Stone', sigla: 'ST', cor: 'bg-blue-600' },
  { id: 'getnet', nome: 'Getnet', sigla: 'GN', cor: 'bg-teal-500' },
  { id: 'sicredi', nome: 'Sicredi', sigla: 'SI', cor: 'bg-purple-500' },
  { id: 'azulzinha', nome: 'Azulzinha', sigla: 'AZ', cor: 'bg-blue-400' },
  { id: 'pagseguro', nome: 'PagSeguro', sigla: 'PS', cor: 'bg-orange-500' },
  { id: 'bin', nome: 'Bin', sigla: 'BN', cor: 'bg-gray-600' },
  { id: 'rede', nome: 'Rede', sigla: 'RD', cor: 'bg-red-500' }
]
</script>