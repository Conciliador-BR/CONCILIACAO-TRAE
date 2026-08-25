<template>
  <article class="relative overflow-hidden rounded-[32px] border border-[#244b77]/10 bg-gradient-to-br from-white via-slate-50 to-[#f3f8fc] p-7 shadow-[0_18px_40px_rgba(22,58,90,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_rgba(22,58,90,0.14)]">
    <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#163a5a]" />
    <div class="relative">
      <h3 class="text-[1.9rem] font-extrabold leading-tight tracking-tight text-[#163a5a] sm:text-[2.15rem]">{{ title }}</h3>
      <p v-if="description" class="mt-3 text-sm leading-7 text-slate-600">{{ description }}</p>
    </div>
  </article>
</template>

<script setup>
defineProps({
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
