<template>
  <section id="operacao" class="relative bg-white/70 py-20">
    <div class="absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(180deg,rgba(16,42,67,0.03),transparent_20%,transparent_80%,rgba(31,79,119,0.03))]" />
    <div class="mx-auto w-full max-w-7xl px-6 lg:px-8">
      <LandingSectionHeading
        eyebrow="Consultoria"
        title="Uma jornada simples para uma operação financeira robusta"
        description="Nosso diferencial está na consultoria personalizada. Cada empresa é analisada de forma única por especialistas que entendem profundamente o mercado de cartões. Cuidamos de taxas, divergências, recebimentos e todos os desafios da operação, oferecendo soluções estratégicas para gerar mais economia, controle e tranquilidade para o seu negócio."
      />

      <div class="mt-12 grid gap-6 lg:grid-cols-3">
        <LandingWorkflowStep
          v-for="step in steps"
          :key="step.step"
          :step="step.step"
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
    step: '01',
    title: 'Centralize fontes da operação',
    description: 'Unifique vendas, recebimentos, bancos e operadoras em um ecossistema com visão única e contexto por empresa.'
  },
  {
    step: '02',
    title: 'Automatize conferências críticas',
    description: 'Acompanhe divergências, quebras de expectativa, liquidações e inconsistências em um fluxo desenhado para o time financeiro.'
  },
  {
    step: '03',
    title: 'Ganhe velocidade executiva',
    description: 'Transforme dados operacionais em resposta rápida, histórico confiável e decisões sustentadas por evidência.'
  }
]
</script>
