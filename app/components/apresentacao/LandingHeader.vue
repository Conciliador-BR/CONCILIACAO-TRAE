<template>
  <header class="sticky top-0 z-30 border-b border-[#244b77] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] backdrop-blur-xl">
    <div class="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6 py-4 lg:px-8">
      <div class="hidden md:block" />

      <div class="flex justify-center">
        <img src="/economic-card-logo.png" alt="Economic Card" class="h-20 w-auto sm:h-24 lg:h-28" />
      </div>

      <div class="flex items-center justify-end gap-3">
        <a href="#solucoes" class="hidden text-sm font-medium text-blue-100/85 transition hover:text-white md:inline-flex">
          Quem Somos
        </a>
        <a href="#operacao" class="hidden text-sm font-medium text-blue-100/85 transition hover:text-white md:inline-flex">
          Consultoria
        </a>
        <LandingPrimaryButton to="/login">Acessar Portal</LandingPrimaryButton>
      </div>
    </div>
    <div class="h-1 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#8ad795]"></div>
  </header>
</template>

<script setup>
import LandingPrimaryButton from './LandingPrimaryButton.vue'
</script>

<style scoped>
a {
  position: relative;
}

a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.35rem;
  width: 100%;
  height: 2px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
  background: linear-gradient(90deg, #73c77d, #a7e7af);
}

a:hover::after {
  transform: scaleX(1);
}
</style>
