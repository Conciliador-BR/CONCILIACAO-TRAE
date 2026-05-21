<template>
  <NuxtLink
    :to="to"
    :class="[
      'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300',
      variant === 'secondary'
        ? 'border border-[#244b77]/20 bg-white text-[#163a5a] shadow-sm hover:-translate-y-0.5 hover:border-[#244b77]/40 hover:shadow-md'
        : 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white shadow-lg shadow-[#163a5a]/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#163a5a]/30'
    ]"
  >
    <span
      v-if="variant !== 'secondary'"
      class="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/15 blur-md transition-transform duration-700 group-hover:translate-x-[420%]"
    />
    <span class="relative z-10"><slot /></span>
    <svg v-if="showArrow" class="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
