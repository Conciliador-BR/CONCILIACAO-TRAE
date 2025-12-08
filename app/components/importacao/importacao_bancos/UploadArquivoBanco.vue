<template>
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-4">
      3. Importar Arquivo
    </label>
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input 
        ref="fileInput"
        type="file" 
        :accept="formatoSelecionado.accept"
        @change="handleFileSelect"
        class="hidden"
      >
      
      <div v-if="!arquivoSelecionado" @click="$refs.fileInput.click()" class="cursor-pointer">
        <div class="mx-auto w-12 h-12 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="text-lg font-medium text-gray-700 mb-2">Clique para selecionar arquivo</p>
        <p class="text-sm text-gray-500">
          Formato aceito: {{ formatoSelecionado.descricao }} ({{ formatoSelecionado.accept }})
        </p>
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center justify-center space-x-2">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-lg font-medium text-gray-700">{{ arquivoSelecionado.name }}</span>
        </div>
        <p class="text-sm text-gray-500">
          Tamanho: {{ formatFileSize(arquivoSelecionado.size) }}
        </p>
        <div class="flex space-x-4 justify-center">
          <button 
            @click="processarArquivo"
            :disabled="processando"
            class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {{ processando ? 'Processando...' : 'Processar Arquivo' }}
          </button>
          <button 
            @click="removerArquivo"
            class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Remover
          </button>
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
    required: true
  },
  arquivoSelecionado: {
    type: Object,
    default: null
  },
  processando: {
    type: Boolean,
    default: false
  }
})

// Template ref
const fileInput = ref(null)

// Emits
const emit = defineEmits(['arquivo-selecionado', 'arquivo-removido', 'processar-arquivo'])

// Métodos
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('arquivo-selecionado', file)
  }
}

const removerArquivo = () => {
  if (fileInput?.value) {
    try { fileInput.value.value = '' } catch (_) {}
  }
  emit('arquivo-removido')
}

const processarArquivo = () => {
  emit('processar-arquivo')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
