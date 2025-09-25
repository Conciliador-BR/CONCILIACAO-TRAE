<template>
  <div v-if="status" class="mt-6">
    <div :class="[
      'p-4 rounded-lg',
      status.tipo === 'sucesso' ? 'bg-green-100 text-green-800' :
      status.tipo === 'erro' ? 'bg-red-100 text-red-800' :
      'bg-blue-100 text-blue-800'
    ]">
      <p class="font-medium">{{ status.mensagem }}</p>
      <p v-if="status.detalhes" class="text-sm mt-1">{{ status.detalhes }}</p>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  status: {
    type: Object,
    default: null
  }
})
</script>