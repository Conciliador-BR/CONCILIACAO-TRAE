<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:p-0" @click.self="close">
    <div class="relative w-full max-w-md transform rounded-2xl bg-white p-6 shadow-2xl transition-all border border-gray-100">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-900">
          Observações
        </h3>
        <button 
          @click="close"
          class="ml-auto inline-flex items-center justify-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="space-y-4">
        <div>
          <label for="observacao" class="mb-2 block text-sm font-medium text-gray-700">
            Detalhes da observação
          </label>
          <textarea
            id="observacao"
            v-model="localObservacao"
            rows="4"
            class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 transition-shadow outline-none"
            placeholder="Digite suas observações aqui..."
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 flex items-center justify-end gap-3">
        <button
          @click="close"
          class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="save"
          class="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors shadow-lg shadow-blue-500/30"
        >
          Salvar Observação
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  initialValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'save'])

const localObservacao = ref('')

// Update local state when prop changes or modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    localObservacao.value = props.initialValue || ''
  }
})

const close = () => {
  emit('close')
}

const save = () => {
  emit('save', localObservacao.value)
}
</script>
