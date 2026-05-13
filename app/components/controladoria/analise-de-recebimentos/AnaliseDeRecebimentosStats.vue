<template>
  <div class="rounded-2xl border border-gray-200/60 bg-white/70 p-6 shadow-xl backdrop-blur">
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
      <article
        v-for="card in cardsPrincipais"
        :key="card.id"
        :class="[card.destaque, 'rounded-xl border p-5 text-white shadow-md transition hover:shadow-lg']"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-white/80">{{ card.titulo }}</p>
            <p class="mt-2 text-2xl font-bold">{{ formatValue(card.valor, card.tipo) }}</p>
            <p v-if="card.legenda" class="mt-1 text-xs text-white/80">{{ card.legenda }}</p>
          </div>
          <span class="rounded-lg bg-white/15 px-2 py-1 text-xs font-semibold text-white/90">{{ card.tag || 'Resumo' }}</span>
        </div>
      </article>
    </div>

    <div v-if="cardsSecundarios.length > 0" class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
      <article
        v-for="card in cardsSecundarios"
        :key="card.id"
        class="rounded-xl border border-[#DCE7F3] bg-[#F7FAFC] p-4 shadow-sm"
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
