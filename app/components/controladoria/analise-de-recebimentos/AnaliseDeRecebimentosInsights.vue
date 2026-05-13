<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
    <article
      v-for="(item, index) in items"
      :key="item.titulo"
      class="rounded-xl border p-5 shadow-sm"
      :class="cards[index % cards.length]"
    >
      <div class="flex items-center gap-3">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-sm font-bold text-slate-700 shadow-sm">
          {{ index + 1 }}
        </span>
        <p class="text-sm font-semibold text-slate-900">{{ item.titulo }}</p>
      </div>
      <p class="mt-3 text-sm leading-6 text-slate-700">{{ item.descricao }}</p>
    </article>
  </div>
</template>

<script setup>
const cards = [
  'border-cyan-100 bg-cyan-50/70',
  'border-blue-100 bg-blue-50/70',
  'border-amber-100 bg-amber-50/70'
]

defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>
