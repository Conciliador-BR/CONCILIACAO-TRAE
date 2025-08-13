<template>
  <button 
    @click="$emit('remover')"
    class="text-red-600 hover:text-red-800 transition-colors p-2"
    title="Remover taxa"
  >
    🗑️
  </button>
</template>

<script setup>
defineEmits(['remover'])
</script>