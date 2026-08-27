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
                <div class="feature-slide__stars" />
                <div class="feature-slide__particles" />
                <div class="feature-slide__grain" />
                <div class="feature-slide__wander" />
                <div class="feature-slide__holo" />
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
  '--rotate-z': '-0.8deg',
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
    '--rotate-z': `${(rotateY * 0.12).toFixed(2)}deg`,
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
  height: 33rem;
}

.feature-slide {
  position: relative;
  position: absolute;
  top: 0;
  left: 50%;
  width: min(100%, 40.5rem);
  min-height: 25.5rem;
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
  inset: 0;
  overflow: hidden;
  border-radius: 1.95rem;
  isolation: isolate;
  will-change: transform;
  transform-style: preserve-3d;
  transform:
    perspective(2200px)
    rotateZ(var(--rotate-z))
    rotateX(var(--rotate-x))
    rotateY(var(--rotate-y))
    translateY(var(--lift-y));
  transition:
    transform 0.16s ease-out,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.34),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.feature-slide__interactive::before {
  content: '';
  position: absolute;
  inset: -24%;
  background:
    radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(255, 255, 255, calc(var(--shine-alpha) * 1.1)) 0%, rgba(166, 233, 255, calc(var(--shine-alpha) * 0.9)) 12%, transparent 34%),
    radial-gradient(circle at calc(var(--pointer-x) + 8%) calc(var(--pointer-y) - 10%), rgba(51, 195, 240, calc(var(--shine-alpha) * 0.95)) 0%, transparent 22%);
  filter: blur(16px);
  pointer-events: none;
  z-index: 1;
}

.feature-slide__interactive:hover {
  box-shadow:
    0 30px 90px rgba(0, 0, 0, 0.46);
}

.feature-slide--ocean {
  background:
    radial-gradient(circle at 16% 82%, rgba(208, 241, 255, 0.42), transparent 34%),
    radial-gradient(circle at 84% 12%, rgba(15, 160, 206, 0.28), transparent 22%),
    linear-gradient(135deg, #001a33 0%, #003366 50%, #0056b3 100%);
}

.feature-slide--emerald {
  background:
    radial-gradient(circle at 16% 82%, rgba(208, 241, 255, 0.4), transparent 34%),
    radial-gradient(circle at 80% 14%, rgba(0, 195, 255, 0.24), transparent 22%),
    linear-gradient(135deg, #001a33 0%, #003a73 48%, #0fa0ce 100%);
}

.feature-slide--lagoon {
  background:
    radial-gradient(circle at 18% 80%, rgba(216, 244, 255, 0.42), transparent 34%),
    radial-gradient(circle at 84% 14%, rgba(51, 153, 255, 0.24), transparent 22%),
    linear-gradient(135deg, #001a33 0%, #003366 42%, #0fa0ce 100%);
}

.feature-slide--midnight {
  background:
    radial-gradient(circle at 18% 82%, rgba(212, 242, 255, 0.4), transparent 34%),
    radial-gradient(circle at 82% 14%, rgba(15, 160, 206, 0.24), transparent 20%),
    linear-gradient(135deg, #00162b 0%, #002b52 44%, #0056b3 100%);
}

.feature-slide__cosmos,
.feature-slide__stars,
.feature-slide__particles,
.feature-slide__grain,
.feature-slide__wander,
.feature-slide__holo,
.feature-slide__beam,
.feature-slide__nebula,
.feature-slide__halo {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.feature-slide__cosmos {
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.1) 0 1px, transparent 1px),
    radial-gradient(circle at 72% 26%, rgba(255, 255, 255, 0.08) 0 1.1px, transparent 1.1px),
    radial-gradient(circle at 84% 62%, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px),
    radial-gradient(circle at 28% 76%, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px);
  background-size: 16rem 16rem, 18rem 18rem, 14rem 14rem, 20rem 20rem;
  opacity: 0.32;
}

.feature-slide__stars {
  opacity: 0.36;
  background-image:
    radial-gradient(1.2px 1.2px at 10% 16%, rgba(255, 255, 255, 0.9), transparent 100%),
    radial-gradient(1px 1px at 22% 34%, rgba(255, 255, 255, 0.75), transparent 100%),
    radial-gradient(1.4px 1.4px at 36% 14%, rgba(255, 255, 255, 0.72), transparent 100%),
    radial-gradient(1px 1px at 52% 64%, rgba(255, 255, 255, 0.78), transparent 100%),
    radial-gradient(1.1px 1.1px at 74% 20%, rgba(255, 255, 255, 0.7), transparent 100%),
    radial-gradient(1.4px 1.4px at 88% 14%, rgba(255, 255, 255, 0.82), transparent 100%),
    radial-gradient(1px 1px at 82% 76%, rgba(255, 255, 255, 0.68), transparent 100%);
  animation: feature-stars-twinkle 4.8s ease-in-out infinite alternate;
}

.feature-slide__particles {
  inset: -8%;
  opacity: 0.42;
  background-image:
    radial-gradient(1px 1px at 12% 22%, rgba(191, 245, 255, 0.95), transparent 100%),
    radial-gradient(1px 1px at 18% 70%, rgba(255, 255, 255, 0.82), transparent 100%),
    radial-gradient(1px 1px at 42% 58%, rgba(191, 245, 255, 0.9), transparent 100%),
    radial-gradient(1px 1px at 68% 28%, rgba(255, 255, 255, 0.84), transparent 100%),
    radial-gradient(1px 1px at 84% 64%, rgba(191, 245, 255, 0.88), transparent 100%);
  animation: feature-particles-float 14s ease-in-out infinite;
}

.feature-slide__grain {
  opacity: 0.06;
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
    radial-gradient(circle at calc(var(--pointer-x) - 12%) calc(var(--pointer-y) + 6%), rgba(15, 160, 206, calc(var(--glow-alpha) * 0.78)) 0%, transparent 18%),
    radial-gradient(circle at 82% 16%, rgba(0, 195, 255, 0.2) 0%, transparent 24%);
  filter: blur(22px);
  opacity: 1;
}

.feature-slide__holo {
  inset: -12%;
  opacity: 0.52;
  mix-blend-mode: screen;
  background:
    linear-gradient(118deg, transparent 24%, rgba(255, 255, 255, 0.06) 34%, rgba(255, 255, 255, 0.22) 41%, rgba(51, 195, 240, 0.2) 47%, transparent 58%),
    linear-gradient(36deg, transparent 42%, rgba(51, 153, 255, 0.1) 49%, transparent 58%);
  background-size: 170% 170%;
  animation: feature-holo-shift 8.8s linear infinite;
}

.feature-slide__beam {
  opacity: 0.44;
  background:
    linear-gradient(115deg, transparent 26%, rgba(255, 255, 255, 0.16) 44%, transparent 56%),
    radial-gradient(circle at 50% -8%, rgba(255, 255, 255, 0.16), transparent 38%);
  mix-blend-mode: screen;
  animation: feature-aurora-sweep 6.5s ease-in-out infinite alternate;
}

.feature-slide__nebula {
  inset: auto auto 8% 10%;
  width: 68%;
  height: 56%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(218, 245, 255, 0.5) 0%, rgba(191, 245, 255, 0.26) 28%, rgba(147, 197, 253, 0.1) 52%, transparent 72%);
  filter: blur(34px);
  opacity: 0.72;
}

.feature-slide__halo {
  inset: auto -10% -16% auto;
  width: 54%;
  height: 70%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(15, 160, 206, 0.3) 0%, rgba(51, 153, 255, 0.18) 34%, transparent 66%);
  filter: blur(30px);
  opacity: 0.9;
}

.feature-slide__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.05), rgba(2, 6, 23, 0.12) 54%, rgba(2, 6, 23, 0.26)),
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
  background: rgba(15, 160, 206, 0.28);
}

.feature-slide__glow--cyan {
  background: rgba(51, 195, 240, 0.26);
}

.feature-slide__content {
  position: relative;
  z-index: 2;
  display: flex;
  height: calc(100% - 0.1rem);
  flex-direction: column;
  padding: 2.75rem 2.7rem 2.35rem;
}

.feature-slide__chip {
  position: absolute;
  left: 1.5rem;
  bottom: 1.55rem;
  width: 4.2rem;
  height: 3rem;
  border-radius: 0.44rem;
  background:
    linear-gradient(135deg, rgba(238, 244, 248, 0.96) 0%, rgba(208, 218, 226, 0.94) 38%, rgba(186, 198, 208, 0.96) 62%, rgba(231, 237, 242, 0.94) 100%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    inset 0 -1px 0 rgba(130, 142, 153, 0.18),
    0 10px 24px rgba(15, 23, 42, 0.16);
  opacity: 0.82;
  transform: translateZ(10px);
  filter: saturate(0.84);
  animation: feature-chip-pulse 4.4s ease-in-out infinite;
}

.feature-slide__emblem {
  position: absolute;
  inset: 7.3rem auto auto 50%;
  width: 11.4rem;
  height: 11.4rem;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  transform: translateZ(52px);
}

.feature-slide__copy {
  max-width: 78%;
  text-align: center;
}

.feature-slide__title {
  margin-top: 0;
  font-size: clamp(1.72rem, 2.55vw, 2.18rem);
  line-height: 1.08;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.feature-slide__description {
  margin-top: 1rem;
  max-width: 21.5rem;
  font-size: 0.98rem;
  line-height: 1.66;
  letter-spacing: 0.02em;
  color: rgba(240, 249, 255, 0.86);
  margin-left: auto;
  margin-right: auto;
}

.feature-slide__accent {
  flex-shrink: 0;
  align-self: center;
  font-size: 0.92rem;
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
  transform: translateX(calc(-50% - 26.5rem)) scale(0.9);
}

.feature-slide--next {
  z-index: 2;
  opacity: 0.34;
  filter: saturate(0.88);
  transform: translateX(calc(-50% + 26.5rem)) scale(0.9);
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

@keyframes feature-stars-twinkle {
  0%,
  100% {
    opacity: 0.18;
  }
  50% {
    opacity: 0.42;
  }
}

@keyframes feature-particles-float {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(1.6%, -1.8%, 0) scale(1.03);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes feature-holo-shift {
  0% {
    background-position: 0% 50%, 0% 50%;
  }
  50% {
    background-position: 100% 50%, 100% 50%;
  }
  100% {
    background-position: 0% 50%, 0% 50%;
  }
}

@keyframes feature-aurora-sweep {
  0% {
    transform: translate3d(-2%, 0, 0);
    opacity: 0.32;
  }
  100% {
    transform: translate3d(2%, -1%, 0);
    opacity: 0.48;
  }
}

@keyframes feature-chip-pulse {
  0%,
  100% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.26),
      0 10px 24px rgba(15, 23, 42, 0.12);
  }
  50% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.34),
      0 10px 24px rgba(15, 23, 42, 0.16),
      0 0 18px rgba(191, 245, 255, 0.22);
  }
}

@media (max-width: 768px) {
  .carousel-stage {
    height: 25.5rem;
  }

  .feature-slide {
    width: min(100%, 23.5rem);
    min-height: 15.8rem;
  }

  .feature-slide__content {
    padding: 2.05rem 1.8rem 1.55rem;
  }

  .feature-slide__chip {
    left: 1rem;
    bottom: 1rem;
    width: 3rem;
    height: 2.2rem;
  }

  .feature-slide__emblem {
    top: 5.1rem;
    width: 8.2rem;
    height: 8.2rem;
  }

  .feature-slide__interactive {
    transform:
      perspective(1400px)
      rotateZ(calc(var(--rotate-z) * 0.65))
      rotateX(calc(var(--rotate-x) * 0.35))
      rotateY(calc(var(--rotate-y) * 0.35))
      translateY(var(--lift-y));
  }

  .feature-slide__title {
    font-size: 1.28rem;
  }

  .feature-slide__description {
    font-size: 0.8rem;
    max-width: 14rem;
  }

  .feature-slide__accent {
    font-size: 0.74rem;
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
    transform: translateX(calc(-50% - 12.6rem)) scale(0.88);
  }

  .feature-slide--next {
    transform: translateX(calc(-50% + 12.6rem)) scale(0.88);
  }
}

@media (min-width: 769px) and (max-width: 1180px) {
  .carousel-stage {
    height: 29rem;
  }

  .feature-slide {
    width: min(100%, 33rem);
    min-height: 21.2rem;
  }

  .feature-slide__chip {
    left: 1.2rem;
    bottom: 1.15rem;
  }

  .feature-slide__content {
    padding: 2.35rem 2.1rem 1.95rem;
  }

  .feature-slide__emblem {
    top: 6.2rem;
    width: 9.5rem;
    height: 9.5rem;
  }

  .feature-slide__title {
    font-size: 1.56rem;
  }

  .feature-slide__description {
    font-size: 0.88rem;
    max-width: 17.5rem;
  }

  .feature-slide--prev {
    transform: translateX(calc(-50% - 21.2rem)) scale(0.88);
  }

  .feature-slide--next {
    transform: translateX(calc(-50% + 21.2rem)) scale(0.88);
  }
}
</style>
