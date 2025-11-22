<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Recuperar Senha</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <p class="text-gray-600 mb-4">
        Digite seu e-mail que enviaremos um link para redefinir sua senha.
      </p>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="reset-email" class="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            id="reset-email"
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="seu@email.com"
            :disabled="loading"
          />
        </div>
        
        <div class="flex space-x-3">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            :disabled="loading"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading || !email"
            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <LoginSpinner v-if="loading" />
            <span v-else>Enviar</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const loading = ref(false)

const handleSubmit = () => {
  loading.value = true
  $emit('reset', email.value)
  
  // Simular delay
  setTimeout(() => {
    loading.value = false
    $emit('close')
  }, 1500)
}
</script>