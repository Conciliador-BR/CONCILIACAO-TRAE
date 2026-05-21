<template>
  <div class="max-w-3xl">
    <span class="inline-flex rounded-full border border-[#244b77]/10 bg-[#163a5a]/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#163a5a]">
      {{ eyebrow }}
    </span>
    <h2 class="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
      {{ title }}
    </h2>
    <p class="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
      {{ description }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  eyebrow: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})
</script>
