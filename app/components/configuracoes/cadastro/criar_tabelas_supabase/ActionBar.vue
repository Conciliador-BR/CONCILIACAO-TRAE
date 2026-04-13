<template>
  <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
    <div class="text-xs text-gray-500">
      Se der erro de permissão, é porque a função RPC ainda não foi criada no Supabase.
    </div>
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="disabled"
      @click="$emit('criar')"
    >
      <span v-if="loading">Criando...</span>
      <span v-else>Criar tabelas</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

defineEmits(['criar'])
</script>

