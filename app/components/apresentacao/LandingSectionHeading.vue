<template>
  <div class="max-w-3xl">
    <span
      v-if="eyebrow"
      class="inline-flex rounded-full border border-[#244b77]/10 bg-[#163a5a]/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#163a5a]"
    >
      {{ eyebrow }}
    </span>
    <h2 class="font-landing-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl" :class="{ 'mt-4': eyebrow }">
      {{ title }}
    </h2>
    <p v-if="description" class="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
      {{ description }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})
</script>
