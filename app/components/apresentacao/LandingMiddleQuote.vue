<template>
  <section class="w-full px-4 py-20 sm:px-6 lg:px-8">
    <div class="grid w-full gap-12 overflow-hidden rounded-[36px] border border-[#244b77]/10 bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] p-8 shadow-2xl shadow-[#163a5a]/20 sm:p-12 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
      <div class="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <p class="text-2xl font-semibold leading-tight text-blue-50 sm:text-3xl lg:text-4xl">
          Seu time cuida da loja.
        </p>
        <p class="mt-3 text-2xl font-semibold leading-tight text-blue-50 sm:text-3xl lg:text-4xl">
          A Economic Card cuida da conferência dos cartões.
        </p>
        <p class="mt-7 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
          Software e consultoria para encontrar diferenças, recuperar valores e dar segurança ao financeiro.
        </p>
      </div>

      <div class="relative quote-visual">
        <div class="absolute -left-6 top-8 h-28 w-28 rounded-full bg-[#73c77d]/20 blur-3xl" />
        <div class="absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-[#1f4f77]/35 blur-3xl" />
        <div class="quote-panel">
          <video
            ref="videoEl"
            class="quote-media"
            autoplay
            muted
            loop
            playsinline
            webkit-playsinline="true"
            disablepictureinpicture
            preload="auto"
            poster="/apresentacao/hero-dashboard.svg"
            @loadeddata="garantirReproducao"
            @canplay="garantirReproducao"
          >
            <source src="/apresentacao/Videos_do_Sistema.mp4" type="video/mp4">
            Seu navegador não suporta a reprodução do vídeo.
          </video>
        </div>
        <div class="quote-badges">
          <div class="floating-badge">
            <span class="floating-badge__label">Diferenças e taxas</span>
            <strong class="floating-badge__value">O que foi cobrado a mais aparece rápido</strong>
          </div>
          <div class="floating-badge">
            <span class="floating-badge__label">Depósitos</span>
            <strong class="floating-badge__value">Você enxerga o que caiu e o que faltou cair</strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const videoEl = ref(null)

const garantirReproducao = async () => {
  if (!videoEl.value || !import.meta.client) return

  try {
    videoEl.value.muted = true
    videoEl.value.defaultMuted = true
    videoEl.value.loop = true
    await videoEl.value.play()
  } catch {
    // O navegador pode recusar temporariamente; tentamos novamente em eventos de carregamento.
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    garantirReproducao()
  }
}

onMounted(async () => {
  await nextTick()
  garantirReproducao()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.quote-visual {
  animation: heroFadeUp 0.95s ease 0.1s both;
}

.quote-panel {
  position: relative;
  border-radius: 2.2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.85rem;
  box-shadow: 0 24px 56px rgba(6, 17, 29, 0.28);
  backdrop-filter: blur(16px);
  animation: floatPanel 8s ease-in-out infinite;
}

.quote-media {
  display: block;
  width: 100%;
  min-height: 24rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(2, 6, 23, 0.35);
  object-fit: cover;
  aspect-ratio: 16 / 10;
  pointer-events: none;
}

.quote-badges {
  margin-top: 1rem;
  display: grid;
  gap: 0.9rem;
}

.floating-badge {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 1.4rem;
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(16px);
  padding: 0.95rem 1rem;
  box-shadow: 0 18px 40px rgba(6, 17, 29, 0.28);
  animation: floatBadge 7s ease-in-out infinite;
}

.floating-badge__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(191, 219, 254, 0.88);
}

.floating-badge__value {
  font-size: 0.96rem;
  line-height: 1.4;
  color: #ffffff;
}

.quote-badges .floating-badge:nth-child(2) {
  animation-delay: 1.2s;
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

@keyframes floatPanel {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes floatBadge {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (max-width: 1023px) {
  .quote-media {
    min-height: 19rem;
  }

  .quote-badges {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1024px) {
  .quote-media {
    min-height: 31rem;
  }

  .quote-badges {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
