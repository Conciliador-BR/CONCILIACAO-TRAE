<template>
  <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <label class="block text-sm font-medium text-blue-700 mb-2">
      Empresa
    </label>
    
    <select 
      v-model="empresaSelecionada"
      @change="emitirMudanca"
      class="w-full px-6 py-4 bg-white border border-gray-300 rounded-md text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[250px]"
      :disabled="!empresas || empresas.length === 0"
    >
      <option value="" class="bg-white">
        {{ empresas && empresas.length > 0 ? 'Todas as Empresas' : 'Carregando empresas...' }}
      </option>
      <option 
        v-for="empresa in empresas" 
        :key="empresa.id" 
        :value="empresa.id" 
        class="bg-white"
      >
        {{ formatarNomeEmpresa(empresa) }}
      </option>
    </select>
    
    <!-- Mensagem de erro se não houver empresas -->
    <div v-if="empresas && empresas.length === 0" class="text-xs text-red-500 mt-1">
      Nenhuma empresa encontrada. Verifique a conexão com o banco de dados.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  empresas: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'empresa-changed'])

const empresaSelecionada = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formatarNomeEmpresa = (empresa) => {
  if (!empresa) return ''
  
  const nome = empresa.nome || `Empresa ${empresa.id}`
  const matriz = empresa.matriz || ''
  
  return matriz ? `${nome} ${matriz}` : nome
}

const emitirMudanca = () => {
  emit('empresa-changed', empresaSelecionada.value)
}
</script>