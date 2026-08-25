<template>
  <section class="w-full px-4 py-20 sm:px-6 lg:px-8">
    <div class="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div>
        <LandingSectionHeading
          eyebrow="Na pratica"
          title="Veja em uma tela o que seu supermercado vendeu, recebeu e ainda precisa conferir"
          description="As imagens mostram como o sistema organiza cartoes, vouchers, bancos e divergencias para o financeiro agir rapido."
        />

        <div class="mt-8 space-y-4">
          <div
            v-for="item in bullets"
            :key="item.title"
            class="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#244b77]/15 hover:shadow-xl"
          >
            <h3 class="text-lg font-semibold text-slate-900 transition-colors duration-300 group-hover:text-[#163a5a]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-7 text-slate-600">{{ item.description }}</p>
          </div>
        </div>
      </div>

      <div class="grid gap-5">
        <div class="rounded-[30px] border border-slate-200 bg-white p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <img
            src="/apresentacao/SISTEMA 1.png"
            alt="Mapa visual de automação e integrações financeiras"
            class="w-full rounded-[24px]"
          />
        </div>
        <div class="rounded-[30px] border border-slate-200 bg-white p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <img
            src="/apresentacao/ANALISE_DE_RECEBIMENTOS.png"
            alt="Print da tela de analise de recebimentos"
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
    title: 'Vendas, recebimentos e bancos no mesmo lugar',
    description: 'Seu financeiro para de procurar informacao em varias planilhas e passa a enxergar a conferencia em uma tela so.'
  },
  {
    title: 'Diferencas destacadas para agir rapido',
    description: 'Quando o valor nao bate, a taxa veio errada ou o deposito nao entrou como esperado, a tela mostra onde esta o problema.'
  },
  {
    title: 'Historico para cobrar e acompanhar',
    description: 'Voce ganha contexto para cobrar adquirente, acompanhar pendencias e fechar o financeiro com mais seguranca.'
  }
]
</script>
