<template>
  <section id="solucoes" class="relative">
    <div class="absolute inset-x-0 top-10 -z-10 h-80 bg-[radial-gradient(circle_at_top,_rgba(16,42,67,0.08),_transparent_60%)]" />
    <div class="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
      <LandingSectionHeading
        eyebrow="Quem Somos"
        title="Uma parceira estratégica feita para facilitar a gestão dos cartões, identificar oportunidades de economia e garantir mais controle financeiro."
      />

      <div class="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <LandingFeatureCard
          v-for="(feature, index) in features"
          :key="feature.title"
          :title="feature.title"
          :description="feature.description"
          :icon-path="feature.iconPath"
          :delay-ms="index * 120"
        />
      </div>
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
    title: 'Controladoria Personalizada',
    description: 'Acompanhamento sob medida da sua operacao, com analise individual das rotinas financeiras, divergencias e oportunidades de melhoria.',
    iconPath: 'M9 17v-6m4 6V7m4 10V4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H9L7 7H5a2 2 0 00-2 2v8a2 2 0 002 2z'
  }
]
</script>
