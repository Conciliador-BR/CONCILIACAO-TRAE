<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6" v-if="operadoraSelecionada">
    <h2 class="text-xl font-semibold mb-4">2. Carregue o Arquivo</h2>
    <div 
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragOver"
      @dragleave="handleDragLeave"
      :class="[
        'border-2 border-dashed rounded-lg p-8 text-center transition-all',
        status === 'processando'
          ? 'border-blue-500 bg-blue-50'
          : (isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300')
      ]"
    >
      <input 
        ref="fileInput"
        type="file" 
        @change="handleFileSelect"
        accept=".xlsx,.xls,.csv"
        class="hidden"
      >
      <div v-if="!arquivo">
        <div class="text-4xl mb-4">📁</div>
        <p class="text-lg mb-2">Arraste o arquivo aqui ou</p>
        <button 
          @click="$refs.fileInput.click()"
          class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Selecionar Arquivo
        </button>
        <p class="text-sm text-gray-500 mt-2">Formatos aceitos: .xlsx, .xls, .csv</p>
      </div>
      <div v-else>
        <div v-if="status === 'processando'" class="text-blue-600">
          <div class="mb-4 flex items-center justify-center">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          </div>
          <p class="text-lg font-medium">{{ arquivo.name }}</p>
          <p class="mt-1 text-sm">{{ formatFileSize(arquivo.size) }}</p>
          <p class="mt-3 text-sm font-medium">Processando arquivo...</p>
        </div>
        <div v-else class="text-green-600">
          <div class="text-4xl mb-4">✅</div>
          <p class="text-lg font-medium">{{ arquivo.name }}</p>
          <p class="text-sm">{{ formatFileSize(arquivo.size) }}</p>
        </div>
        <button 
          @click="removerArquivo"
          :disabled="status === 'processando'"
          class="mt-2 text-red-500 hover:text-red-700"
        >
          Remover arquivo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  operadoraSelecionada: {
    type: String,
    default: null
  },
  arquivo: {
    type: Object,
    default: null
  },
  status: {
    type: String,
    default: 'idle'
  }
})

const emit = defineEmits(['arquivo-selecionado', 'arquivo-removido'])

const isDragging = ref(false)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) emit('arquivo-selecionado', file)
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) emit('arquivo-selecionado', file)
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const removerArquivo = () => {
  const fileInput = document.querySelector('input[type="file"]')
  if (fileInput) fileInput.value = ''
  emit('arquivo-removido')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
