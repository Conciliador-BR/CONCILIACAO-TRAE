<template>
  <section class="relative overflow-hidden bg-[#081525]">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(31,79,119,0.45),_transparent_34%),radial-gradient(circle_at_left,_rgba(115,199,125,0.14),_transparent_30%)]" />
    <div class="relative mx-auto grid w-full max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
      <div>
        <div class="mb-8">
          <img
            src="/economic-card-logo.png"
            alt="Economic Card"
            class="h-20 w-auto sm:h-24 lg:h-28"
          />
        </div>

        <span class="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">
          Conciliação Empresarial de Alta Performance
        </span>
        <h1 class="mt-6 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Controle total sobre vendas, recebimentos, bancos e divergências operacionais.
        </h1>
        <p class="mt-6 max-w-2xl text-lg leading-8 text-blue-100/80">
          Uma experiência profissional para acompanhar transações, identificar perdas, automatizar conferências e acelerar a tomada de decisão financeira com visibilidade ponta a ponta.
        </p>

        <div class="mt-8 max-w-2xl rounded-[28px] border border-white/10 bg-white/8 p-6 backdrop-blur-md">
          <p class="text-2xl font-bold leading-tight text-white sm:text-3xl">
            Seu negócio não para. Sua conciliação também não.
          </p>
          <p class="mt-3 text-lg font-medium text-blue-100">
            Quem busca precisão, escolhe Economic Card.
          </p>
        </div>

        <div class="mt-8 flex flex-wrap items-center gap-4">
          <LandingPrimaryButton to="/login">Acessar Portal</LandingPrimaryButton>
          <LandingPrimaryButton to="#solucoes" variant="secondary" :show-arrow="false">
            Conhecer Soluções
          </LandingPrimaryButton>
        </div>

        <div class="mt-10 grid gap-4 sm:grid-cols-3">
          <LandingStatCard value="+99%" label="visibilidade operacional" />
          <LandingStatCard value="24/7" label="monitoramento e auditoria" />
          <LandingStatCard value="360°" label="visão unificada da operação" />
        </div>
      </div>

      <div class="relative">
        <div class="absolute -left-8 top-8 h-32 w-32 rounded-full bg-[#73c77d]/20 blur-3xl" />
        <div class="absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-[#1f4f77]/35 blur-3xl" />
        <div class="relative rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md">
          <img
            src="/apresentacao/hero-dashboard.svg"
            alt="Painel executivo de conciliação financeira"
            class="w-full rounded-[24px] border border-white/10 bg-slate-950/20"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingPrimaryButton from './LandingPrimaryButton.vue'
import LandingStatCard from './LandingStatCard.vue'
</script>
