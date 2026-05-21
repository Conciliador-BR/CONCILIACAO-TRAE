<template>
  <NuxtLink
    :to="to"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300',
      variant === 'secondary'
        ? 'border border-[#244b77]/20 bg-white text-[#163a5a] shadow-sm hover:border-[#244b77]/40 hover:shadow-md'
        : 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white shadow-lg shadow-[#163a5a]/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#163a5a]/30'
    ]"
  >
    <slot />
    <svg v-if="showArrow" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0-5 5m5-5H6" />
    </svg>
  </NuxtLink>
</template>

<script setup>
defineProps({
  to: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'primary'
  },
  showArrow: {
    type: Boolean,
    default: true
  }
})
</script>
