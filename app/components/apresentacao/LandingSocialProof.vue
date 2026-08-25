<template>
  <section id="prova-social" class="w-full scroll-mt-36 px-4 py-20 sm:px-6 lg:px-8">
    <div class="w-full">
      <div class="overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/80 p-8 shadow-sm shadow-[#163a5a]/5 backdrop-blur-sm lg:p-10">
        <div class="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <LandingSectionHeading
              eyebrow="Prova Social"
              title="Quase 60 empresas atendidas, a maioria por indicacao"
              description="A Economic Card cresce principalmente por recomendacao de clientes que ja vivem na pratica a rotina de conferencia de cartoes, vouchers e recebimentos."
            />

            <div class="mt-8 grid gap-4 sm:grid-cols-3">
              <div
                v-for="logo in clientLogos"
                :key="logo.name"
                class="rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm"
              >
                <div class="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                  <img
                    :src="logo.src"
                    :alt="logo.name"
                    class="h-12 w-auto max-w-[8rem] object-contain"
                  >
                </div>
                <p class="mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {{ logo.name }}
                </p>
              </div>
            </div>

            <div class="mt-8 rounded-[28px] border border-[#73c77d]/30 bg-[linear-gradient(180deg,rgba(115,199,125,0.14),rgba(126,206,137,0.08),rgba(138,215,149,0.12))] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#163a5a]">
                Diferencial Economic Card
              </p>
              <p class="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Voce nao contrata so um sistema.
              </p>
              <p class="mt-2 text-base leading-7 text-slate-700">
                Seu supermercado conta com consultoria personalizada de especialistas para analisar diferencas,
                taxas, atrasos e valores que precisam ser cobrados.
              </p>
            </div>
          </div>

          <div class="grid gap-5">
            <article
              v-for="testimonial in testimonials"
              :key="`${testimonial.name}-${testimonial.market}`"
              class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#102a43] via-[#163a5a] to-[#1f4f77] text-lg font-bold text-white shadow-md">
                  {{ testimonial.initials }}
                </div>

                <div class="min-w-0">
                  <p class="text-base leading-7 text-slate-700">
                    "{{ testimonial.quote }}"
                  </p>

                  <div class="mt-4 border-t border-slate-200 pt-4">
                    <p class="text-sm font-bold text-slate-900">
                      {{ testimonial.name }}
                    </p>
                    <p class="mt-1 text-sm text-slate-600">
                      {{ testimonial.role }}
                    </p>
                    <p class="text-sm font-semibold text-[#163a5a]">
                      {{ testimonial.market }}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <div class="rounded-[28px] border border-slate-200 bg-[#f8fbfe] p-6 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#163a5a]">
                Importante
              </p>
              <p class="mt-3 text-sm leading-7 text-slate-600">
                Os logos e depoimentos abaixo estao como placeholder ate voce me passar os nomes reais dos clientes e supermercados.
              </p>
              <!-- TODO: substituir logos e depoimentos pelos dados reais dos clientes -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingSectionHeading from './LandingSectionHeading.vue'

const clientLogos = [
  // TODO: substituir pelos logos reais dos clientes
  { name: 'Cliente 1', src: '/prova-social/cliente-1.png' },
  { name: 'Cliente 2', src: '/prova-social/cliente-2.png' },
  { name: 'Cliente 3', src: '/prova-social/cliente-3.png' }
]

const testimonials = [
  {
    initials: 'NC',
    name: 'GUIGO',
    role: 'SOCIO',
    market: 'JACIANA SUPERMERCADOS',
    quote: 'Hoje conseguimos enxergar melhor o que foi vendido no cartao, o que entrou na conta e onde estavam as diferencas.'
  },
  {
    initials: 'NC',
    name: 'LORENA',
    role: 'SOCIO',
    market: 'MULTISHOW SUPERMERCADOS',
    quote: 'A consultoria ajudou nosso financeiro a parar de perder tempo com conferencia manual e cobrar mais rapido o que estava faltando.'
  },
  {
    initials: 'JI',
    name: 'JOSE IGNACIO',
    role: 'SOCIO',
    market: 'SUPERMERCADO FAMILIAR',
    quote: 'Nao e so sistema. A equipe acompanha, explica as taxas e ajuda a encontrar valores que antes passavam despercebidos.'
  }
]
</script>
