<template>
  <section
    id="operacao"
    class="workflow-section relative scroll-mt-36 overflow-hidden py-24 sm:py-28"
  >
    <div class="workflow-section__grid" aria-hidden="true" />
    <div class="workflow-section__glow workflow-section__glow--left" aria-hidden="true" />
    <div class="workflow-section__glow workflow-section__glow--right" aria-hidden="true" />

    <div class="relative mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-8">
      <div class="workflow-hero">
        <div class="workflow-copy">
          <h2 class="workflow-copy__title font-landing-display">
            Negociações de taxas, credenciamentos, organização nos cartões e acompanhamento de especialista.
          </h2>
        </div>
      </div>

      <div class="workflow-metrics">
        <LandingWorkflowStep
          v-for="step in steps"
          :key="step.label"
          :value="step.value"
          :label="step.label"
          :description="step.description"
          :tone="step.tone"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingWorkflowStep from './LandingWorkflowStep.vue'

const steps = [
  {
    value: '+1mi',
    label: 'recuperados',
    description: 'em divergências, valores não repassados e ajustes que passariam despercebidos.',
    tone: 'ocean'
  },
  {
    value: '+300',
    label: 'credenciamentos',
    description: 'reestruturados para dar clareza ao fluxo, reduzir ruído e ganhar produtividade.',
    tone: 'emerald'
  },
  {
    value: '100 mil',
    label: 'em taxas reduzidas',
    description: 'com acompanhamento estratégico para preservar margem e sustentar economia recorrente.',
    tone: 'violet'
  }
]
</script>

<style scoped>
.workflow-section {
  background:
    radial-gradient(circle at 18% 18%, rgba(16, 185, 129, 0.2), transparent 22%),
    radial-gradient(circle at 82% 10%, rgba(14, 165, 233, 0.12), transparent 24%),
    linear-gradient(180deg, #06101c 0%, #071623 40%, #081a2c 100%);
}

.workflow-section__grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.12;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 90px 90px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.96), transparent 88%);
}

.workflow-section__glow {
  position: absolute;
  z-index: 1;
  border-radius: 9999px;
  filter: blur(120px);
  pointer-events: none;
}

.workflow-section__glow--left {
  left: -12rem;
  top: 8rem;
  width: 26rem;
  height: 26rem;
  background: rgba(15, 160, 206, 0.22);
}

.workflow-section__glow--right {
  right: -8rem;
  bottom: 4rem;
  width: 24rem;
  height: 24rem;
  background: rgba(34, 197, 94, 0.18);
}

.workflow-hero {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 1.5rem;
  align-items: stretch;
}

.workflow-copy {
  position: relative;
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(7, 18, 31, 0.88), rgba(4, 11, 21, 0.94));
  box-shadow: 0 30px 90px rgba(2, 6, 23, 0.38);
  backdrop-filter: blur(18px);
}

.workflow-copy {
  padding: 2rem 1.35rem 1.7rem;
}

.workflow-copy::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 28%),
    linear-gradient(135deg, rgba(15, 160, 206, 0.08), transparent 38%, rgba(115, 199, 125, 0.08) 100%);
  pointer-events: none;
}

.workflow-copy__title {
  position: relative;
  z-index: 1;
  max-width: 16ch;
  font-size: clamp(2.35rem, 4vw, 4.45rem);
  line-height: 0.94;
  letter-spacing: -0.045em;
  color: #f8fbff;
  text-wrap: balance;
}

.workflow-metrics {
  position: relative;
  z-index: 2;
  margin-top: 1.5rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 960px) {
  .workflow-copy {
    padding: 2.25rem 2rem 1.9rem;
  }

  .workflow-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .workflow-copy {
    padding: 1.6rem 1.1rem 1.4rem;
  }
}

</style>
