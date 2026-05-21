<template>
  <section class="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
    <div class="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div>
        <LandingSectionHeading
          eyebrow="Visibilidade"
          title="Design executivo com profundidade operacional"
          description="A apresentação destaca painéis, automação e trilha de auditoria em uma linguagem visual compatível com operações de conciliação de alto nível."
        />

        <div class="mt-8 space-y-4">
          <div
            v-for="item in bullets"
            :key="item.title"
            class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 class="text-lg font-semibold text-slate-900">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-7 text-slate-600">{{ item.description }}</p>
          </div>
        </div>
      </div>

      <div class="grid gap-5">
        <div class="rounded-[30px] border border-slate-200 bg-white p-4 shadow-xl">
          <img
            src="/apresentacao/reconciliation-network.svg"
            alt="Mapa visual de automação e integrações financeiras"
            class="w-full rounded-[24px]"
          />
        </div>
        <div class="rounded-[30px] border border-slate-200 bg-white p-4 shadow-xl">
          <img
            src="/apresentacao/security-audit.svg"
            alt="Painel visual de segurança, compliance e auditoria"
            class="w-full rounded-[24px]"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingSectionHeading from './LandingSectionHeading.vue'

const bullets = [
  {
    title: 'Painéis claros para liderança',
    description: 'Indicadores, variações e alertas em uma leitura rápida para diretoria, controladoria e operações.'
  },
  {
    title: 'Integrações visíveis e organizadas',
    description: 'A tela comunica robustez com conectividade entre bancos, operadoras, extratos, agendas e eventos.'
  },
  {
    title: 'Confiabilidade e rastreabilidade',
    description: 'Segurança, histórico técnico, governança e auditoria apresentados como parte central da proposta.'
  }
]
</script>
