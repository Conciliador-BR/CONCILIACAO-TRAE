<template>
  <section id="operacao" class="relative scroll-mt-36 bg-white/70 py-20">
    <div class="absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(180deg,rgba(16,42,67,0.03),transparent_20%,transparent_80%,rgba(31,79,119,0.03))]" />
    <div class="w-full px-4 sm:px-6 lg:px-8">
      <LandingSectionHeading
        eyebrow="Consultoria"
        title="Negociações de Taxas, Credenciamentos, Organização nos Cartões, Especialista exclusivo"
        description="Hoje muitos supermercados ainda conferem cartão, voucher e banco no braço. Com a Economic Card, seu financeiro ganha sistema e consultoria personalizada para encontrar diferenças, cobrar o que falta e economizar tempo."
      />

      <div class="mt-20 grid gap-6 lg:grid-cols-3">
        <LandingWorkflowStep
          v-for="step in steps"
          :key="step.title"
          :title="step.title"
          :description="step.description"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingSectionHeading from './LandingSectionHeading.vue'
import LandingWorkflowStep from './LandingWorkflowStep.vue'

const steps = [
  {
    title: 'R$ 1 milhão Recuperados',
    description: ''
  },
  {
    title: '+ 300 Credenciamentos',
    description: ''
  },
  {
    title: 'R$ 100 mil de Taxas reduzidas',
    description: ''
  }
]
</script>
