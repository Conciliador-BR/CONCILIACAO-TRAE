<template>
  <div class="mb-8 px-2 sm:px-4 lg:px-6 xl:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
      <div
        v-for="(card, index) in cards"
        :key="card.key"
        class="text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]"
        :class="card.className"
      >
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-white/80 text-xs sm:text-sm font-medium">{{ card.label }}</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(card.value) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs sm:text-sm">{{ index < meses.length ? 'Valor previsto para recebimento' : card.helper }}</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
