<template>
  <section id="operacao" class="relative scroll-mt-36 bg-white/70 py-20">
    <div class="absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(180deg,rgba(16,42,67,0.03),transparent_20%,transparent_80%,rgba(31,79,119,0.03))]" />
    <div class="w-full px-4 sm:px-6 lg:px-8">
      <div class="workflow-heading mx-auto max-w-5xl">
        <LandingSectionHeading
          title="Negociações de Taxas, Credenciamentos, Organização nos Cartões, Especialista exclusivo"
        />
      </div>

      <div class="mt-20 grid gap-6 lg:grid-cols-3">
        <LandingWorkflowStep
          v-for="step in steps"
          :key="step.label"
          :value="step.value"
          :label="step.label"
          :tone="step.tone"
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
    value: '+1mi',
    label: 'Recuperados',
    tone: 'slate'
  },
  {
    value: '+300',
    label: 'Credenciamentos',
    tone: 'lime'
  },
  {
    value: '100 mil',
    label: 'Em taxas reduzidas',
    tone: 'teal'
  }
]
</script>

<style scoped>
.workflow-heading {
  text-align: center;
}

.workflow-heading :deep(.max-w-3xl) {
  display: grid;
  justify-items: center;
}

.workflow-heading :deep(h2),
.workflow-heading :deep(p) {
  text-align: center;
}

.workflow-heading :deep(h2) {
  margin-inline: auto;
}

.workflow-heading :deep(h2) {
  max-width: 56rem;
  text-wrap: balance;
}
</style>
