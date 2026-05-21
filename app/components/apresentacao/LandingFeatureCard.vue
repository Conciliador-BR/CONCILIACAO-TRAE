<template>
  <article class="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#244b77]/20 hover:shadow-xl">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white shadow-lg shadow-[#163a5a]/15">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="iconPath" />
      </svg>
    </div>
    <h3 class="mt-6 text-xl font-semibold text-slate-900">{{ title }}</h3>
    <p class="mt-3 text-sm leading-7 text-slate-600">{{ description }}</p>
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
  },
  iconPath: {
    type: String,
    required: true
  }
})
</script>
