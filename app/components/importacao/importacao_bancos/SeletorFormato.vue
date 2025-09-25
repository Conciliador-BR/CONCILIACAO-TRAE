<template>
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-4">
      2. Selecione o Formato do Arquivo
    </label>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div 
        v-for="formato in formatos" 
        :key="formato.tipo"
        @click="selecionarFormato(formato)"
        :class="[
          'border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center',
          formatoSelecionado?.tipo === formato.tipo 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        ]"
      >
        <div class="flex flex-col items-center">
          <div :class="['w-10 h-10 rounded flex items-center justify-center mb-2', formato.cor]">
            <span class="text-white font-bold text-xs">{{ formato.tipo }}</span>
          </div>
          <span class="text-sm font-medium text-gray-700">{{ formato.descricao }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  formatoSelecionado: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['formato-selecionado'])

// Formatos de arquivo
const formatos = ref([
  { tipo: 'OFX', descricao: 'Open Financial Exchange', accept: '.ofx', cor: 'bg-blue-500' },
  { tipo: 'PDF', descricao: 'Portable Document Format', accept: '.pdf', cor: 'bg-red-500' },
  { tipo: 'XLSX', descricao: 'Excel Spreadsheet', accept: '.xlsx', cor: 'bg-green-500' },
  { tipo: 'CSV', descricao: 'Comma Separated Values', accept: '.csv', cor: 'bg-yellow-500' }
])

// Métodos
const selecionarFormato = (formato) => {
  emit('formato-selecionado', formato)
}
</script>