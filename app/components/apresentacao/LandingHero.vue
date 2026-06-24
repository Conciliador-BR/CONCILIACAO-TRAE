<template>
  <section class="relative overflow-hidden bg-[#081525]">
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style="background-image: url('/apresentacao/Fundo_page_principal.png');"
    />
    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,14,26,0.58),rgba(6,21,37,0.5),rgba(7,29,49,0.42))]" />
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(31,79,119,0.16),_transparent_34%),radial-gradient(circle_at_left,_rgba(115,199,125,0.05),_transparent_30%)]" />
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div class="relative mx-auto w-full max-w-[90rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div class="hero-copy mx-auto flex max-w-[72rem] flex-col items-center text-center">
        <h1 class="hero-title mt-6 max-w-5xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Sua empresa recebe tudo o que deveria receber?
        </h1>
        <div class="hero-subtitle-card mt-8 inline-flex max-w-fit rounded-2xl border border-white/14 bg-white/[0.04] px-6 py-4 shadow-[0_28px_90px_rgba(3,14,26,0.34)] backdrop-blur-xl">
          <p class="hero-subtitle text-lg font-bold leading-7 text-white">
            Quem não concilia, perde dinheiro.
          </p>
        </div>

        <div class="mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
          <LandingStatCard value="+1 milhão" label="Recuperados" />
          <LandingStatCard value="+100 mil" label="Economizados em Taxas" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingStatCard from './LandingStatCard.vue'
</script>

<style scoped>
.hero-copy {
  animation: heroFadeUp 0.8s ease both;
}

.hero-title {
  text-shadow: 0 10px 28px rgba(3, 14, 26, 0.42);
}

.hero-subtitle {
  text-shadow: 0 6px 18px rgba(3, 14, 26, 0.35);
}

.hero-subtitle-card {
  animation: heroSubtitlePulse 2.8s ease-in-out infinite;
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

@keyframes heroSubtitlePulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 28px 90px rgba(3, 14, 26, 0.28);
  }

  50% {
    transform: scale(1.025);
    box-shadow: 0 30px 96px rgba(3, 14, 26, 0.36);
  }
}
</style>
