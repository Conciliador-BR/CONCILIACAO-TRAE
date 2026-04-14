<template>
  <button
    type="button"
    :disabled="disabled || loading"
    class="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
    @click="$emit('click')"
  >
    {{ loading ? 'Excluindo...' : 'Excluir Tabelas Selecionadas' }}
  </button>
</template>

<script setup>
defineProps({
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>
