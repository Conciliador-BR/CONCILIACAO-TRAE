<template>
  <section class="w-full rounded-2xl border border-gray-200/60 bg-white/70 p-6 shadow-xl backdrop-blur">
    <div class="flex flex-col gap-2">
      <h3 class="text-lg font-semibold text-gray-900">{{ titulo }}</h3>
      <p v-if="subtitulo" class="text-sm text-gray-600">{{ subtitulo }}</p>
      <p class="text-sm font-medium text-[#244b77]">
        {{ totalLabel }}: {{ formatCurrency(total) }}
      </p>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <article
        v-for="item in normalizedItems"
        :key="item.id"
        class="rounded-xl border border-gray-200 bg-gray-50/80 p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-gray-900">{{ item.label }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ item.helperText }}</p>
          </div>
          <span
            class="inline-flex min-w-[4.5rem] justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            :style="{ backgroundColor: item.color }"
          >
            {{ formatPercent(item.percentual) }}
          </span>
        </div>

        <p class="mt-4 text-2xl font-bold text-gray-900">{{ formatCurrency(item.valor) }}</p>

        <div class="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: `${Math.min(item.percentual, 100)}%`, backgroundColor: item.color }"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  titulo: {
    type: String,
    default: 'Share'
  },
  subtitulo: {
    type: String,
    default: ''
  },
  total: {
    type: Number,
    default: 0
  },
  totalLabel: {
    type: String,
    default: 'Total base'
  },
  items: {
    type: Array,
    default: () => []
  }
})

const palette = ['#244b77', '#1E7E34', '#B56A00', '#7c3aed', '#0891b2']

const normalizedItems = computed(() => {
  return (props.items || []).map((item, index) => ({
    id: item.id || `share-${index}`,
    label: item.label || 'Item',
    valor: Number(item.valor || 0),
    percentual: Number(item.percentual || 0),
    helperText: item.helperText || 'Participação no total',
    color: item.color || palette[index % palette.length]
  }))
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

const formatPercent = (value) => {
  return `${Number(value || 0).toFixed(2)}%`
}
</script>
