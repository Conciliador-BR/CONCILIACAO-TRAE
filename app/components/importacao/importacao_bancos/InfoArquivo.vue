<template>
  <div class="space-y-4">
    <div class="flex items-center justify-center space-x-2">
      <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span class="text-lg font-medium text-gray-700">{{ arquivo.name }}</span>
    </div>
    <p class="text-sm text-gray-500">
      Tamanho: {{ formatFileSize(arquivo.size) }}
    </p>
    <BotaoProcessamento 
      :processando="processando"
      :pode-processar="podeProcessar"
      @processar="$emit('processar')"
      @remover="$emit('remover')"
    />
  </div>
</template>

<script setup>
import BotaoProcessamento from './BotaoProcessamento.vue'

// Props
const props = defineProps({
  arquivo: {
    type: Object,
    required: true
  },
  processando: {
    type: Boolean,
    default: false
  },
  podeProcessar: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['processar', 'remover'])

// Métodos
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>