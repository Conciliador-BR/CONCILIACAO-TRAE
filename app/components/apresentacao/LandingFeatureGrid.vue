<template>
  <section id="solucoes" class="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
    <LandingSectionHeading
      eyebrow="Soluções"
      title="Uma plataforma desenhada para operações financeiras exigentes"
      description="Inspirada no padrão visual de plataformas enterprise de conciliação, a experiência combina clareza executiva, profundidade operacional e leitura rápida dos pontos críticos da sua operação."
    />

    <div class="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
      <LandingFeatureCard
        v-for="feature in features"
        :key="feature.title"
        :title="feature.title"
        :description="feature.description"
        :icon-path="feature.iconPath"
      />
    </div>
  </section>
</template>

<script setup>
import LandingFeatureCard from './LandingFeatureCard.vue'
import LandingSectionHeading from './LandingSectionHeading.vue'

const features = [
  {
    title: 'Conciliação de Vendas',
    description: 'Centralize cartões, vouchers e adquirentes com regras operacionais que tornam exceções visíveis no mesmo fluxo de conferência.',
    iconPath: 'M3 10h18M7 15h1m4 0h5M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z'
  },
  {
    title: 'Recebimentos e Pagamentos',
    description: 'Cruze previsões, liquidações e diferenças com visão consolidada para acelerar conferência, cobrança e fechamento.',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V5m0 11v3m-7-7h14'
  },
  {
    title: 'Extratos Bancários',
    description: 'Conecte depósitos e extratos com rastreabilidade completa, destacando divergências e melhorando o fluxo de auditoria.',
    iconPath: 'M4 6h16M4 10h16M6 14h4m4 0h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z'
  },
  {
    title: 'Governança e Controle',
    description: 'Painéis executivos, histórico de eventos e visões gerenciais para sustentar decisões rápidas com segurança operacional.',
    iconPath: 'M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z'
  }
]
</script>
