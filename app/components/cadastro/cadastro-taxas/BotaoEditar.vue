<template>
  <button
    @click="$emit('click')"
    class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#BFD3E6] bg-gradient-to-b from-white to-[#F4F8FC] px-3.5 py-2 text-xs font-semibold text-[#1f4f77] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9EBAD6] hover:from-[#F8FBFE] hover:to-white hover:text-[#102A43] hover:shadow-md"
  >
    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
    Editar
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>
