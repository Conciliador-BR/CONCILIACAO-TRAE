<template>
  <section class="w-full px-4 py-20 sm:px-6 lg:px-8">
    <div class="overflow-hidden rounded-[40px] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-6 py-10 shadow-2xl shadow-[#163a5a]/20 sm:px-8 lg:px-10 lg:py-14">
      <div class="showcase-heading max-w-4xl">
        <LandingSectionHeading
          eyebrow="Na prática"
          title="Veja em uma tela o que seu supermercado vendeu, recebeu e ainda precisa conferir"
          description="As duas imagens mostram como o sistema destaca diferenças, organiza cartões e ajuda o financeiro a agir rápido."
        />
      </div>

      <div class="mt-12 space-y-10 lg:space-y-14">
        <div class="showcase-row">
          <article class="showcase-image-card showcase-image-card--left">
            <img
              src="/apresentacao/SISTEMA 1.png"
              alt="Tela de análise de vendas"
              class="w-full rounded-[26px]"
            >
          </article>

          <article class="showcase-text-card showcase-text-card--right">
            <div>
              <h3 class="font-landing-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Vendas, recebimentos e bancos no mesmo lugar
              </h3>
              <p class="mt-4 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
                Seu financeiro para de procurar informação em várias planilhas e passa a enxergar a conferência em uma tela só.
              </p>
            </div>
          </article>
        </div>

        <div class="showcase-row showcase-row--reverse">
          <article class="showcase-text-card showcase-text-card--left">
            <div>
              <h3 class="font-landing-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Diferenças destacadas para agir rápido
              </h3>
              <p class="mt-4 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
                Quando o valor não bate, a taxa veio errada ou o depósito não entrou como esperado, a tela mostra onde está o problema.
              </p>
            </div>
          </article>

          <article class="showcase-image-card showcase-image-card--right">
            <img
              src="/apresentacao/ANALISE_DE_RECEBIMENTOS.png"
              alt="Tela de análise de recebimentos"
              class="w-full rounded-[26px]"
            >
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingSectionHeading from './LandingSectionHeading.vue'
</script>

<style scoped>
.showcase-heading :deep(span) {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.86);
}

.showcase-heading :deep(h2) {
  color: #ffffff;
}

.showcase-heading :deep(p) {
  color: rgba(255, 255, 255, 0.75);
}

.showcase-row {
  position: relative;
  display: grid;
  gap: 1.5rem;
  align-items: center;
}

.showcase-text-card {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 16rem;
  align-items: center;
  border-radius: 2rem;
  border: 1px solid rgba(115, 199, 125, 0.18);
  background: linear-gradient(135deg, rgba(115, 199, 125, 0.14), rgba(126, 206, 137, 0.08), rgba(22, 58, 90, 0.2));
  padding: 2.5rem;
  box-shadow: 0 24px 50px rgba(8, 21, 37, 0.24);
}

.showcase-image-card {
  position: relative;
  z-index: 2;
  overflow: hidden;
  width: min(100%, 60rem);
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.96);
  padding: 1rem;
  box-shadow: 0 24px 60px rgba(8, 21, 37, 0.28);
}

@media (min-width: 1024px) {
  .showcase-row {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    min-height: 24rem;
  }

  .showcase-row--reverse {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  }

  .showcase-image-card--left {
    justify-self: start;
    margin-right: -4.5rem;
  }

  .showcase-image-card--right {
    justify-self: end;
    margin-left: -4.5rem;
  }

  .showcase-text-card--right {
    padding-left: 7rem;
    justify-content: flex-end;
  }

  .showcase-text-card--left {
    padding-right: 7rem;
  }
}
</style>
