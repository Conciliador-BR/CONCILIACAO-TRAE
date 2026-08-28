<template>
  <section class="w-full px-4 pb-20 sm:px-6 lg:px-8">
    <div class="w-full">
      <div class="overflow-hidden rounded-[36px] border border-black/8 bg-white p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)] lg:p-8">
        <div class="mb-6 text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.28em] text-black sm:text-base">
            Empresas que confiam em nosso trabalho
          </p>
        </div>

        <div class="mb-5 flex items-center justify-end gap-3">
          <button
            type="button"
            class="carousel-arrow"
            aria-label="Ver logos anteriores"
            @click="previousLogo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
            </svg>
          </button>

          <button
            type="button"
            class="carousel-arrow"
            aria-label="Ver mais logos"
            @click="nextLogo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
            </svg>
          </button>
        </div>

        <div class="supermarket-window">
          <div
            class="supermarket-track"
            :style="{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              '--items-per-view': itemsPerView
            }"
          >
            <div
              v-for="logo in clientLogos"
              :key="logo.name"
              class="supermarket-item"
            >
              <div class="supermarket-card">
              <div class="supermarket-card__inner">
                <img
                  :src="logo.src"
                  :alt="logo.name"
                  class="supermarket-logo"
                >
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
import { onBeforeUnmount, onMounted, ref } from 'vue'

const clientLogos = [
  { name: 'Archimedes', src: '/supermercados/archimedes.jfif' },
  { name: 'Estrela', src: '/supermercados/estrela.jfif' },
  { name: 'Familia', src: '/supermercados/familia.jpg' },
  { name: 'Filial 03 Familia', src: '/supermercados/filial 03 familia.jfif' },
  { name: 'Jaciana', src: '/supermercados/Jaciana.png' },
  { name: 'Manda Supermercados', src: '/supermercados/manda supermercados.jfif' },
  { name: 'MP dos Santos', src: '/supermercados/mp dos santos.jfif' },
  { name: 'Multishow Supermercados', src: '/supermercados/multishow supermercados.jpg' },
  { name: 'Norte Atacado', src: '/supermercados/norte atacado.png' }
]

const currentIndex = ref(0)
const itemsPerView = ref(3)
const getMaxIndex = () => Math.max(clientLogos.length - itemsPerView.value, 0)

const nextLogo = () => {
  const maxIndex = getMaxIndex()

  if (currentIndex.value >= maxIndex) {
    currentIndex.value = 0
    return
  }

  currentIndex.value += 1
}

const previousLogo = () => {
  const maxIndex = getMaxIndex()

  if (currentIndex.value <= 0) {
    currentIndex.value = maxIndex
    return
  }

  currentIndex.value -= 1
}

const syncItemsPerView = () => {
  if (window.innerWidth >= 1024) {
    itemsPerView.value = 3
  } else if (window.innerWidth >= 640) {
    itemsPerView.value = 2
  } else {
    itemsPerView.value = 1
  }

  const maxIndex = getMaxIndex()

  if (currentIndex.value > maxIndex) {
    currentIndex.value = maxIndex
  }
}

onMounted(() => {
  syncItemsPerView()
  window.addEventListener('resize', syncItemsPerView, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncItemsPerView)
})
</script>

<style scoped>
.supermarket-window {
  overflow: hidden;
  border-radius: 1.75rem;
  background: #ffffff;
}

.supermarket-track {
  display: flex;
  margin: 0 -0.5rem;
  transition: transform 0.45s ease;
}

.supermarket-item {
  box-sizing: border-box;
  flex: 0 0 calc(100% / var(--items-per-view));
  padding: 0 0.5rem;
  display: flex;
  justify-content: center;
}

.supermarket-card {
  display: flex;
  height: 10.5rem;
  width: 10.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.5rem;
  background: #ffffff;
}

.supermarket-card__inner {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #ffffff;
}

.supermarket-logo {
  height: 8rem;
  width: 8rem;
  border-radius: 9999px;
  object-fit: cover;
}

.carousel-arrow {
  display: inline-flex;
  height: 2.85rem;
  width: 2.85rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.94);
  color: #111827;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.carousel-arrow:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
}

.carousel-arrow:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.carousel-arrow svg {
  height: 1.3rem;
  width: 1.3rem;
}

@media (max-width: 768px) {
  .supermarket-card {
    height: 8.5rem;
    width: 8.5rem;
  }

  .supermarket-logo {
    height: 6.5rem;
    width: 6.5rem;
  }
}
</style>
