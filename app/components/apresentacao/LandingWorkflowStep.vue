<template>
  <article class="relative rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
    <div class="absolute right-5 top-5 text-5xl font-bold tracking-tight text-[#73c77d]/45">{{ step }}</div>
    <div class="relative">
      <div class="inline-flex rounded-full bg-[#163a5a]/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#163a5a]">
        Etapa {{ step }}
      </div>
      <h3 class="mt-5 text-xl font-semibold text-slate-900">{{ title }}</h3>
      <p class="mt-3 text-sm leading-7 text-slate-600">{{ description }}</p>
    </div>
  </article>
</template>

<script setup>
defineProps({
  step: {
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
