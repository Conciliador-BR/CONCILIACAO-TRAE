<template>
  <button
    type="button"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
    :class="loading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'"
    @click="$emit('click')"
  >
    <span v-if="loading">{{ loadingLabel }}</span>
    <span v-else>{{ label }}</span>
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Enviar'
  },
  loadingLabel: {
    type: String,
    default: 'Enviando...'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>
