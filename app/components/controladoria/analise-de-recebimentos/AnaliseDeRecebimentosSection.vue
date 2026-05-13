<template>
  <section class="rounded-2xl border border-gray-200/60 bg-white/70 p-6 shadow-xl backdrop-blur">
    <div class="mb-5 flex items-start justify-between gap-4 border-b border-gray-200/70 pb-5">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ titulo }}</h2>
        <p v-if="subtitulo" class="mt-1 text-sm text-gray-500">{{ subtitulo }}</p>
      </div>
      <slot name="acao" />
    </div>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  titulo: {
    type: String,
    required: true
  },
  subtitulo: {
    type: String,
    default: ''
  }
})
</script>
