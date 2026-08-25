<template>
  <section class="w-full px-4 pb-20 sm:px-6 lg:px-8">
    <div class="w-full">
      <div
        class="overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/80 p-6 shadow-sm shadow-[#163a5a]/5 backdrop-blur-sm lg:p-8"
        @mouseenter="pauseAutoplay"
        @mouseleave="startAutoplay"
      >
        <div class="supermarket-window">
          <div class="supermarket-stage">
            <div
              v-for="(logo, index) in clientLogos"
              :key="logo.name"
              class="supermarket-card"
              :class="getLogoCardClass(index)"
            >
              <div class="flex h-full items-center justify-center rounded-[1.4rem] border border-white/40 bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 shadow-inner">
                <img
                  :src="logo.src"
                  :alt="logo.name"
                  class="h-16 w-auto max-w-[9.5rem] object-contain"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const clientLogos = [
  { name: 'Estrela', src: '/supermercados/estrela.jfif' },
  { name: 'Familia', src: '/supermercados/familia.jpg' },
  { name: 'Filial 03 Familia', src: '/supermercados/filial 03 familia.jfif' },
  { name: 'Jaciana', src: '/supermercados/Jaciana.png' },
  { name: 'Manda Supermercados', src: '/supermercados/manda supermercados.jfif' },
  { name: 'Multishow Supermercados', src: '/supermercados/multishow supermercados.jpg' },
  { name: 'Norte Atacado', src: '/supermercados/norte atacado.png' }
]

const activeLogoIndex = ref(0)
let supermarketAutoplay = null

const nextLogo = () => {
  activeLogoIndex.value = (activeLogoIndex.value + 1) % clientLogos.length
}

const getRelativeLogoOffset = (index) => {
  const total = clientLogos.length
  let diff = index - activeLogoIndex.value

  if (diff > total / 2) diff -= total
  if (diff < -total / 2) diff += total

  return diff
}

const getLogoCardClass = (index) => {
  const offset = getRelativeLogoOffset(index)

  if (offset === 0) return 'supermarket-card--active'
  if (offset === -1) return 'supermarket-card--prev'
  if (offset === 1) return 'supermarket-card--next'
  return 'supermarket-card--hidden'
}

const pauseAutoplay = () => {
  if (supermarketAutoplay) {
    clearInterval(supermarketAutoplay)
    supermarketAutoplay = null
  }
}

const startAutoplay = () => {
  pauseAutoplay()
  supermarketAutoplay = setInterval(() => {
    nextLogo()
  }, 3500)
}

onMounted(() => {
  startAutoplay()
})

onBeforeUnmount(() => {
  pauseAutoplay()
})
</script>

<style scoped>
.supermarket-window {
  overflow: hidden;
  border-radius: 1.75rem;
}

.supermarket-stage {
  position: relative;
  height: 8.75rem;
}

.supermarket-card {
  position: absolute;
  top: 0;
  left: 50%;
  width: min(100%, 18rem);
  height: 8.75rem;
  border: 1px solid rgb(226 232 240 / 0.9);
  border-radius: 1.6rem;
  background: linear-gradient(135deg, rgb(255 255 255), rgb(241 245 249));
  padding: 0.65rem;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.1);
  transform-origin: center center;
  transition: transform 0.45s ease, opacity 0.45s ease;
  overflow: hidden;
}

.supermarket-card--active {
  z-index: 3;
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.supermarket-card--prev {
  z-index: 2;
  opacity: 0.42;
  transform: translateX(calc(-50% - 9rem)) scale(0.9);
}

.supermarket-card--next {
  z-index: 2;
  opacity: 0.42;
  transform: translateX(calc(-50% + 9rem)) scale(0.9);
}

.supermarket-card--hidden {
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) scale(0.82);
}

@media (max-width: 768px) {
  .supermarket-stage {
    height: 7.5rem;
  }

  .supermarket-card {
    width: min(100%, 13.5rem);
    height: 7.5rem;
    padding: 0.5rem;
  }

  .supermarket-card--prev {
    transform: translateX(calc(-50% - 7rem)) scale(0.9);
  }

  .supermarket-card--next {
    transform: translateX(calc(-50% + 7rem)) scale(0.9);
  }
}
</style>
