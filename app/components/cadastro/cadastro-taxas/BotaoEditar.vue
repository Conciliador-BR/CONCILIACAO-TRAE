<template>
  <button
    @click="$emit('click')"
    class="inline-flex items-center justify-center rounded-lg border border-[#CFE0F2] bg-[#F7FAFC] px-2.5 py-1.5 text-[11px] font-semibold text-[#1f4f77] transition-colors hover:border-[#B7CCE2] hover:bg-white hover:text-[#102A43]"
  >
    Editar
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>
