<template>
  <div v-if="open" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <button
      type="button"
      class="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
      aria-label="Fechar confirmação"
      @click="$emit('cancel')"
    />

    <div class="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
      <div class="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-5 sm:px-6 py-4">
        <div class="flex items-center gap-3">
          <div
            class="h-9 w-9 rounded-xl flex items-center justify-center"
            :class="iconClass"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0l-7.07 12a2 2 0 001.74 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-gray-900">{{ title }}</h3>
            <p v-if="subtitle" class="text-xs sm:text-sm text-gray-600">{{ subtitle }}</p>
          </div>
        </div>
      </div>

      <div class="px-5 sm:px-6 py-5 space-y-4">
        <p class="text-sm text-gray-700 leading-relaxed">{{ message }}</p>

        <div v-if="requirePassword" class="space-y-2">
          <label class="block text-xs font-medium text-gray-700">Senha de confirmação</label>
          <input
            :value="password"
            type="password"
            class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite a senha para confirmar"
            @input="$emit('update:password', $event.target.value)"
          />
          <p v-if="passwordError" class="text-xs text-red-600">{{ passwordError }}</p>
        </div>
      </div>

      <div class="px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          :disabled="loading"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :class="buttonClass"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          {{ loading ? 'Processando...' : confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar ação' },
  subtitle: { type: String, default: '' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirmar' },
  loading: { type: Boolean, default: false },
  variant: { type: String, default: 'danger' },
  requirePassword: { type: Boolean, default: false },
  password: { type: String, default: '' },
  passwordError: { type: String, default: '' }
})

defineEmits(['cancel', 'confirm', 'update:password'])

const iconClass = computed(() => {
  return props.variant === 'danger'
    ? 'bg-red-100 text-red-600'
    : 'bg-amber-100 text-amber-600'
})

const buttonClass = computed(() => {
  return props.variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-amber-600 hover:bg-amber-700'
})
</script>
