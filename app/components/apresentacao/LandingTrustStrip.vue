<template>
  <section class="border-y border-slate-200/80 bg-white py-4">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-8">
      <div class="grid gap-4 lg:grid-cols-3">
        <div
          v-for="item in operationalHighlights"
          :key="item.label"
          class="result-card rounded-[28px] border border-[#73c77d]/35 bg-[linear-gradient(180deg,rgba(115,199,125,0.18),rgba(126,206,137,0.12),rgba(138,215,149,0.16))] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
          @mouseenter="handleCardMouseEnter(item)"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#163a5a]">{{ item.label }}</p>
          <p class="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">{{ getDisplayValue(item) }}</p>
          <p class="mt-2 text-sm leading-7 text-slate-600">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'

const visibilidadeOperacional = ref(99)
let visibilityInterval = null
let visibilityTimeout = null

const operationalHighlights = [
  {
    label: 'Visibilidade operacional',
    value: '+99%',
    description: 'Leitura rápida dos indicadores para acompanhar desempenho, perdas e evolução da operação.'
  },
  {
    label: 'Monitoramento e auditoria',
    value: '24/7',
    description: 'Acompanhamento contínuo das movimentações com conferência ativa e resposta mais ágil.'
  },
  {
    label: 'Visão unificada da operação',
    value: '360°',
    description: 'Integração entre vendas, recebimentos, bancos e controladoria em uma visão centralizada.'
  }
]

const getDisplayValue = (item) => {
  if (item.label === 'Visibilidade operacional') {
    return `+${visibilidadeOperacional.value}%`
  }

  return item.value
}

const startVisibilityAnimation = () => {
  if (visibilityInterval) {
    window.clearInterval(visibilityInterval)
  }

  visibilidadeOperacional.value = 84
  visibilidadeOperacional.value += 1
  visibilityInterval = window.setInterval(() => {
    if (visibilidadeOperacional.value >= 99) {
      window.clearInterval(visibilityInterval)
      visibilityInterval = null
      return
    }

    visibilidadeOperacional.value += 1
  }, 45)
}

const handleCardMouseEnter = (item) => {
  if (item.label !== 'Visibilidade operacional') {
    return
  }

  startVisibilityAnimation()
}

if (import.meta.client) {
  visibilityTimeout = window.setTimeout(() => {
    startVisibilityAnimation()
  }, 350)
}

onBeforeUnmount(() => {
  if (visibilityTimeout) {
    window.clearTimeout(visibilityTimeout)
  }

  if (visibilityInterval) {
    window.clearInterval(visibilityInterval)
  }
})
</script>

<style scoped>
.result-card {
  animation: trustReveal 0.8s ease both;
}

.result-card:nth-child(2) {
  animation-delay: 0.14s;
}

.result-card:nth-child(3) {
  animation-delay: 0.28s;
}

@keyframes trustReveal {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
