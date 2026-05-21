<template>
  <div class="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
    <div class="text-3xl font-bold text-white sm:text-4xl">{{ value }}</div>
    <div class="mt-2 text-sm font-medium text-blue-100">{{ label }}</div>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
})
</script>
