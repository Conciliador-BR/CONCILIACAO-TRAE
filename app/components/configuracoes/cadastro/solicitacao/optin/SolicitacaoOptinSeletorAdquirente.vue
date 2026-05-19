<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-900">1. Selecione a Adquirente</h3>
          <p class="text-sm text-gray-600 mt-1">Escolha a adquirente para configurar a solicitacao de opt-in.</p>
        </div>
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 font-bold text-base tracking-wide shadow-sm">
          Solicitação de Opt-In
        </div>
      </div>
    </div>

    <div class="p-8">
      <div class="mb-2">
        <h4 class="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          Cartões ({{ adquirentes.length }})
        </h4>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
        <button
          v-for="adquirente in adquirentes"
          :key="adquirente.id"
          type="button"
          :class="[
            'border-2 rounded-lg p-4 transition-all duration-200 text-center',
            modelValue === adquirente.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          ]"
          @click="$emit('update:modelValue', adquirente.id)"
        >
          <div class="flex flex-col items-center">
            <div :class="['w-12 h-12 rounded-full flex items-center justify-center mb-2', adquirente.cor]">
              <span class="text-white font-bold text-lg">{{ adquirente.sigla }}</span>
            </div>
            <span class="text-sm font-medium text-gray-700">{{ adquirente.nome }}</span>
            <span class="mt-2 text-xs text-gray-500">{{ adquirente.descricao }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])

const adquirentes = [
  {
    id: 'rede',
    nome: 'Rede',
    sigla: 'RD',
    cor: 'bg-orange-600',
    descricao: 'Opt-in merchant-statement'
  }
]
</script>
