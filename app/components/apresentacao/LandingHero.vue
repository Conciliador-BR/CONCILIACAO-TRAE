<template>
  <section class="relative overflow-hidden bg-[#081525]">
    <img
      src="/apresentacao/Fundo_page_principal.png"
      alt=""
      class="absolute inset-0 h-full w-full object-cover pointer-events-none"
    >
    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,14,26,0.58),rgba(6,21,37,0.5),rgba(7,29,49,0.42))]" />
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(31,79,119,0.16),_transparent_34%),radial-gradient(circle_at_left,_rgba(115,199,125,0.05),_transparent_30%)]" />
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div class="relative mx-auto flex min-h-[24rem] w-full items-center justify-center px-4 py-20 sm:min-h-[28rem] sm:px-6 sm:py-24 lg:min-h-[34rem] lg:px-8 lg:py-28">
      <div class="hero-copy mx-auto flex max-w-[72rem] flex-col items-center text-center">
        <h1 class="hero-title mt-6 max-w-5xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Seu supermercado vende no cartão, mas recebe o valor certo?
        </h1>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.hero-copy {
  animation: heroFadeUp 0.8s ease both;
}

.hero-title {
  text-shadow: 0 10px 28px rgba(3, 14, 26, 0.42);
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

</style>
