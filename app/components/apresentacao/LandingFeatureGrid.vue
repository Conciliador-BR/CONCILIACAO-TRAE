<template>
  <section id="solucoes" class="relative overflow-hidden scroll-mt-36 bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77]">
    <div class="absolute inset-x-0 top-10 -z-10 h-80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
    <div class="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div class="quem-somos-heading">
        <LandingSectionHeading
          eyebrow="Quem Somos"
          title="Conciliação de cartões para supermercados que precisam conferir o que venderam, o que caiu na conta e o que foi cobrado a mais."
        />
      </div>

      <div
        class="quem-somos-carousel mt-12"
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
              :class="[feature.themeClass, getSlideClass(index)]"
            >
              <div class="feature-slide__overlay" />
              <div class="feature-slide__glow" :class="feature.glowClass" />

              <div class="feature-slide__content">
                <div class="feature-slide__copy">
                  <h3 class="feature-slide__title">{{ feature.title }}</h3>
                  <p class="feature-slide__description">{{ feature.description }}</p>
                </div>
              </div>

              <div class="feature-slide__brand">
                <img src="/economic-card-logo.png" alt="Economic Card" class="feature-slide__brand-image">
              </div>
            </article>
          </div>
        </div>

        <button
          type="button"
          class="carousel-arrow carousel-arrow--right"
          aria-label="Ver proximo card"
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
import { onBeforeUnmount, onMounted, ref } from 'vue'
import LandingSectionHeading from './LandingSectionHeading.vue'

const features = [
  {
    title: 'Conciliação de Vendas',
    description: 'Mostra quando a venda do cartão ou voucher entrou com valor diferente, taxa acima do combinado ou cadastro fora do padrão.',
    iconPath: 'M3 10h18M7 15h1m4 0h5M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
    themeClass: 'feature-slide--blue',
    glowClass: 'feature-slide__glow--green'
  },
  {
    title: 'Recebimentos e Pagamentos',
    description: 'Ajuda seu financeiro a conferir o que foi vendido, o que realmente entrou na conta e o que ainda precisa ser cobrado.',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V5m0 11v3m-7-7h14',
    themeClass: 'feature-slide--wine',
    glowClass: 'feature-slide__glow--pink'
  },
  {
    title: 'Extratos Bancários',
    description: 'Liga cada depósito do banco aos cartões e vouchers para o supermercado entender rápido o que entrou, faltou ou divergiu.',
    iconPath: 'M4 6h16M4 10h16M6 14h4m4 0h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z',
    themeClass: 'feature-slide--teal',
    glowClass: 'feature-slide__glow--cyan'
  },
  {
    title: 'Controladoria Personalizada',
    description: 'Nossos especialistas acompanham a rotina do seu supermercado, analisam divergências e ajudam a recuperar dinheiro e organizar o fechamento.',
    iconPath: 'M9 17v-6m4 6V7m4 10V4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H9L7 7H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    themeClass: 'feature-slide--gold',
    glowClass: 'feature-slide__glow--gold'
  }
]

const activeIndex = ref(0)
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
  iniciarAutoplay()
})

onBeforeUnmount(() => {
  pausarAutoplay()
})
</script>

<style scoped>
.quem-somos-heading :deep(span) {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.quem-somos-heading :deep(h2) {
  color: #ffffff;
}

.quem-somos-carousel {
  position: relative;
  max-width: 72rem;
  margin-left: auto;
  margin-right: auto;
}

.carousel-window {
  overflow: hidden;
  border-radius: 2rem;
}

.carousel-stage {
  position: relative;
  height: 32rem;
}

.feature-slide {
  position: relative;
  position: absolute;
  top: 0;
  left: 50%;
  width: min(100%, 54rem);
  min-height: 32rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2rem;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
  transform-origin: center center;
  transition: transform 0.55s ease, opacity 0.55s ease, filter 0.55s ease;
}

.feature-slide--blue {
  background:
    radial-gradient(circle at top left, rgba(145, 115, 255, 0.42), transparent 34%),
    linear-gradient(135deg, #6551d9 0%, #7b6af0 46%, #8e7ff3 100%);
}

.feature-slide--wine {
  background:
    radial-gradient(circle at top center, rgba(255, 170, 190, 0.18), transparent 26%),
    linear-gradient(135deg, #761030 0%, #972348 48%, #b81f4e 100%);
}

.feature-slide--teal {
  background:
    radial-gradient(circle at top left, rgba(54, 205, 181, 0.18), transparent 30%),
    linear-gradient(135deg, #022f30 0%, #044a46 45%, #06635f 100%);
}

.feature-slide--gold {
  background:
    radial-gradient(circle at top left, rgba(255, 236, 138, 0.18), transparent 30%),
    linear-gradient(135deg, #9a6900 0%, #c88d05 50%, #e7b70f 100%);
}

.feature-slide__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 10, 18, 0.04), rgba(5, 10, 18, 0.3) 64%, rgba(5, 10, 18, 0.54));
}

.feature-slide__glow {
  position: absolute;
  right: -5rem;
  bottom: -6rem;
  width: 18rem;
  height: 18rem;
  border-radius: 9999px;
  filter: blur(26px);
  opacity: 0.72;
}

.feature-slide__glow--green {
  background: rgba(115, 199, 125, 0.38);
}

.feature-slide__glow--pink {
  background: rgba(255, 121, 160, 0.34);
}

.feature-slide__glow--cyan {
  background: rgba(71, 224, 210, 0.28);
}

.feature-slide__glow--gold {
  background: rgba(255, 226, 104, 0.34);
}

.feature-slide__content {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 2rem 3.15rem;
}

.feature-slide__copy {
  max-width: 58rem;
  text-align: center;
  transform: translateY(3.4rem);
}

.feature-slide__title {
  margin-top: 0.9rem;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1.02;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);
}

.feature-slide__description {
  margin-top: 1rem;
  max-width: 48rem;
  font-size: 1.12rem;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.9);
}

.feature-slide__brand {
  position: absolute;
  left: 50%;
  bottom: 0.15rem;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.feature-slide__brand-image {
  width: 7rem;
  height: auto;
  object-fit: contain;
  opacity: 0.9;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.18));
}

.feature-slide--active {
  z-index: 3;
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.feature-slide--prev {
  z-index: 2;
  opacity: 0.42;
  filter: saturate(0.9);
  transform: translateX(calc(-50% - 28rem)) scale(0.88);
}

.feature-slide--next {
  z-index: 2;
  opacity: 0.42;
  filter: saturate(0.9);
  transform: translateX(calc(-50% + 28rem)) scale(0.88);
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
  background: #ff2a17;
  color: #111827;
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
    height: 27rem;
  }

  .feature-slide {
    width: min(100%, 22rem);
    min-height: 27rem;
  }

  .feature-slide__content {
    padding: 1.5rem 1.5rem 2.8rem;
  }

  .feature-slide__brand-image {
    width: 5.6rem;
  }

  .feature-slide__copy {
    transform: translateY(1.9rem);
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
    transform: translateX(calc(-50% - 11.6rem)) scale(0.9);
  }

  .feature-slide--next {
    transform: translateX(calc(-50% + 11.6rem)) scale(0.9);
  }
}

@media (min-width: 769px) and (max-width: 1180px) {
  .carousel-stage {
    height: 30rem;
  }

  .feature-slide {
    width: min(100%, 44rem);
    min-height: 30rem;
  }

  .feature-slide__brand-image {
    width: 6.2rem;
  }

  .feature-slide__copy {
    transform: translateY(2.6rem);
  }

  .feature-slide--prev {
    transform: translateX(calc(-50% - 20rem)) scale(0.9);
  }

  .feature-slide--next {
    transform: translateX(calc(-50% + 20rem)) scale(0.9);
  }
}
</style>
