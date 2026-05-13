<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize"
    :class="badgeClass"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: '' },
  type: { type: String, default: 'integracao' }
})

const normalizedStatus = computed(() => String(props.status || '').trim().toLowerCase())

const label = computed(() => {
  if (props.type === 'log') {
    if (normalizedStatus.value === 'sucesso') return 'Sucesso'
    if (normalizedStatus.value === 'erro') return 'Erro'
    return 'Pendente'
  }

  if (normalizedStatus.value === 'valida') return 'Valida'
  if (normalizedStatus.value === 'erro') return 'Erro'
  return 'Pendente'
})

const badgeClass = computed(() => {
  if (normalizedStatus.value === 'sucesso' || normalizedStatus.value === 'valida') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  if (normalizedStatus.value === 'erro') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700'
})
</script>
