<template>
  <div class="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
    <label class="block text-sm font-semibold text-blue-600 mb-3 flex items-center">
      <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm-2 5v7a2 2 0 002 2h12a2 2 0 002-2V9H2zm8 2a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clip-rule="evenodd"/>
      </svg>
      Empresa
    </label>
    
    <select 
      v-model="empresaSelecionada"
      @change="emitirMudanca"
      class="w-full px-4 py-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-lg text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 shadow-sm min-w-[280px]"
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

// ✅ Atualizar para usar o novo formato: "Nome Empresa - Nome Matriz - Matriz EC"
const formatarNomeEmpresa = (empresa) => {
  if (!empresa) return ''
  
  // Se já tem displayName formatado, usar ele
  if (empresa.displayName) {
    return empresa.displayName
  }
  
  // Caso contrário, construir o formato manualmente
  const nome = empresa.nome || `Empresa ${empresa.id}`
  const nomeMatriz = empresa.nomeMatriz || ''
  const matriz = empresa.matriz || ''
  
  return `${nome}${nomeMatriz ? ` - ${nomeMatriz}` : ''} - ${matriz}`
}

const emitirMudanca = () => {
  emit('empresa-changed', empresaSelecionada.value)
}
</script>