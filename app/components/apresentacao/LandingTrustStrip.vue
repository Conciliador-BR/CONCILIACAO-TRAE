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
const operationalHighlights = [
  {
    label: 'Empresas atendidas',
    value: 'Quase 60',
    description: 'Supermercados e grupos que ja confiaram na Economic Card para conferir cartao, voucher, banco e taxas.'
  },
  {
    label: 'Origem dos clientes',
    value: 'Indicacao',
    description: 'A maior parte dos novos clientes chega por recomendacao de quem ja conhece nosso trabalho na pratica.'
  },
  {
    label: 'Consultoria especializada',
    value: 'Especialistas',
    description: 'Voce nao recebe so um sistema: recebe acompanhamento de quem entende conciliacao e rotina financeira de supermercado.'
  }
]

const getDisplayValue = (item) => item.value
const handleCardMouseEnter = () => {}
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
