<template>
  <section class="relative overflow-hidden bg-[#07121f]">
    <div class="hero-grid absolute inset-0 opacity-30" />
    <div class="hero-aura hero-aura--left" />
    <div class="hero-aura hero-aura--right" />

    <div class="relative w-full">
      <div class="hero-shell">
        <div ref="heroStageRef" class="hero-stage">
          <div class="hero-stage__noise" />
          <div class="hero-stage__grid" />
          <div class="hero-stage__glow hero-stage__glow--one" />
          <div class="hero-stage__glow hero-stage__glow--two" />
          <div class="hero-rain" aria-hidden="true">
            <span
              v-for="drop in rainDrops"
              :key="`drop-${drop.id}`"
              class="hero-rain__drop"
              :style="drop.dropStyle"
            />
            <span
              v-for="drop in rainDrops"
              :key="`splash-${drop.id}`"
              class="hero-rain__splash"
              :style="drop.splashStyle"
            />
          </div>

          <div class="hero-copy">
            <h1 class="hero-title">
              Seu supermercado vende no cartão, mas recebe o valor certo?
            </h1>
          </div>

          <div class="hero-surface" :style="heroSurfaceStyle">
            <div class="hero-surface__frame">
              <div class="hero-surface__ambient hero-surface__ambient--left" aria-hidden="true" />
              <div class="hero-surface__ambient hero-surface__ambient--right" aria-hidden="true" />

              <div class="hero-dashboard" :style="heroDashboardStyle">
                <div class="hero-dashboard__header">
                  <div class="hero-dashboard__brand">
                    <div class="hero-dashboard__brand-mark">AV</div>
                    <div>
                      <div class="hero-dashboard__title">Análise de Vendas</div>
                      <div class="hero-dashboard__subtitle">Indicadores financeiros e análise por bandeira</div>
                    </div>
                  </div>

                  <div class="hero-dashboard__header-side">
                    <div class="hero-dashboard__meta">
                      <div class="hero-dashboard__meta-block">
                        <span>Período</span>
                        <strong>junho de 2026</strong>
                      </div>
                      <div class="hero-dashboard__meta-block">
                        <span>Bandeiras</span>
                        <strong>10</strong>
                      </div>
                    </div>

                    <div class="hero-dashboard__actions">
                      <button type="button" class="hero-dashboard__action hero-dashboard__action--ghost">Exportar Excel</button>
                      <button type="button" class="hero-dashboard__action hero-dashboard__action--primary">Exportar PDF</button>
                    </div>
                  </div>
                </div>

                <div class="hero-dashboard__highlights">
                  <div
                    v-for="card in heroHighlightCards"
                    :key="card.title"
                    class="hero-dashboard__highlight"
                    :class="`hero-dashboard__highlight--${card.tone}`"
                  >
                    <div class="hero-dashboard__card-title">{{ card.title }}</div>
                    <div class="hero-dashboard__card-value">{{ card.value }}</div>
                    <div class="hero-dashboard__card-caption">{{ card.caption }}</div>
                  </div>
                </div>

                <div class="hero-dashboard__metrics">
                  <div
                    v-for="metric in heroMetricCards"
                    :key="metric.title"
                    class="hero-dashboard__metric"
                    :class="`hero-dashboard__metric--${metric.tone}`"
                  >
                    <div class="hero-dashboard__metric-title">{{ metric.title }}</div>
                    <div class="hero-dashboard__metric-value">{{ metric.value }}</div>
                    <div class="hero-dashboard__metric-caption">{{ metric.caption }}</div>
                  </div>
                </div>

                <div class="hero-dashboard__summary">
                  <div
                    v-for="item in heroSummaryCards"
                    :key="item.title"
                    class="hero-dashboard__summary-card"
                  >
                    <div class="hero-dashboard__summary-title">{{ item.title }}</div>
                    <div class="hero-dashboard__summary-value">{{ item.value }}</div>
                    <div class="hero-dashboard__summary-caption">{{ item.caption }}</div>
                  </div>
                </div>

                <div class="hero-dashboard__charts">
                  <div class="hero-chart-panel">
                    <div class="hero-chart-panel__header">
                      <div class="hero-chart-panel__title">Receita por Bandeira</div>
                      <div class="hero-chart-panel__tabs">
                        <span class="is-active">Barras</span>
                        <span>Linhas</span>
                        <span>Pizza</span>
                      </div>
                    </div>

                    <div class="hero-bar-chart">
                      <div class="hero-bar-chart__scale">
                        <span>R$ 200.000</span>
                        <span>R$ 150.000</span>
                        <span>R$ 100.000</span>
                        <span>R$ 50.000</span>
                        <span>R$ 0</span>
                      </div>

                      <div class="hero-bar-chart__plot">
                        <div
                          v-for="item in heroBarGroups"
                          :key="item.label"
                          class="hero-bar-chart__group"
                        >
                          <div class="hero-bar-chart__bars">
                            <span class="hero-bar-chart__bar hero-bar-chart__bar--bruto" :style="{ height: item.bruto }" />
                            <span class="hero-bar-chart__bar hero-bar-chart__bar--liquido" :style="{ height: item.liquido }" />
                            <span class="hero-bar-chart__bar hero-bar-chart__bar--taxa" :style="{ height: item.taxa }" />
                          </div>
                          <div class="hero-bar-chart__label">{{ item.label }}</div>
                        </div>
                      </div>
                    </div>

                    <div class="hero-chart-panel__legend">
                      <span><i class="legend-dot legend-dot--bruto" /> Receita Bruta</span>
                      <span><i class="legend-dot legend-dot--liquido" /> Receita Líquida</span>
                      <span><i class="legend-dot legend-dot--taxa" /> Custo de Taxas</span>
                    </div>
                  </div>

                  <div class="hero-chart-panel">
                    <div class="hero-chart-panel__header">
                      <div class="hero-chart-panel__title">Custo de Taxas por Bandeira</div>
                      <div class="hero-chart-panel__tabs">
                        <span>Barras</span>
                        <span>Linhas</span>
                        <span class="is-active">Pizza</span>
                      </div>
                    </div>

                    <div class="hero-donut-layout">
                      <div class="hero-donut">
                        <div class="hero-donut__ring" />
                      </div>

                      <div class="hero-donut-list">
                        <div class="hero-donut-list__header">
                          <span>Valores</span>
                        </div>
                        <div
                          v-for="item in heroDonutLegend"
                          :key="item.label"
                          class="hero-donut-list__item"
                        >
                          <span class="hero-donut-list__label">
                            <i class="legend-dot" :class="`legend-dot--${item.tone}`" />
                            {{ item.label }}
                          </span>
                          <strong>{{ item.value }}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="hero-chart-panel__legend hero-chart-panel__legend--wrap">
                      <span
                        v-for="item in heroDonutLegend"
                        :key="`${item.label}-legend`"
                      >
                        <i class="legend-dot" :class="`legend-dot--${item.tone}`" />
                        {{ item.label }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const heroStageRef = ref(null)
const heroSurfaceOffset = ref(0)
const heroDashboardOffset = ref(0)
const heroDashboardScale = ref(0.82)

let parallaxRaf = 0
let reduceMotionQuery

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getParallaxConfig = () => {
  if (window.innerWidth < 640) {
    return {
      surfaceTravel: 24,
      dashboardTravel: 150,
      baseScale: 0.7,
      scaleLift: 0.02
    }
  }

  if (window.innerWidth < 1024) {
    return {
      surfaceTravel: 34,
      dashboardTravel: 190,
      baseScale: 0.78,
      scaleLift: 0.025
    }
  }

  return {
    surfaceTravel: 44,
    dashboardTravel: 250,
    baseScale: 0.82,
    scaleLift: 0.03
  }
}

const updateHeroParallax = () => {
  if (!heroStageRef.value) {
    return
  }

  if (reduceMotionQuery?.matches) {
    const fallbackConfig = getParallaxConfig()
    heroSurfaceOffset.value = 0
    heroDashboardOffset.value = 0
    heroDashboardScale.value = fallbackConfig.baseScale
    return
  }

  const rect = heroStageRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight || 1
  const progress = clamp(
    (viewportHeight - rect.top) / (rect.height + (viewportHeight * 0.15)),
    0,
    1
  )
  const eased = 1 - ((1 - progress) ** 1.85)
  const config = getParallaxConfig()

  heroSurfaceOffset.value = eased * config.surfaceTravel
  heroDashboardOffset.value = -eased * config.dashboardTravel
  heroDashboardScale.value = config.baseScale + (eased * config.scaleLift)
}

const requestParallaxUpdate = () => {
  if (parallaxRaf) {
    return
  }

  parallaxRaf = window.requestAnimationFrame(() => {
    parallaxRaf = 0
    updateHeroParallax()
  })
}

onMounted(() => {
  reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateHeroParallax()
  window.addEventListener('scroll', requestParallaxUpdate, { passive: true })
  window.addEventListener('resize', requestParallaxUpdate, { passive: true })
  reduceMotionQuery.addEventListener?.('change', requestParallaxUpdate)
})

onBeforeUnmount(() => {
  if (parallaxRaf) {
    window.cancelAnimationFrame(parallaxRaf)
  }

  window.removeEventListener('scroll', requestParallaxUpdate)
  window.removeEventListener('resize', requestParallaxUpdate)
  reduceMotionQuery?.removeEventListener?.('change', requestParallaxUpdate)
})

const heroSurfaceStyle = computed(() => ({
  '--surface-parallax-y': `${heroSurfaceOffset.value.toFixed(1)}px`
}))

const heroDashboardStyle = computed(() => ({
  '--dashboard-reveal-y': `${heroDashboardOffset.value.toFixed(1)}px`,
  '--dashboard-scale': heroDashboardScale.value.toFixed(3)
}))

const rainDrops = [
  { id: 1, left: '8%', delay: 0.15, duration: 2.8, height: '6.8rem', drift: '-0.8rem', travel: '31rem' },
  { id: 2, left: '16%', delay: 1.1, duration: 3.2, height: '7.6rem', drift: '-0.55rem', travel: '33rem' },
  { id: 3, left: '23%', delay: 0.7, duration: 2.95, height: '6.2rem', drift: '-0.7rem', travel: '30rem' },
  { id: 4, left: '31%', delay: 1.85, duration: 3.35, height: '7.8rem', drift: '-0.4rem', travel: '34rem' },
  { id: 5, left: '39%', delay: 0.4, duration: 2.7, height: '6.5rem', drift: '-0.85rem', travel: '31.5rem' },
  { id: 6, left: '47%', delay: 1.45, duration: 3.1, height: '7.1rem', drift: '-0.45rem', travel: '33rem' },
  { id: 7, left: '54%', delay: 0.95, duration: 2.85, height: '6.4rem', drift: '-0.7rem', travel: '31rem' },
  { id: 8, left: '61%', delay: 1.95, duration: 3.25, height: '7.4rem', drift: '-0.35rem', travel: '34rem' },
  { id: 9, left: '69%', delay: 0.3, duration: 2.75, height: '6.1rem', drift: '-0.9rem', travel: '30.5rem' },
  { id: 10, left: '77%', delay: 1.25, duration: 3.05, height: '7rem', drift: '-0.45rem', travel: '32.8rem' },
  { id: 11, left: '85%', delay: 0.8, duration: 2.9, height: '6.3rem', drift: '-0.75rem', travel: '31.2rem' },
  { id: 12, left: '92%', delay: 1.7, duration: 3.15, height: '7.5rem', drift: '-0.35rem', travel: '33.6rem' }
].map((drop) => {
  const impactRatio = 0.82
  return {
    id: drop.id,
    dropStyle: {
      '--drop-left': drop.left,
      '--drop-delay': `${drop.delay}s`,
      '--drop-duration': `${drop.duration}s`,
      '--drop-height': drop.height,
      '--drop-drift': drop.drift,
      '--drop-travel': drop.travel
    },
    splashStyle: {
      '--drop-left': drop.left,
      '--splash-delay': `${(drop.delay + (drop.duration * impactRatio)).toFixed(2)}s`,
      '--splash-cycle': `${drop.duration}s`
    }
  }
})

const heroHighlightCards = [
  { title: 'Melhor Bandeira', value: 'PIX', caption: '99,7% margem', tone: 'green' },
  { title: 'Modalidade Mais Rentável', value: 'debito', caption: '99,3% margem', tone: 'orange' },
  { title: 'Volume Total', value: 'R$ 871.423,83', caption: '98,6% margem média', tone: 'blue' }
]

const heroMetricCards = [
  { title: 'Receita Bruta', value: 'R$ 884.012,97', caption: 'Total de vendas', tone: 'navy' },
  { title: 'Custo de Taxas', value: 'R$ 12.589,14', caption: 'Despesas de cartão', tone: 'amber' },
  { title: 'Receita Líquida', value: 'R$ 871.423,83', caption: 'Após taxas', tone: 'indigo' },
  { title: 'Margem Bruta', value: '98,58%', caption: 'Rentabilidade', tone: 'emerald' },
  { title: 'Taxa Efetiva', value: '1,42%', caption: 'Custo médio', tone: 'slate' }
]

const heroSummaryCards = [
  { title: 'Ticket Médio Bruto', value: 'R$ 51,15', caption: 'por transação' },
  { title: 'Ticket Médio Líquido', value: 'R$ 50,42', caption: 'após taxas' },
  { title: 'Total de Transações', value: '17.283', caption: 'operações' }
]

const heroBarGroups = [
  { label: 'VISA', bruto: '45%', liquido: '43%', taxa: '2%' },
  { label: 'VISA ELECTRON', bruto: '51%', liquido: '49%', taxa: '2%' },
  { label: 'MAESTRO', bruto: '42%', liquido: '40%', taxa: '2%' },
  { label: 'MASTERCARD', bruto: '58%', liquido: '56%', taxa: '2.5%' },
  { label: 'ELO DÉBITO', bruto: '18%', liquido: '17%', taxa: '1.2%' },
  { label: 'ELO CRÉDITO', bruto: '9%', liquido: '8%', taxa: '1.2%' },
  { label: 'AMEX', bruto: '2%', liquido: '1.7%', taxa: '0.8%' },
  { label: 'CABAL', bruto: '1.6%', liquido: '1.3%', taxa: '0.5%' },
  { label: 'PIX', bruto: '78%', liquido: '77%', taxa: '0.4%' }
]

const heroDonutLegend = [
  { label: 'VISA', value: 'R$ 2.087,14', tone: 'visa' },
  { label: 'VISA ELECTRON', value: 'R$ 1.141,02', tone: 'visa-electron' },
  { label: 'MAESTRO', value: 'R$ 966,20', tone: 'maestro' },
  { label: 'MASTERCARD', value: 'R$ 2.658,14', tone: 'mastercard' },
  { label: 'ELO DÉBITO', value: 'R$ 372,08', tone: 'elo-debito' },
  { label: 'ELO CRÉDITO', value: 'R$ 355,05', tone: 'elo-credito' },
  { label: 'AMEX', value: 'R$ 88,08', tone: 'amex' },
  { label: 'CABAL', value: 'R$ 0,54', tone: 'cabal' },
  { label: 'PIX', value: 'R$ 674,19', tone: 'pix' },
  { label: 'OUTROS', value: 'R$ 248,85', tone: 'outros' }
]
</script>

<style scoped>
.hero-shell,
.hero-copy {
  animation: heroFadeUp 0.8s ease both;
}

.hero-grid {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.9), transparent 82%);
}

.hero-aura {
  position: absolute;
  border-radius: 9999px;
  filter: blur(110px);
  pointer-events: none;
}

.hero-aura--left {
  left: -4rem;
  top: 4rem;
  height: 24rem;
  width: 24rem;
  background: rgba(31, 79, 119, 0.24);
}

.hero-aura--right {
  right: -6rem;
  top: 6rem;
  height: 26rem;
  width: 26rem;
  background: rgba(115, 199, 125, 0.18);
}

.hero-shell {
  overflow: hidden;
  border-radius: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.hero-stage {
  position: relative;
  overflow: hidden;
  border-radius: 0;
  min-height: 56rem;
  padding: 6rem 1.4rem 30rem;
  background:
    radial-gradient(circle at 50% 18%, rgba(115, 199, 125, 0.22), transparent 22%),
    radial-gradient(circle at 50% 100%, rgba(115, 199, 125, 0.12), transparent 28%),
    linear-gradient(180deg, #03070d 0%, #06111e 34%, #09233b 72%, #07131f 100%);
}

.hero-stage__noise,
.hero-stage__grid,
.hero-stage__glow {
  position: absolute;
  pointer-events: none;
}

.hero-stage__noise {
  inset: 0;
  opacity: 0.1;
  background-image: radial-gradient(rgba(255, 255, 255, 0.4) 0.7px, transparent 0.7px);
  background-size: 18px 18px;
}

.hero-stage__grid {
  inset: 0;
  opacity: 0.06;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
  background-size: 120px 120px;
  mask-image: none;
}

.hero-stage__glow {
  border-radius: 9999px;
  filter: blur(90px);
}

.hero-stage__glow--one {
  left: 18%;
  top: 10%;
  width: 20rem;
  height: 20rem;
  background: rgba(115, 199, 125, 0.24);
  animation: glowFloat 12s ease-in-out infinite;
}

.hero-stage__glow--two {
  right: 14%;
  top: 12%;
  width: 24rem;
  height: 24rem;
  background: rgba(31, 79, 119, 0.28);
  animation: glowFloat 14s ease-in-out infinite reverse;
}

.hero-rain {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.hero-rain__drop {
  position: absolute;
  top: -20%;
  left: var(--drop-left);
  width: 2px;
  height: var(--drop-height);
  opacity: 0;
  border-radius: 9999px;
  background: linear-gradient(180deg, rgba(186, 255, 63, 0), rgba(167, 243, 121, 0.9), rgba(80, 177, 255, 0.08));
  box-shadow:
    0 0 14px rgba(167, 243, 121, 0.36),
    0 0 24px rgba(59, 130, 246, 0.18);
  filter: blur(0.2px);
  transform: translate3d(0, -8rem, 0);
  animation: rainFall var(--drop-duration) linear infinite;
  animation-delay: var(--drop-delay);
}

.hero-rain__splash {
  position: absolute;
  left: var(--drop-left);
  bottom: 27.5rem;
  width: 4.5rem;
  height: 1.7rem;
  transform: translateX(-50%);
}

.hero-rain__splash::before,
.hero-rain__splash::after {
  content: '';
  position: absolute;
  left: 50%;
  opacity: 0;
}

.hero-rain__splash::before {
  bottom: 0.05rem;
  width: 3.6rem;
  height: 1rem;
  border-top: 1.5px solid rgba(190, 255, 119, 0.72);
  border-radius: 9999px;
  transform: translateX(-50%) scaleX(0.16);
  box-shadow: 0 0 18px rgba(190, 255, 119, 0.2);
  animation: splashRing var(--splash-cycle) linear infinite;
  animation-delay: var(--splash-delay);
}

.hero-rain__splash::after {
  bottom: 0.2rem;
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 9999px;
  background: rgba(214, 255, 177, 0.95);
  box-shadow:
    -0.9rem -0.45rem 0 0 rgba(214, 255, 177, 0.72),
    0.85rem -0.42rem 0 0 rgba(214, 255, 177, 0.7),
    0 -0.95rem 0 0 rgba(214, 255, 177, 0.68);
  transform: translateX(-50%) translateY(0) scale(0.2);
  animation: splashDots var(--splash-cycle) linear infinite;
  animation-delay: var(--splash-delay);
}

.hero-copy {
  position: relative;
  z-index: 3;
  margin: 0 auto;
  max-width: 58rem;
  text-align: center;
}

.hero-title {
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-size: clamp(2.8rem, 5vw, 5rem);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 0.94;
  color: #fff;
  text-shadow:
    0 8px 24px rgba(2, 6, 23, 0.42),
    0 0 42px rgba(115, 199, 125, 0.08);
}

.hero-surface {
  position: absolute;
  left: 50%;
  bottom: -14rem;
  z-index: 1;
  width: min(86rem, calc(100% - 4rem));
  height: 34rem;
  transform: translate3d(-50%, var(--surface-parallax-y, 0px), 0);
  border-radius: 2rem 2rem 0 0;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(180deg, rgba(7, 16, 27, 0.98), rgba(2, 6, 12, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 -24px 60px rgba(2, 6, 23, 0.36);
}

.hero-surface::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -8rem;
  width: 78%;
  height: 18rem;
  transform: translateX(-50%);
  border-radius: 9999px;
  background:
    radial-gradient(ellipse at center, rgba(134, 239, 172, 0.34) 0%, rgba(74, 222, 128, 0.18) 34%, rgba(34, 197, 94, 0.08) 54%, transparent 74%);
  filter: blur(34px);
  opacity: 0.95;
  pointer-events: none;
}

.hero-surface::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 50%;
  width: calc(100% - 1.5rem);
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(190, 255, 119, 0.42), rgba(96, 165, 250, 0.36), transparent);
}

.hero-surface__frame {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  background:
    radial-gradient(circle at top, rgba(25, 77, 123, 0.2), transparent 26%),
    linear-gradient(180deg, #08111d 0%, #0a1522 50%, #09121d 100%);
}

.hero-surface__frame::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -22%;
  z-index: 0;
  width: 56%;
  height: 13rem;
  transform: translateX(-50%);
  background: linear-gradient(180deg, rgba(187, 247, 208, 0.46), rgba(74, 222, 128, 0.2) 38%, transparent 100%);
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  filter: blur(22px);
  opacity: 0.9;
  mix-blend-mode: screen;
  pointer-events: none;
}

.hero-surface__frame::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(134, 239, 172, 0.18), transparent 26%),
    linear-gradient(180deg, rgba(74, 222, 128, 0.1), transparent 22%);
  pointer-events: none;
}

.hero-surface__ambient {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(52px);
}

.hero-surface__ambient--left {
  left: -6%;
  top: -10%;
  width: 16rem;
  height: 16rem;
  background: rgba(74, 222, 128, 0.18);
}

.hero-surface__ambient--right {
  right: -4%;
  top: -8%;
  width: 18rem;
  height: 18rem;
  background: rgba(34, 197, 94, 0.12);
}

.hero-dashboard {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1rem;
  width: 122%;
  height: 100%;
  padding: 1rem;
  color: #d9e7f7;
  transform: translate3d(0, var(--dashboard-reveal-y, 0px), 0) scale(var(--dashboard-scale, 0.82));
  transform-origin: top left;
  will-change: transform;
}

.hero-dashboard__header,
.hero-dashboard__highlights,
.hero-dashboard__metrics,
.hero-dashboard__summary,
.hero-dashboard__charts {
  display: grid;
  gap: 0.9rem;
}

.hero-dashboard__header {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.hero-dashboard__brand {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.hero-dashboard__brand-mark {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.7rem;
  background: linear-gradient(180deg, #19385f, #10243c);
  color: #f8fbff;
  font-size: 0.72rem;
  font-weight: 700;
}

.hero-dashboard__title {
  color: #f8fbff;
  font-size: 1.18rem;
  font-weight: 700;
}

.hero-dashboard__subtitle {
  margin-top: 0.2rem;
  color: #85a2be;
  font-size: 0.68rem;
}

.hero-dashboard__header-side {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
}

.hero-dashboard__meta {
  display: flex;
  gap: 1rem;
}

.hero-dashboard__meta-block {
  display: grid;
  gap: 0.15rem;
  justify-items: end;
}

.hero-dashboard__meta-block span {
  color: #6f87a1;
  font-size: 0.62rem;
}

.hero-dashboard__meta-block strong {
  color: #eff7ff;
  font-size: 0.78rem;
  font-weight: 700;
}

.hero-dashboard__actions {
  display: flex;
  gap: 0.6rem;
}

.hero-dashboard__action {
  height: 2rem;
  padding: 0 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(126, 148, 170, 0.24);
  background: rgba(12, 23, 36, 0.92);
  color: #dceafe;
  font-size: 0.68rem;
  font-weight: 600;
}

.hero-dashboard__action--ghost {
  border-color: rgba(102, 245, 161, 0.36);
  color: #bbffd3;
}

.hero-dashboard__action--primary {
  background: linear-gradient(180deg, #2b69b8, #224d87);
  color: #f8fbff;
}

.hero-dashboard__highlights {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.hero-dashboard__highlight,
.hero-dashboard__metric,
.hero-dashboard__summary-card,
.hero-chart-panel {
  border: 1px solid rgba(126, 148, 170, 0.16);
  box-shadow: 0 18px 34px rgba(2, 6, 12, 0.18);
}

.hero-dashboard__highlight {
  border-radius: 0.9rem;
  padding: 0.9rem 1rem;
  color: #fbfdff;
}

.hero-dashboard__highlight--green {
  background: linear-gradient(135deg, #149b59, #1bbe66);
}

.hero-dashboard__highlight--orange {
  background: linear-gradient(135deg, #be6904, #f07b08);
}

.hero-dashboard__highlight--blue {
  background: linear-gradient(135deg, #1e74b7, #2793e5);
}

.hero-dashboard__card-title,
.hero-dashboard__metric-title,
.hero-dashboard__summary-title {
  font-size: 0.64rem;
  font-weight: 600;
}

.hero-dashboard__card-value {
  margin-top: 0.45rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.hero-dashboard__card-caption,
.hero-dashboard__metric-caption,
.hero-dashboard__summary-caption {
  margin-top: 0.18rem;
  font-size: 0.58rem;
  opacity: 0.9;
}

.hero-dashboard__metrics {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.hero-dashboard__metric {
  border-radius: 0.85rem;
  padding: 0.85rem 0.9rem;
}

.hero-dashboard__metric--navy {
  background: linear-gradient(180deg, #0d3158, #102a47);
}

.hero-dashboard__metric--amber {
  background: linear-gradient(180deg, #a66202, #8c5303);
}

.hero-dashboard__metric--indigo {
  background: linear-gradient(180deg, #2a5689, #244970);
}

.hero-dashboard__metric--emerald {
  background: linear-gradient(180deg, #21863e, #1a6f35);
}

.hero-dashboard__metric--slate {
  background: linear-gradient(180deg, #294f7f, #243f65);
}

.hero-dashboard__metric-value {
  margin-top: 0.35rem;
  color: #f8fbff;
  font-size: 1.05rem;
  font-weight: 700;
}

.hero-dashboard__summary {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.hero-dashboard__summary-card {
  border-radius: 0.85rem;
  padding: 0.75rem 0.85rem;
  background: rgba(235, 243, 251, 0.06);
}

.hero-dashboard__summary-value {
  margin-top: 0.35rem;
  color: #f3f8ff;
  font-size: 0.98rem;
  font-weight: 700;
}

.hero-dashboard__charts {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.hero-chart-panel {
  border-radius: 1rem;
  padding: 1rem;
  background: rgba(239, 246, 255, 0.05);
}

.hero-chart-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}

.hero-chart-panel__title {
  color: #f6fbff;
  font-size: 0.86rem;
  font-weight: 700;
}

.hero-chart-panel__tabs {
  display: flex;
  gap: 0.35rem;
}

.hero-chart-panel__tabs span {
  padding: 0.22rem 0.46rem;
  border-radius: 0.4rem;
  color: #87a1bc;
  font-size: 0.56rem;
}

.hero-chart-panel__tabs .is-active {
  background: rgba(43, 105, 184, 0.42);
  color: #eef7ff;
}

.hero-bar-chart {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr);
  gap: 0.8rem;
  margin-top: 0.9rem;
}

.hero-bar-chart__scale {
  display: grid;
  align-content: space-between;
  padding-bottom: 1.5rem;
  color: #6f87a1;
  font-size: 0.52rem;
}

.hero-bar-chart__plot {
  position: relative;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 0.7rem;
  align-items: end;
  min-height: 10rem;
  padding: 0.5rem 0 1.5rem;
  background-image:
    linear-gradient(rgba(126, 148, 170, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(126, 148, 170, 0.05) 1px, transparent 1px);
  background-size: 100% 20%, 11.11% 100%;
  border-bottom: 1px solid rgba(126, 148, 170, 0.14);
}

.hero-bar-chart__group {
  display: grid;
  gap: 0.5rem;
  align-items: end;
}

.hero-bar-chart__bars {
  display: flex;
  gap: 0.14rem;
  align-items: end;
  height: 8.6rem;
}

.hero-bar-chart__bar {
  width: 0.44rem;
  border-radius: 0.28rem 0.28rem 0 0;
}

.hero-bar-chart__bar--bruto {
  background: #1d4f7d;
}

.hero-bar-chart__bar--liquido {
  background: #24904b;
}

.hero-bar-chart__bar--taxa {
  background: #b9770d;
}

.hero-bar-chart__label {
  transform: rotate(-32deg);
  transform-origin: top left;
  color: #7d96b1;
  font-size: 0.5rem;
  white-space: nowrap;
}

.hero-chart-panel__legend {
  display: flex;
  gap: 0.9rem;
  margin-top: 0.9rem;
  color: #7d96b1;
  font-size: 0.55rem;
}

.hero-chart-panel__legend--wrap {
  flex-wrap: wrap;
}

.legend-dot {
  display: inline-block;
  width: 0.42rem;
  height: 0.42rem;
  margin-right: 0.32rem;
  border-radius: 9999px;
  vertical-align: middle;
}

.legend-dot--bruto,
.legend-dot--visa {
  background: #294869;
}

.legend-dot--liquido,
.legend-dot--maestro {
  background: #419750;
}

.legend-dot--taxa,
.legend-dot--mastercard,
.legend-dot--pix {
  background: #c98a2b;
}

.legend-dot--visa-electron {
  background: #4a6992;
}

.legend-dot--elo-debito {
  background: #4a86c1;
}

.legend-dot--elo-credito {
  background: #19344d;
}

.legend-dot--amex {
  background: #2d5b90;
}

.legend-dot--cabal {
  background: #2f8d46;
}

.legend-dot--outros {
  background: #6d98cb;
}

.hero-donut-layout {
  display: grid;
  grid-template-columns: 1fr 12rem;
  gap: 1rem;
  align-items: center;
  margin-top: 0.9rem;
}

.hero-donut {
  display: grid;
  place-items: center;
  min-height: 11rem;
}

.hero-donut__ring {
  width: 10rem;
  aspect-ratio: 1;
  border-radius: 9999px;
  background:
    radial-gradient(circle at center, #0d1722 0 38%, transparent 39%),
    conic-gradient(
      #294869 0 24%,
      #4a6992 24% 37%,
      #419750 37% 48%,
      #c98a2b 48% 80%,
      #4a86c1 80% 85%,
      #19344d 85% 89%,
      #2d5b90 89% 92%,
      #2f8d46 92% 94%,
      #c98a2b 94% 98%,
      #6d98cb 98% 100%
    );
  box-shadow: inset 0 0 0 1px rgba(126, 148, 170, 0.14);
}

.hero-donut-list {
  border-radius: 0.85rem;
  padding: 0.7rem 0.8rem;
  background: rgba(235, 243, 251, 0.05);
}

.hero-donut-list__header {
  margin-bottom: 0.45rem;
  color: #9bb4cf;
  font-size: 0.56rem;
  font-weight: 700;
}

.hero-donut-list__item {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.17rem 0;
  color: #90a8c2;
  font-size: 0.54rem;
}

.hero-donut-list__item strong {
  color: #edf6ff;
  font-weight: 600;
}

.hero-donut-list__label {
  display: inline-flex;
  align-items: center;
}

@media (max-width: 1200px) {
  .hero-dashboard {
    gap: 0.75rem;
  }

  .hero-dashboard__header,
  .hero-dashboard__highlights,
  .hero-dashboard__metrics,
  .hero-dashboard__summary,
  .hero-dashboard__charts {
    gap: 0.7rem;
  }

  .hero-dashboard__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero-dashboard__header {
    grid-template-columns: 1fr;
  }

  .hero-dashboard__header-side {
    justify-content: space-between;
  }

  .hero-dashboard__charts {
    grid-template-columns: 1fr;
  }
}

@keyframes heroFadeUp {
  from {
    opacity: 0;
    transform: translateY(26px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rainFall {
  0% {
    opacity: 0;
    transform: translate3d(0, -8rem, 0);
  }
  14% {
    opacity: 0.7;
  }
  78% {
    opacity: 0.82;
  }
  84% {
    opacity: 0;
    transform: translate3d(var(--drop-drift), var(--drop-travel), 0);
  }
  100% {
    opacity: 0;
    transform: translate3d(var(--drop-drift), var(--drop-travel), 0);
  }
}

@keyframes splashRing {
  0%, 82% {
    opacity: 0;
    transform: translateX(-50%) scaleX(0.16);
  }
  86% {
    opacity: 0.9;
    transform: translateX(-50%) scaleX(0.55);
  }
  92% {
    opacity: 0.18;
    transform: translateX(-50%) scaleX(1.15);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) scaleX(1.35);
  }
}

@keyframes splashDots {
  0%, 82% {
    opacity: 0;
    transform: translateX(-50%) translateY(0) scale(0.2);
  }
  86% {
    opacity: 0.92;
    transform: translateX(-50%) translateY(-0.4rem) scale(1);
  }
  91% {
    opacity: 0.35;
    transform: translateX(-50%) translateY(-0.9rem) scale(0.9);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-1.15rem) scale(0.3);
  }
}

@keyframes glowFloat {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(1.5rem, -1rem, 0) scale(1.06);
  }
}

@media (max-width: 1023px) {
  .hero-title {
    font-size: clamp(2.4rem, 8vw, 4rem);
  }

  .hero-stage {
    min-height: 50rem;
    padding-bottom: 25rem;
  }

  .hero-rain__splash {
    bottom: 22.3rem;
  }

  .hero-surface {
    width: calc(100% - 2rem);
    height: 28rem;
    bottom: -11rem;
  }

  .hero-dashboard__highlights {
    grid-template-columns: 1fr;
  }

  .hero-dashboard__summary {
    grid-template-columns: 1fr;
  }

  .hero-donut-layout {
    grid-template-columns: 1fr;
  }

  .hero-donut-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 0.75rem;
  }
}

@media (max-width: 640px) {
  .hero-stage {
    min-height: 39rem;
    padding: 4.5rem 1rem 17.5rem;
  }

  .hero-rain__drop {
    width: 1.5px;
  }

  .hero-rain__splash {
    bottom: 15rem;
    width: 3.6rem;
  }

  .hero-surface {
    bottom: -6.8rem;
    width: calc(100% - 1rem);
    height: 19rem;
    border-radius: 1.25rem 1.25rem 0 0;
  }

  .hero-dashboard {
    width: 140%;
    padding: 0.65rem;
  }

  .hero-dashboard__header-side,
  .hero-dashboard__actions,
  .hero-dashboard__meta {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-dashboard__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-bar-chart {
    grid-template-columns: 1fr;
  }

  .hero-bar-chart__scale {
    display: none;
  }

  .hero-donut__ring {
    width: 7rem;
  }

  .hero-donut-list {
    grid-template-columns: 1fr;
  }
}
</style>
