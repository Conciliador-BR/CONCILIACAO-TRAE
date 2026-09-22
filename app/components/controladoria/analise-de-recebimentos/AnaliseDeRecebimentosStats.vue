<template>
  <div class="analise-recebimentos-print-stats rounded-2xl border border-gray-200/60 bg-white/70 p-6 shadow-xl backdrop-blur">
    <div class="analise-recebimentos-print-primary grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      <article
        v-for="card in cardsPrincipais"
        :key="card.id"
        :class="[card.destaque, 'w-full min-w-0 rounded-xl border p-3.5 text-white shadow-md transition hover:shadow-lg sm:p-5']"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-white/80 sm:text-sm">{{ card.titulo }}</p>
            <p class="mt-2 text-lg font-bold leading-tight sm:text-2xl">{{ formatValue(card.valor, card.tipo) }}</p>
            <p v-if="card.legenda" class="mt-1 text-xs text-white/80">{{ card.legenda }}</p>
          </div>
          <span class="rounded-lg bg-white/15 px-2 py-1 text-xs font-semibold text-white/90">{{ card.tag || 'Resumo' }}</span>
        </div>
      </article>
    </div>

    <div v-if="cardsSecundarios.length > 0" class="analise-recebimentos-print-secondary mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      <article
        v-for="card in cardsSecundarios"
        :key="card.id"
        class="w-full min-w-0 rounded-xl border border-[#DCE7F3] bg-[#F7FAFC] p-3.5 shadow-sm sm:p-4"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-[#486581]">{{ card.titulo }}</p>
            <p class="mt-1 text-xl font-bold text-[#102A43]">{{ formatValue(card.valor, card.tipo) }}</p>
          </div>
          <p class="text-right text-xs text-[#627D98]">{{ card.legenda || 'Indicador' }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cards: {
    type: Array,
    default: () => []
  }
})

const cardsPrincipais = computed(() => props.cards.filter(card => card.secondary !== true))
const cardsSecundarios = computed(() => props.cards.filter(card => card.secondary === true))

const formatValue = (value, type) => {
  if (type === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value || 0))
  }

  return new Intl.NumberFormat('pt-BR').format(Number(value || 0))
}
</script>
