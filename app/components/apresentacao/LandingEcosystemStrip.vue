<template>
  <section class="px-6 py-16 lg:px-8">
    <div class="mx-auto max-w-7xl rounded-[32px] border border-slate-200/80 bg-white/70 p-8 shadow-sm shadow-[#163a5a]/5 backdrop-blur-sm lg:p-10">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#163a5a]">Ecossistema conectado</p>
          <p class="mt-2 text-sm leading-7 text-slate-600">
            Estrutura visual inspirada em plataformas de conciliacao com foco em integracao, leitura
            executiva e confiabilidade operacional.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <span
            v-for="item in integrations"
            :key="item"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const integrations = ['Adquirentes', 'Bancos', 'Recebimentos', 'Pagamentos', 'Controladoria', 'Auditoria']
</script>
