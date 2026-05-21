<template>
  <section class="px-6 pb-20 lg:px-8">
    <div class="mx-auto grid w-full max-w-7xl gap-8 overflow-hidden rounded-[36px] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] p-8 shadow-2xl shadow-[#163a5a]/20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-12">
      <div>
        <span class="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">
          Pronto para começar
        </span>
        <h2 class="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Acesse o portal e conheça uma operação de conciliação com padrão enterprise.
        </h2>
        <p class="mt-4 max-w-2xl text-base leading-8 text-blue-100/85">
          Estruture uma rotina mais segura, visual e profissional para acompanhar vendas, bancos, recebimentos e exceções críticas.
        </p>

        <div class="mt-8">
          <LandingPrimaryButton to="/login" variant="secondary">Acessar Portal</LandingPrimaryButton>
        </div>
      </div>

      <div class="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <img
          src="/apresentacao/hero-dashboard.svg"
          alt="Visão executiva do portal de conciliação"
          class="w-full rounded-[24px] border border-white/10"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingPrimaryButton from './LandingPrimaryButton.vue'
</script>
