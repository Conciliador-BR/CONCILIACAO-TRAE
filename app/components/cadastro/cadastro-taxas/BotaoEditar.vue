<template>
  <button
    @click="$emit('click')"
    class="text-indigo-600 hover:text-indigo-900"
  >
    Editar
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>