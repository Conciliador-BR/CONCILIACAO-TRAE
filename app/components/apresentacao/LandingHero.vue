<template>
  <section class="relative overflow-x-hidden bg-[#07121f]">
    <div class="hero-grid absolute inset-0 opacity-30" />
    <div class="hero-aura hero-aura--left" />
    <div class="hero-aura hero-aura--right" />

    <div class="relative w-full">
      <div class="hero-shell">
        <div class="hero-stage">
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
              Seu mercado vende no cartão, mas recebe o valor certo?
            </h1>
          </div>

          <div class="hero-surface">
            <div class="hero-surface__frame">
              <div class="hero-surface__ambient hero-surface__ambient--left" aria-hidden="true" />
              <div class="hero-surface__ambient hero-surface__ambient--right" aria-hidden="true" />

              <div class="hero-dashboard">
                <section class="hero-share-section">
                  <div class="hero-share-section__header">
                    <div class="hero-share-section__title">Share das Vendas</div>
                    <p class="hero-share-section__description">
                      Quanto cada modalidade representa dentro do total vendido no periodo.
                    </p>
                    <div class="hero-share-section__total">
                      Total das vendas:
                      <strong>{{ heroShareTotal }}</strong>
                    </div>
                  </div>

                  <div class="hero-share-grid hero-share-grid--modalities">
                    <article
                      v-for="item in heroShareModalities"
                      :key="item.title"
                      class="hero-share-card"
                    >
                      <div class="hero-share-card__header">
                        <h3>{{ item.title }}</h3>
                        <span class="hero-share-card__badge" :class="`hero-share-card__badge--${item.tone}`">
                          {{ item.share }}
                        </span>
                      </div>

                      <p class="hero-share-card__caption">Participacao sobre o total vendido</p>
                      <div class="hero-share-card__value">{{ item.value }}</div>
                      <div class="hero-share-card__progress">
                        <span :class="`hero-share-card__progress-bar--${item.tone}`" :style="{ width: item.share }" />
                      </div>
                    </article>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
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

const heroShareTotal = 'R$ 968.484,07'

const heroShareModalities = [
  { title: 'Debito', share: '16.55%', value: 'R$ 160.265,85', tone: 'navy' },
  { title: 'Credito', share: '26.76%', value: 'R$ 259.174,71', tone: 'green' },
  { title: 'Parcelado', share: '18.35%', value: 'R$ 177.689,87', tone: 'amber' },
  { title: 'Voucher', share: '10.71%', value: 'R$ 103.722,46', tone: 'purple' },
  { title: 'PIX', share: '27.63%', value: 'R$ 267.631,18', tone: 'cyan' }
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
  padding: 9rem 1.4rem 30rem;
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
  bottom: 13.15rem;
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
  z-index: 2;
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
  bottom: -4.75rem;
  z-index: 4;
  width: min(92rem, calc(100% - 2rem));
  height: 18.75rem;
  transform: translate3d(-50%, 0, 0);
  border-radius: 2rem 2rem 0 0;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(180deg, rgba(7, 16, 27, 0.98), rgba(2, 6, 12, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 -24px 60px rgba(2, 6, 23, 0.36);
  animation: heroSurfaceFloat 8.8s ease-in-out infinite;
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
  --hero-dashboard-scale: 0.95;
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1rem;
  width: 100%;
  min-height: 100%;
  padding: 1.1rem 1rem 1rem;
  color: #d9e7f7;
  transform: translate3d(0, 0, 0) scale(var(--hero-dashboard-scale));
  transform-origin: top center;
  will-change: transform;
  animation: heroDashboardFloat 8.8s ease-in-out infinite;
}

.hero-share-section,
.hero-share-grid,
.hero-share-card__header {
  display: grid;
  gap: 0.9rem;
}

.hero-share-section {
  gap: 0.9rem;
  border: 1px solid rgba(126, 148, 170, 0.14);
  border-radius: 1.15rem;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(10, 27, 44, 0.88), rgba(7, 19, 33, 0.94));
  box-shadow: 0 18px 34px rgba(2, 6, 12, 0.18);
}

.hero-share-section__header {
  display: grid;
  gap: 0.28rem;
}

.hero-share-section__title {
  color: #f8fbff;
  font-size: 1rem;
  font-weight: 700;
}

.hero-share-section__description {
  color: #87a1bc;
  font-size: 0.7rem;
  line-height: 1.45;
}

.hero-share-section__total {
  margin-top: 0.1rem;
  color: #9bb4cf;
  font-size: 0.74rem;
  font-weight: 600;
}

.hero-share-section__total strong {
  color: #8ac8ff;
}

.hero-share-grid--modalities {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.hero-share-card {
  border: 1px solid rgba(126, 148, 170, 0.16);
  border-radius: 0.95rem;
  padding: 0.8rem 0.82rem;
  background:
    linear-gradient(180deg, rgba(14, 35, 58, 0.92), rgba(8, 22, 38, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 14px 28px rgba(2, 8, 17, 0.18);
}

.hero-share-card__header {
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.6rem;
}

.hero-share-card__header h3 {
  color: #f8fbff;
  font-size: 0.8rem;
  font-weight: 700;
}

.hero-share-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.8rem;
  height: 1.35rem;
  padding: 0 0.55rem;
  border-radius: 9999px;
  font-size: 0.58rem;
  font-weight: 700;
  color: #f8fbff;
}

.hero-share-card__badge--navy,
.hero-share-card__progress-bar--navy {
  background: #2f5f96;
}

.hero-share-card__badge--green,
.hero-share-card__progress-bar--green {
  background: #299246;
}

.hero-share-card__badge--amber,
.hero-share-card__progress-bar--amber {
  background: #b97910;
}

.hero-share-card__badge--purple,
.hero-share-card__progress-bar--purple {
  background: #7b46e8;
}

.hero-share-card__badge--cyan,
.hero-share-card__progress-bar--cyan {
  background: #1497bf;
}

.hero-share-card__caption {
  margin-top: 0.28rem;
  color: #7e97b2;
  font-size: 0.6rem;
}

.hero-share-card__value {
  margin-top: 0.7rem;
  color: #f6fbff;
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.hero-share-card__progress {
  margin-top: 0.8rem;
  width: 100%;
  height: 0.34rem;
  border-radius: 9999px;
  background: rgba(126, 148, 170, 0.14);
  overflow: hidden;
}

.hero-share-card__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.12);
}

@media (max-width: 1200px) {
  .hero-dashboard {
    gap: 0.75rem;
  }

  .hero-share-grid--modalities,
  .hero-share-grid--modalities {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

@keyframes heroSurfaceFloat {
  0%, 100% {
    transform: translate3d(-50%, 0, 0);
  }
  50% {
    transform: translate3d(-50%, -0.8rem, 0);
  }
}

@keyframes heroDashboardFloat {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(var(--hero-dashboard-scale));
  }
  50% {
    transform: translate3d(0, -0.35rem, 0) scale(var(--hero-dashboard-scale));
  }
}

@media (max-width: 1023px) {
  .hero-title {
    font-size: clamp(2.4rem, 8vw, 4rem);
  }

  .hero-stage {
    min-height: 55rem;
    padding-top: 8rem;
    padding-bottom: 31rem;
  }

  .hero-rain__splash {
    bottom: 12.55rem;
  }

  .hero-surface {
    width: calc(100% - 2rem);
    height: 18.5rem;
    bottom: -5rem;
  }
}

@media (max-width: 640px) {
  .hero-stage {
    min-height: 43rem;
    padding: 7.2rem 1rem 22.5rem;
  }

  .hero-rain__drop {
    width: 1.5px;
  }

  .hero-rain__splash {
    bottom: 9.9rem;
    width: 3.6rem;
  }

  .hero-surface {
    bottom: -3.6rem;
    width: calc(100% - 1rem);
    height: 13.9rem;
    border-radius: 1.25rem 1.25rem 0 0;
  }

  .hero-dashboard {
    width: 100%;
    padding: 0.72rem;
    --hero-dashboard-scale: 0.74;
  }

  .hero-share-section {
    padding: 0.72rem;
  }

  .hero-share-section__title {
    font-size: 0.82rem;
  }

  .hero-share-section__description,
  .hero-share-section__total {
    font-size: 0.58rem;
  }

  .hero-share-grid--modalities,
  .hero-share-grid--modalities {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .hero-share-card {
    padding: 0.62rem 0.65rem;
  }

  .hero-share-card__header h3 {
    font-size: 0.66rem;
  }

  .hero-share-card__badge {
    min-width: 3.1rem;
    height: 1.15rem;
    font-size: 0.5rem;
  }

  .hero-share-card__value {
    font-size: 0.76rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-surface,
  .hero-dashboard,
  .hero-stage__glow--one,
  .hero-stage__glow--two,
  .hero-rain__drop,
  .hero-rain__splash::before,
  .hero-rain__splash::after {
    animation: none !important;
  }
}
</style>
