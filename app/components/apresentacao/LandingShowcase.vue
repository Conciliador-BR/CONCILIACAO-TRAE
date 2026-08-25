<template>
  <section class="w-full px-4 py-20 sm:px-6 lg:px-8">
    <div class="w-full">
      <div>
        <LandingSectionHeading
          eyebrow="Na prática"
          title="Veja em uma tela o que seu supermercado vendeu, recebeu e ainda precisa conferir"
          description="As imagens mostram como o sistema organiza cartões, vouchers, bancos e divergências para o financeiro agir rápido."
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

      <div class="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div class="flex flex-col gap-5">
          <div class="rounded-[30px] border border-slate-200 bg-white p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <img
              src="/apresentacao/SISTEMA 1.png"
              alt="Mapa visual de automação e integrações financeiras"
              class="w-full rounded-[24px]"
            />
          </div>

          <div class="overflow-hidden rounded-[34px] border border-[#244b77]/12 bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] p-8 shadow-2xl shadow-[#163a5a]/15 lg:p-10">
            <div class="flex flex-col gap-5">
              <div>
                <span class="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                  Fale com um especialista
                </span>
                <h3 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Quer ver na prática onde seu supermercado pode recuperar dinheiro?
                </h3>
                <p class="mt-3 text-base leading-8 text-blue-100/85">
                  Nossa equipe analisa sua rotina, mostra como a conciliação funciona no dia a dia e ajuda você a enxergar diferenças, taxas e valores a receber.
                </p>
              </div>

              <div class="flex flex-col items-start gap-3">
                <a
                  href="https://wa.me/5528999463616?text=Ol%C3%A1%2C%20quero%20uma%20demonstra%C3%A7%C3%A3o%20da%20Economic%20Card"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#163a5a] shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Fale com um especialista
                </a>
                <p class="text-sm font-medium text-blue-100/80">
                  Atendimento direto pelo WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-[30px] border border-slate-200 bg-white p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <img
            src="/apresentacao/ANALISE_DE_RECEBIMENTOS.png"
            alt="Print da tela de análise de recebimentos"
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
    description: 'Seu financeiro para de procurar informação em várias planilhas e passa a enxergar a conferência em uma tela só.'
  },
  {
    title: 'Diferenças destacadas para agir rápido',
    description: 'Quando o valor não bate, a taxa veio errada ou o depósito não entrou como esperado, a tela mostra onde está o problema.'
  },
  {
    title: 'Histórico para cobrar e acompanhar',
    description: 'Você ganha contexto para cobrar adquirente, acompanhar pendências e fechar o financeiro com mais segurança.'
  }
]
</script>
