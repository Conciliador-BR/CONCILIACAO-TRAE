<template>
  <section id="operacao" class="bg-white/70 py-20">
    <div class="mx-auto w-full max-w-7xl px-6 lg:px-8">
      <LandingSectionHeading
        eyebrow="Operação"
        title="Uma jornada simples para uma operação financeira robusta"
        description="Assim como nas melhores plataformas enterprise, a página apresenta um fluxo objetivo: conectar dados, monitorar exceções e executar conciliações com ritmo previsível."
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
