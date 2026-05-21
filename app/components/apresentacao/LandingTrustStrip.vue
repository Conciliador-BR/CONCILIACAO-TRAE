<template>
  <section class="border-y border-slate-200/80 bg-white/80">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#163a5a]">Ecossistema conectado</p>
        <p class="mt-2 text-sm text-slate-600">Estrutura visual inspirada em plataformas de conciliação com foco em integração, leitura executiva e confiabilidade operacional.</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <span
            v-for="item in integrations"
            :key="item"
            class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-[28px] border border-[#244b77]/12 bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] p-6 shadow-lg shadow-[#163a5a]/12">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100/80">Resultado comprovado</p>
          <p class="mt-3 text-3xl font-bold text-white sm:text-4xl">+1 milhão</p>
          <p class="mt-2 text-sm leading-7 text-blue-100/85">já recuperados para nossos clientes com uma operação de conciliação mais precisa, estratégica e orientada por dados.</p>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#163a5a]">Eficiência financeira</p>
          <p class="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">+100 mil</p>
          <p class="mt-2 text-sm leading-7 text-slate-600">em taxas reduzidas, convertendo conferência operacional em economia real para nossos clientes.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const integrations = ['Adquirentes', 'Bancos', 'Recebimentos', 'Pagamentos', 'Controladoria', 'Auditoria']
</script>
