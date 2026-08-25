<template>
  <section id="prova-social" class="w-full scroll-mt-36 px-4 py-20 sm:px-6 lg:px-8">
    <div class="w-full">
      <div class="overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/80 p-8 shadow-sm shadow-[#163a5a]/5 backdrop-blur-sm lg:p-10">
        <div>
          <LandingSectionHeading
            eyebrow="Prova Social"
            title="São várias empresas satisfeitas com nosso serviço de consultoria personalizada."
          />

          <div class="mt-8 grid gap-5 lg:grid-cols-3">
            <article
              v-for="proof in socialProofImages"
              :key="proof.src"
              class="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                :src="proof.src"
                :alt="proof.alt"
                class="h-auto w-full rounded-[20px] object-contain"
              >
            </article>
          </div>

          <div class="mt-8 rounded-[28px] border border-[#73c77d]/30 bg-[linear-gradient(180deg,rgba(115,199,125,0.14),rgba(126,206,137,0.08),rgba(138,215,149,0.12))] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#163a5a]">
              Diferencial Economic Card
            </p>
            <p class="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Você não contrata só um sistema.
            </p>
            <p class="mt-2 text-base leading-7 text-slate-700">
              Seu supermercado conta com consultoria personalizada de especialistas para analisar diferenças,
              taxas, atrasos e valores que precisam ser cobrados.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingSectionHeading from './LandingSectionHeading.vue'

const socialProofImages = [
  { src: '/apresentacao/prova social 1.png', alt: 'Prova social 1' },
  { src: '/apresentacao/prova social 2.png', alt: 'Prova social 2' },
  { src: '/apresentacao/prova social 3.png', alt: 'Prova social 3' }
]
</script>
