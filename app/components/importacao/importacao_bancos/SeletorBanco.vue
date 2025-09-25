<template>
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-4">
      1. Selecione o Banco
    </label>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div 
        v-for="banco in bancos" 
        :key="banco.codigo"
        @click="selecionarBanco(banco)"
        :class="[
          'border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center',
          bancoSelecionado?.codigo === banco.codigo 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        ]"
      >
        <div class="flex flex-col items-center">
          <div :class="['w-12 h-12 rounded-full flex items-center justify-center mb-2', banco.cor]">
            <span class="text-white font-bold text-lg">{{ banco.sigla }}</span>
          </div>
          <span class="text-sm font-medium text-gray-700">{{ banco.nome }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  bancoSelecionado: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['banco-selecionado'])

// Dados dos bancos
const bancos = ref([
  { codigo: 'ITAU', nome: 'Itaú', sigla: 'IT', cor: 'bg-orange-500' },
  { codigo: 'BRADESCO', nome: 'Bradesco', sigla: 'BR', cor: 'bg-red-500' },
  { codigo: 'SICOOB', nome: 'Sicoob', sigla: 'SC', cor: 'bg-green-500' },
  { codigo: 'TRIBANCO', nome: 'Tribanco', sigla: 'TR', cor: 'bg-blue-500' },
  { codigo: 'SICREDI', nome: 'Sicredi', sigla: 'SI', cor: 'bg-purple-500' },
  { codigo: 'CAIXA', nome: 'Caixa', sigla: 'CX', cor: 'bg-blue-600' }
])

// Métodos
const selecionarBanco = (banco) => {
  emit('banco-selecionado', banco)
}
</script>