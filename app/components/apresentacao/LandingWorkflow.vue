<template>
  <section
    id="operacao"
    ref="workflowSectionRef"
    class="workflow-section relative scroll-mt-36 overflow-hidden py-24 sm:py-28"
  >
    <div class="workflow-section__wave-shell" aria-hidden="true">
      <canvas ref="waveCanvasRef" class="workflow-section__wave" />
      <div class="workflow-section__wave-fade" />
    </div>
    <div class="workflow-section__grid" aria-hidden="true" />
    <div class="workflow-section__glow workflow-section__glow--left" aria-hidden="true" />
    <div class="workflow-section__glow workflow-section__glow--right" aria-hidden="true" />

    <div class="relative mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-8">
      <div class="workflow-hero">
        <div class="workflow-copy">
          <div class="workflow-copy__eyebrow">Nosso grande diferencial</div>
          <h2 class="workflow-copy__title font-landing-display">
            Negociações de taxas, credenciamentos, organização nos cartões e acompanhamento de especialista.
          </h2>
          <p class="workflow-copy__description">
            Enquanto o time da loja cuida da operação, a Economic Card entra no detalhe financeiro, encontra o que
            ficou para trás e ajuda o supermercado a recuperar margem com método e acompanhamento humano.
          </p>
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

const workflowSectionRef = ref(null)
const waveCanvasRef = ref(null)

let waveAnimationFrame = 0
let waveResizeObserver = null
let waveMotionQuery = null
let waveRestartHandler = null

const wavePointer = {
  x: 0,
  y: 0,
  active: false
}

const syncWaveCanvasSize = () => {
  const section = workflowSectionRef.value
  const canvas = waveCanvasRef.value

  if (!section || !canvas) {
    return null
  }

  const rect = section.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))
  const ratio = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.floor(width * ratio)
  canvas.height = Math.floor(height * ratio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  return { context, width, height }
}

const drawWaveFrame = (time) => {
  const synced = syncWaveCanvasSize()

  if (!synced) {
    return
  }

  const { context, width, height } = synced
  const reducedMotion = waveMotionQuery?.matches ?? false
  const phase = time * 0.0014
  const pointerX = wavePointer.active ? wavePointer.x : width * 0.5
  const pointerY = wavePointer.active ? wavePointer.y : height * 0.52

  context.clearRect(0, 0, width, height)
  context.fillStyle = 'rgba(2, 10, 18, 0.14)'
  context.fillRect(0, 0, width, height)

  const lineCount = Math.max(88, Math.min(180, Math.floor((width + height) / 11)))
  const segmentCount = Math.max(72, Math.min(160, Math.floor(width / 10)))
  const verticalSpread = height * 0.24

  for (let index = 0; index < lineCount; index += 1) {
    const progress = lineCount === 1 ? 0.5 : index / (lineCount - 1)
    const centered = (progress - 0.5) * 2
    const depth = 1 - Math.min(1, Math.abs(centered) * 1.18)
    const baseY = height * 0.54 + centered * verticalSpread
    const strokeAlpha = 0.07 + (depth * 0.34)

    context.beginPath()
    context.lineWidth = 0.95 + (depth * 0.46)
    context.strokeStyle = `rgba(32, 255, 184, ${strokeAlpha})`
    context.shadowBlur = 18 + (depth * 14)
    context.shadowColor = `rgba(32, 255, 184, ${0.12 + (depth * 0.2)})`

    for (let segment = 0; segment <= segmentCount; segment += 1) {
      const x = (segment / segmentCount) * width
      const distToPointer = Math.hypot(x - pointerX, baseY - pointerY)
      const pointerEffect = Math.max(0, 1 - (distToPointer / 320))
      const envelope = Math.sin((segment / segmentCount) * Math.PI) ** 0.88
      const animatedPhase = reducedMotion ? 1.15 : phase
      const primary = Math.sin((segment * 0.16) + animatedPhase + (index * 0.19)) * (9 + (depth * 12))
      const secondary = Math.cos((segment * 0.08) - (animatedPhase * 1.35) + (index * 0.24)) * (6 + (depth * 9))
      const pulse = Math.sin((segment * 0.048) + (animatedPhase * 1.7)) * Math.cos((index * 0.28) + animatedPhase)
      const pointerLift = pulse * (10 + (pointerEffect * 34))
      const y = baseY + ((primary + secondary + pointerLift) * envelope)

      if (segment === 0) {
        context.moveTo(x, y)
      }
      else {
        context.lineTo(x, y)
      }
    }

    context.stroke()
  }

  context.shadowBlur = 0

  if (!reducedMotion) {
    waveAnimationFrame = window.requestAnimationFrame(drawWaveFrame)
  }
}

const handleWavePointerMove = (event) => {
  const section = workflowSectionRef.value

  if (!section) {
    return
  }

  const rect = section.getBoundingClientRect()
  wavePointer.x = event.clientX - rect.left
  wavePointer.y = event.clientY - rect.top
  wavePointer.active = true
}

const handleWavePointerLeave = () => {
  wavePointer.active = false
}

onMounted(() => {
  const section = workflowSectionRef.value

  if (!section || !waveCanvasRef.value || typeof window === 'undefined') {
    return
  }

  waveMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  waveRestartHandler = () => {
    window.cancelAnimationFrame(waveAnimationFrame)
    drawWaveFrame(0)
  }

  if (typeof waveMotionQuery.addEventListener === 'function') {
    waveMotionQuery.addEventListener('change', waveRestartHandler)
  }

  if (typeof ResizeObserver !== 'undefined') {
    waveResizeObserver = new ResizeObserver(() => {
      waveRestartHandler?.()
    })
    waveResizeObserver.observe(section)
  }

  section.addEventListener('pointermove', handleWavePointerMove)
  section.addEventListener('pointerleave', handleWavePointerLeave)

  drawWaveFrame(0)
})

onBeforeUnmount(() => {
  const section = workflowSectionRef.value

  window.cancelAnimationFrame(waveAnimationFrame)

  if (section) {
    section.removeEventListener('pointermove', handleWavePointerMove)
    section.removeEventListener('pointerleave', handleWavePointerLeave)
  }

  if (waveResizeObserver) {
    waveResizeObserver.disconnect()
    waveResizeObserver = null
  }

  if (waveMotionQuery && waveRestartHandler && typeof waveMotionQuery.removeEventListener === 'function') {
    waveMotionQuery.removeEventListener('change', waveRestartHandler)
  }

  waveRestartHandler = null
})

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

.workflow-section__wave-shell {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.workflow-section__wave {
  width: 100%;
  height: 100%;
  opacity: 0.96;
}

.workflow-section__wave-fade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(4, 11, 20, 0.48) 0%, rgba(4, 11, 20, 0.1) 24%, rgba(4, 11, 20, 0.1) 76%, rgba(4, 11, 20, 0.58) 100%),
    radial-gradient(circle at 50% 52%, rgba(26, 92, 64, 0.12), transparent 32%);
  pointer-events: none;
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

.workflow-copy__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(7, 18, 31, 0.62);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(224, 242, 254, 0.92);
}

.workflow-copy__title {
  position: relative;
  z-index: 1;
  margin-top: 1.2rem;
  max-width: 16ch;
  font-size: clamp(2.35rem, 4vw, 4.45rem);
  line-height: 0.94;
  letter-spacing: -0.045em;
  color: #f8fbff;
  text-wrap: balance;
}

.workflow-copy__description {
  position: relative;
  z-index: 1;
  margin-top: 1.3rem;
  max-width: 45rem;
  font-size: 1.05rem;
  line-height: 1.75;
  color: rgba(221, 232, 246, 0.82);
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

@media (prefers-reduced-motion: reduce) {
  .workflow-section__wave {
    opacity: 0.75;
  }
}
</style>
