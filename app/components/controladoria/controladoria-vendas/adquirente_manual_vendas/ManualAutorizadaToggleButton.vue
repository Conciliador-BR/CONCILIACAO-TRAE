<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
    @click="$emit('toggle')"
  >
    <span
      class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
      :class="visible ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
    >
      {{ visible ? '-' : '+' }}
    </span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: 'Autorizada Manual'
  }
})

defineEmits(['toggle'])
</script>
