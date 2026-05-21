<template>
  <header class="sticky top-0 z-30 border-b border-white/10 bg-[#081525]/85 backdrop-blur-xl">
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
      <div class="flex items-center gap-5">
        <img src="/economic-card-logo.png" alt="Economic Card" class="h-14 w-auto sm:h-16 lg:h-20" />
        <div class="hidden sm:block">
          <p class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-100">Economic Card</p>
          <p class="text-xs text-blue-200/75">Plataforma de conciliação e gestão financeira</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <a href="#solucoes" class="hidden text-sm font-medium text-blue-100/85 transition hover:text-white md:inline-flex">
          Soluções
        </a>
        <a href="#operacao" class="hidden text-sm font-medium text-blue-100/85 transition hover:text-white md:inline-flex">
          Operação
        </a>
        <LandingPrimaryButton to="/login">Acessar Portal</LandingPrimaryButton>
      </div>
    </div>
  </header>
</template>

<script setup>
import LandingPrimaryButton from './LandingPrimaryButton.vue'
</script>
