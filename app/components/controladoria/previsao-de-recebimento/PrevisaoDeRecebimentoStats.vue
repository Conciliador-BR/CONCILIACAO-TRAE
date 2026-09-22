<template>
  <div class="mb-6 px-2 sm:px-4 lg:px-6 xl:px-8">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6 2xl:gap-6">
      <div
        v-for="(card, index) in cards"
        :key="card.key"
        class="min-h-[96px] w-full min-w-0 rounded-xl p-3.5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[120px] sm:p-5 lg:p-6"
        :class="card.className"
      >
        <div class="flex h-full items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-medium text-white/80 sm:text-sm">{{ card.label }}</p>
            <p class="text-base font-bold leading-tight sm:text-xl lg:text-2xl">{{ formatCurrency(card.value) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs sm:text-sm">{{ index < meses.length ? 'Valor previsto para recebimento' : card.helper }}</span>
            </div>
          </div>
          <svg class="h-6 w-6 shrink-0 text-white/70 sm:h-9 sm:w-9 lg:h-12 lg:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totais: {
    type: Object,
    required: true
  },
  meses: {
    type: Array,
    default: () => []
  }
})

const palette = [
  'bg-[#244b77]',
  'bg-[#1E7E34]',
  'bg-[#244b77]',
  'bg-[#1E7E34]'
]

const cards = computed(() => {
  const cardsMeses = props.meses.map((mes, index) => ({
    key: mes.key,
    label: mes.label,
    value: Number(props.totais?.[mes.key] || 0),
    className: palette[index % palette.length]
  }))

  return [
    ...cardsMeses,
    {
      key: 'valorBruto',
      label: 'Valor Bruto',
      value: Number(props.totais?.valorBruto || 0),
      helper: 'Total bruto previsto',
      className: 'bg-[#102a43]'
    },
    {
      key: 'valorLiquido',
      label: 'Valor Liquido',
      value: Number(props.totais?.valorLiquido || 0),
      helper: 'Total liquido previsto',
      className: 'bg-[#1E7E34]'
    }
  ]
})

const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>
