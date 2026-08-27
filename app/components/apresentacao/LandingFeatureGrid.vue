<template>
  <section id="solucoes" class="feature-section relative overflow-hidden scroll-mt-36">
    <div class="feature-section__grid" aria-hidden="true" />
    <div class="feature-section__glow feature-section__glow--left" aria-hidden="true" />
    <div class="feature-section__glow feature-section__glow--right" aria-hidden="true" />
    <div class="feature-section__rain" aria-hidden="true" />
    <div class="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div class="quem-somos-heading">
        <LandingSectionHeading
          eyebrow="Quem Somos"
          title="Conciliadora de cartões para mercados que precisam conferir o que venderam, o que caiu na conta e o que foi cobrado a mais."
        />
      </div>

      <div
        class="quem-somos-carousel mt-20"
        @mouseenter="pausarAutoplay"
        @mouseleave="iniciarAutoplay"
      >
        <button
          type="button"
          class="carousel-arrow carousel-arrow--left"
          aria-label="Ver card anterior"
          @click="voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
          </svg>
        </button>

        <div class="carousel-window">
          <div class="carousel-stage">
            <article
              v-for="(feature, index) in features"
              :key="feature.title"
              class="feature-slide"
              :class="getSlideClass(index)"
            >
              <div
                class="feature-slide__interactive"
                :class="feature.themeClass"
                :style="getPointerStyle(index)"
                @mousemove="handleCardMove($event, index)"
                @mouseleave="handleCardLeave(index)"
              >
                <div class="feature-slide__cosmos" />
                <div class="feature-slide__grain" />
                <div class="feature-slide__wander" />
                <div class="feature-slide__beam" />
                <div class="feature-slide__overlay" />
                <div class="feature-slide__glow" :class="feature.glowClass" />
                <div class="feature-slide__nebula" />
                <div class="feature-slide__halo" />
                <div class="feature-slide__chip" aria-hidden="true" />

                <div class="feature-slide__content">
                  <div class="feature-slide__emblem" aria-hidden="true">
                    <div class="feature-slide__emblem-core" />
                  </div>

                  <div class="feature-slide__card-meta">
                    <div class="feature-slide__copy">
                      <h3 class="feature-slide__title">{{ feature.title }}</h3>
                      <p class="feature-slide__description">{{ feature.description }}</p>
                    </div>

                    <div class="feature-slide__accent">
                      <span>{{ feature.accent }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <button
          type="button"
          class="carousel-arrow carousel-arrow--right"
          aria-label="Ver próximo card"
          @click="avancar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
          </svg>
        </button>

        <div class="carousel-indicators">
          <button
            v-for="(feature, index) in features"
            :key="`${feature.title}-indicator`"
            type="button"
            class="carousel-indicator"
            :class="{ 'carousel-indicator--active': index === activeIndex }"
            :aria-label="`Ir para ${feature.title}`"
            @click="irPara(index)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import LandingSectionHeading from './LandingSectionHeading.vue'

const features = [
  {
    title: 'Conciliação de Vendas',
    description: 'Mostra quando a venda do cartão ou voucher entrou com valor diferente, taxa acima do combinado ou cadastro fora do padrão.',
    accent: 'ANALISE',
    themeClass: 'feature-slide--ocean',
    glowClass: 'feature-slide__glow--green'
  },
  {
    title: 'Recebimentos e Pagamentos',
    description: 'Ajuda seu financeiro a conferir o que foi vendido, o que realmente entrou na conta e o que ainda precisa ser cobrado.',
    accent: 'PAGTO',
    themeClass: 'feature-slide--emerald',
    glowClass: 'feature-slide__glow--cyan'
  },
  {
    title: 'Extratos Bancários',
    description: 'Liga cada depósito do banco aos cartões e vouchers para o supermercado entender rápido o que entrou, faltou ou divergiu.',
    accent: 'EXTRATO',
    themeClass: 'feature-slide--lagoon',
    glowClass: 'feature-slide__glow--cyan'
  },
  {
    title: 'Controladoria Personalizada',
    description: 'Nossos especialistas acompanham a rotina do seu supermercado, analisam divergências e ajudam a recuperar dinheiro e organizar o fechamento.',
    accent: 'CONSULT',
    themeClass: 'feature-slide--midnight',
    glowClass: 'feature-slide__glow--green'
  }
]

const activeIndex = ref(0)
const pointerStates = reactive({})
let autoplayTimer = null

const avancar = () => {
  activeIndex.value = (activeIndex.value + 1) % features.length
}

const voltar = () => {
  activeIndex.value = (activeIndex.value - 1 + features.length) % features.length
}

const irPara = (index) => {
  activeIndex.value = index
}

const getRelativeOffset = (index) => {
  const total = features.length
  let diff = index - activeIndex.value

  if (diff > total / 2) diff -= total
  if (diff < -total / 2) diff += total

  return diff
}

const getSlideClass = (index) => {
  const offset = getRelativeOffset(index)

  if (offset === 0) return 'feature-slide--active'
  if (offset === -1) return 'feature-slide--prev'
  if (offset === 1) return 'feature-slide--next'
  return 'feature-slide--hidden'
}

const defaultPointerState = () => ({
  '--pointer-x': '50%',
  '--pointer-y': '50%',
  '--rotate-x': '0deg',
  '--rotate-y': '0deg',
  '--lift-y': '0px',
  '--glow-alpha': '0.16',
  '--shine-alpha': '0.1'
})

const getPointerStyle = (index) => pointerStates[index] ?? defaultPointerState()

const handleCardMove = (event, index) => {
  const element = event.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  const localX = event.clientX - rect.left
  const localY = event.clientY - rect.top
  const percentX = (localX / rect.width) * 100
  const percentY = (localY / rect.height) * 100
  const rotateY = ((percentX - 50) / 50) * 7
  const rotateX = ((50 - percentY) / 50) * 6

  pointerStates[index] = {
    '--pointer-x': `${percentX}%`,
    '--pointer-y': `${percentY}%`,
    '--rotate-x': `${rotateX.toFixed(2)}deg`,
    '--rotate-y': `${rotateY.toFixed(2)}deg`,
    '--lift-y': '-6px',
    '--glow-alpha': '0.34',
    '--shine-alpha': '0.22'
  }
}

const handleCardLeave = (index) => {
  pointerStates[index] = defaultPointerState()
}

const pausarAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

const iniciarAutoplay = () => {
  pausarAutoplay()
  autoplayTimer = setInterval(() => {
    avancar()
  }, 4500)
}

onMounted(() => {
  features.forEach((_, index) => {
    pointerStates[index] = defaultPointerState()
  })
  iniciarAutoplay()
})

onBeforeUnmount(() => {
  pausarAutoplay()
})
</script>

<style scoped>
.feature-section {
  background:
    radial-gradient(circle at 50% 16%, rgba(115, 199, 125, 0.2), transparent 24%),
    radial-gradient(circle at 14% 18%, rgba(31, 79, 119, 0.32), transparent 26%),
    radial-gradient(circle at 84% 10%, rgba(31, 79, 119, 0.22), transparent 24%),
    linear-gradient(180deg, #040b14 0%, #071523 42%, #0a2338 100%);
}

.feature-section__grid,
.feature-section__glow,
.feature-section__rain {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.feature-section__grid {
  opacity: 0.08;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 118px 118px;
}

.feature-section__glow {
  border-radius: 9999px;
  filter: blur(88px);
}

.feature-section__glow--left {
  top: 2rem;
  left: -6rem;
  width: 22rem;
  height: 22rem;
  background: rgba(31, 79, 119, 0.24);
}

.feature-section__glow--right {
  top: 4rem;
  right: -5rem;
  width: 24rem;
  height: 24rem;
  background: rgba(115, 199, 125, 0.14);
}

.feature-section__rain {
  opacity: 0.18;
  background-image:
    linear-gradient(180deg, transparent 0%, rgba(167, 243, 121, 0.24) 35%, transparent 100%),
    linear-gradient(180deg, transparent 0%, rgba(96, 165, 250, 0.2) 40%, transparent 100%);
  background-size: 220px 100%, 320px 100%;
  background-position: 10% 0, 64% 0;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.58) 72%, transparent 100%);
}

.quem-somos-heading :deep(span) {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.quem-somos-heading :deep(h2) {
  color: #ffffff;
}

.quem-somos-carousel {
  position: relative;
  max-width: 82rem;
  margin-left: auto;
  margin-right: auto;
}

.carousel-window {
  overflow: visible;
  border-radius: 2rem;
}

.carousel-stage {
  position: relative;
  height: 26rem;
}

.feature-slide {
  position: relative;
  position: absolute;
  top: 0;
  left: 50%;
  width: min(100%, 31rem);
  min-height: 19.5rem;
  overflow: hidden;
  border: 0;
  border-radius: 1.9rem;
  transform-origin: center center;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.52);
  transition: transform 0.55s ease, opacity 0.55s ease, filter 0.55s ease;
}

.feature-slide__interactive {
  position: absolute;
  inset: -0.7rem;
  overflow: hidden;
  border-radius: 2.25rem;
  transform-style: preserve-3d;
  transform:
    perspective(1800px)
    rotateZ(-2.1deg)
    rotateX(var(--rotate-x))
    rotateY(var(--rotate-y))
    translateY(var(--lift-y));
  transition:
    transform 0.16s ease-out,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
  box-shadow:
    0 22px 60px rgba(0, 0, 0, 0.34);
}

.feature-slide__interactive::before {
  content: '';
  position: absolute;
  inset: -24%;
  background:
    radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(255, 255, 255, calc(var(--shine-alpha) * 1.1)) 0%, rgba(154, 229, 255, calc(var(--shine-alpha) * 0.9)) 12%, transparent 34%),
    radial-gradient(circle at calc(var(--pointer-x) + 8%) calc(var(--pointer-y) - 10%), rgba(56, 189, 248, calc(var(--shine-alpha) * 0.9)) 0%, transparent 22%);
  filter: blur(16px);
  pointer-events: none;
  z-index: 0;
}

.feature-slide__interactive:hover {
  box-shadow:
    0 30px 90px rgba(0, 0, 0, 0.46);
}

.feature-slide--ocean {
  background:
    radial-gradient(circle at 18% 78%, rgba(203, 243, 255, 0.48), transparent 32%),
    radial-gradient(circle at 82% 14%, rgba(56, 189, 248, 0.34), transparent 26%),
    linear-gradient(145deg, #1a5f97 0%, #2a7ec0 38%, #1aa0e7 72%, #1bb8ff 100%);
}

.feature-slide--emerald {
  background:
    radial-gradient(circle at 18% 76%, rgba(192, 242, 255, 0.46), transparent 32%),
    radial-gradient(circle at 80% 12%, rgba(34, 197, 94, 0.22), transparent 20%),
    linear-gradient(145deg, #1964a6 0%, #237bbf 36%, #0aa0df 70%, #13b8d5 100%);
}

.feature-slide--lagoon {
  background:
    radial-gradient(circle at 22% 74%, rgba(210, 246, 255, 0.46), transparent 34%),
    radial-gradient(circle at 84% 14%, rgba(34, 211, 238, 0.26), transparent 22%),
    linear-gradient(145deg, #155b91 0%, #2177b9 34%, #1698d7 72%, #16ade5 100%);
}

.feature-slide--midnight {
  background:
    radial-gradient(circle at 22% 76%, rgba(212, 244, 255, 0.42), transparent 34%),
    radial-gradient(circle at 84% 12%, rgba(56, 189, 248, 0.28), transparent 20%),
    linear-gradient(145deg, #124f84 0%, #1e6fae 34%, #1c90cf 72%, #1ab0e6 100%);
}

.feature-slide__cosmos,
.feature-slide__grain,
.feature-slide__wander,
.feature-slide__beam,
.feature-slide__nebula,
.feature-slide__halo {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.feature-slide__cosmos {
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px),
    radial-gradient(circle at 72% 26%, rgba(255, 255, 255, 0.08) 0 1.1px, transparent 1.1px),
    radial-gradient(circle at 84% 62%, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px),
    radial-gradient(circle at 28% 76%, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px);
  background-size: 16rem 16rem, 18rem 18rem, 14rem 14rem, 20rem 20rem;
  opacity: 0.35;
}

.feature-slide__grain {
  opacity: 0.08;
  mix-blend-mode: screen;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 4px 4px, 4px 4px;
}

.feature-slide__wander {
  inset: -20%;
  background:
    radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(255, 255, 255, calc(var(--glow-alpha) * 0.65)) 0%, rgba(191, 245, 255, calc(var(--glow-alpha) * 0.9)) 10%, transparent 24%),
    radial-gradient(circle at calc(var(--pointer-x) - 12%) calc(var(--pointer-y) + 6%), rgba(14, 165, 233, calc(var(--glow-alpha) * 0.72)) 0%, transparent 18%),
    radial-gradient(circle at 82% 16%, rgba(34, 211, 238, 0.22) 0%, transparent 24%);
  filter: blur(22px);
  opacity: 1;
}

.feature-slide__beam {
  opacity: 0.38;
  background:
    linear-gradient(115deg, transparent 26%, rgba(255, 255, 255, 0.18) 44%, transparent 56%),
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.12), transparent 36%);
  mix-blend-mode: screen;
}

.feature-slide__nebula {
  inset: auto auto 8% 10%;
  width: 68%;
  height: 56%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(218, 245, 255, 0.52) 0%, rgba(191, 245, 255, 0.28) 28%, rgba(147, 197, 253, 0.12) 52%, transparent 72%);
  filter: blur(34px);
  opacity: 0.7;
}

.feature-slide__halo {
  inset: auto -10% -16% auto;
  width: 54%;
  height: 70%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.26) 0%, rgba(14, 165, 233, 0.16) 34%, transparent 66%);
  filter: blur(30px);
  opacity: 0.9;
}

.feature-slide__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.04), rgba(2, 6, 23, 0.12) 54%, rgba(2, 6, 23, 0.24)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 38%);
}

.feature-slide__glow {
  position: absolute;
  right: -3rem;
  bottom: -4rem;
  width: 14rem;
  height: 14rem;
  border-radius: 9999px;
  filter: blur(34px);
  opacity: 0.72;
}

.feature-slide__glow--green {
  background: rgba(167, 243, 208, 0.22);
}

.feature-slide__glow--cyan {
  background: rgba(125, 211, 252, 0.22);
}

.feature-slide__content {
  position: relative;
  z-index: 2;
  display: flex;
  height: calc(100% - 0.1rem);
  flex-direction: column;
  padding: 2.3rem 2.1rem 2rem;
}

.feature-slide__chip {
  position: absolute;
  left: 1.5rem;
  bottom: 1.55rem;
  width: 4.2rem;
  height: 3rem;
  border-radius: 0.44rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.34), rgba(204, 213, 219, 0.18) 32%, rgba(241, 245, 249, 0.28) 54%, rgba(166, 180, 194, 0.14) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    0 10px 24px rgba(15, 23, 42, 0.12);
  opacity: 0.42;
  transform: translateZ(10px);
  filter: saturate(0.9);
}

.feature-slide__emblem {
  position: absolute;
  inset: 5.8rem auto auto 50%;
  width: 9.4rem;
  height: 9.4rem;
  transform: translateX(-50%) translateZ(36px);
  opacity: 0.82;
}

.feature-slide__emblem-core {
  width: 100%;
  height: 100%;
  border-radius: 2.2rem;
  background:
    linear-gradient(180deg, rgba(1, 39, 75, 0.24), rgba(3, 55, 93, 0.38)),
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), transparent 42%);
  clip-path: polygon(24% 0%, 76% 0%, 100% 24%, 100% 76%, 76% 100%, 24% 100%, 0% 76%, 0% 24%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 18px 36px rgba(2, 6, 23, 0.18);
}

.feature-slide__card-meta {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  transform: translateZ(52px);
}

.feature-slide__copy {
  max-width: 72%;
  text-align: left;
}

.feature-slide__title {
  margin-top: 0;
  font-size: clamp(1.25rem, 2vw, 1.6rem);
  line-height: 1.05;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.feature-slide__description {
  margin-top: 0.5rem;
  max-width: 16rem;
  font-size: 0.72rem;
  line-height: 1.5;
  letter-spacing: 0.02em;
  color: rgba(240, 249, 255, 0.82);
}

.feature-slide__accent {
  flex-shrink: 0;
  align-self: flex-end;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(236, 254, 255, 0.76);
}

.feature-slide--active {
  z-index: 3;
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.feature-slide--prev {
  z-index: 2;
  opacity: 0.34;
  filter: saturate(0.88);
  transform: translateX(calc(-50% - 22rem)) scale(0.9);
}

.feature-slide--next {
  z-index: 2;
  opacity: 0.34;
  filter: saturate(0.88);
  transform: translateX(calc(-50% + 22rem)) scale(0.9);
}

.feature-slide--hidden {
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) scale(0.82);
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  z-index: 3;
  display: inline-flex;
  width: 3.6rem;
  height: 3.6rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(180deg, rgba(12, 18, 29, 0.94), rgba(7, 12, 22, 0.94));
  color: #eef7ff;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
  transform: translateY(-50%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.carousel-arrow:hover {
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 22px 45px rgba(0, 0, 0, 0.42);
}

.carousel-arrow svg {
  width: 1.7rem;
  height: 1.7rem;
}

.carousel-arrow--left {
  left: 1.25rem;
}

.carousel-arrow--right {
  right: 1.25rem;
}

.carousel-indicators {
  margin-top: 1.2rem;
  display: flex;
  justify-content: center;
  gap: 0.6rem;
}

.carousel-indicator {
  width: 0.85rem;
  height: 0.85rem;
  border: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.24);
  transition: all 0.2s ease;
}

.carousel-indicator--active {
  width: 2.3rem;
  background: #73c77d;
}

@media (max-width: 768px) {
  .carousel-stage {
    height: 22rem;
  }

  .feature-slide {
    width: min(100%, 20rem);
    min-height: 12.7rem;
  }

  .feature-slide__content {
    padding: 1.65rem 1.45rem 1.3rem;
  }

  .feature-slide__chip {
    left: 1rem;
    bottom: 1rem;
    width: 3rem;
    height: 2.2rem;
  }

  .feature-slide__emblem {
    top: 4.2rem;
    width: 7rem;
    height: 7rem;
  }

  .feature-slide__interactive {
    transform:
      perspective(1400px)
      rotateZ(-1.4deg)
      rotateX(calc(var(--rotate-x) * 0.35))
      rotateY(calc(var(--rotate-y) * 0.35))
      translateY(var(--lift-y));
  }

  .feature-slide__title {
    font-size: 1rem;
  }

  .feature-slide__description {
    font-size: 0.62rem;
    max-width: 11rem;
  }

  .feature-slide__accent {
    font-size: 0.62rem;
  }

  .carousel-arrow {
    width: 3rem;
    height: 3rem;
  }

  .carousel-arrow--left {
    left: 0.75rem;
  }

  .carousel-arrow--right {
    right: 0.75rem;
  }

  .feature-slide--prev {
    transform: translateX(calc(-50% - 10.8rem)) scale(0.88);
  }

  .feature-slide--next {
    transform: translateX(calc(-50% + 10.8rem)) scale(0.88);
  }
}

@media (min-width: 769px) and (max-width: 1180px) {
  .carousel-stage {
    height: 24rem;
  }

  .feature-slide {
    width: min(100%, 27rem);
    min-height: 17rem;
  }

  .feature-slide__chip {
    left: 1.2rem;
    bottom: 1.15rem;
  }

  .feature-slide__content {
    padding: 1.95rem 1.7rem 1.55rem;
  }

  .feature-slide__emblem {
    top: 5rem;
    width: 8rem;
    height: 8rem;
  }

  .feature-slide__title {
    font-size: 1.2rem;
  }

  .feature-slide__description {
    font-size: 0.68rem;
    max-width: 14rem;
  }

  .feature-slide--prev {
    transform: translateX(calc(-50% - 17rem)) scale(0.88);
  }

  .feature-slide--next {
    transform: translateX(calc(-50% + 17rem)) scale(0.88);
  }
}
</style>
