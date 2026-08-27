<template>
  <section id="showcase" class="showcase-section w-full overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
    <div class="showcase-section__grid" aria-hidden="true" />
    <div class="showcase-section__glow showcase-section__glow--left" aria-hidden="true" />
    <div class="showcase-section__glow showcase-section__glow--right" aria-hidden="true" />
    <div class="showcase-section__rain" aria-hidden="true" />
    <div class="showcase-shell overflow-hidden rounded-[40px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
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
.showcase-section {
  position: relative;
  background:
    radial-gradient(circle at 50% 14%, rgba(115, 199, 125, 0.18), transparent 24%),
    radial-gradient(circle at 16% 22%, rgba(31, 79, 119, 0.28), transparent 26%),
    radial-gradient(circle at 84% 12%, rgba(31, 79, 119, 0.2), transparent 24%),
    linear-gradient(180deg, #040b14 0%, #071523 42%, #0a2338 100%);
}

.showcase-shell {
  position: relative;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(8, 16, 27, 0.88), rgba(7, 18, 31, 0.94)),
    radial-gradient(circle at top, rgba(115, 199, 125, 0.08), transparent 34%);
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 28px 70px rgba(2, 8, 17, 0.42);
}

.showcase-section__grid,
.showcase-section__glow,
.showcase-section__rain {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.showcase-section__grid {
  opacity: 0.08;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 118px 118px;
}

.showcase-section__glow {
  border-radius: 9999px;
  filter: blur(88px);
}

.showcase-section__glow--left {
  top: 2rem;
  left: -7rem;
  width: 24rem;
  height: 24rem;
  background: rgba(31, 79, 119, 0.22);
}

.showcase-section__glow--right {
  top: 3rem;
  right: -5rem;
  width: 24rem;
  height: 24rem;
  background: rgba(115, 199, 125, 0.14);
}

.showcase-section__rain {
  opacity: 0.16;
  background-image:
    linear-gradient(180deg, transparent 0%, rgba(167, 243, 121, 0.22) 35%, transparent 100%),
    linear-gradient(180deg, transparent 0%, rgba(96, 165, 250, 0.18) 40%, transparent 100%);
  background-size: 220px 100%, 320px 100%;
  background-position: 12% 0, 66% 0;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.56) 72%, transparent 100%);
}

.showcase-heading :deep(span) {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.05);
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
  border: 1px solid rgba(115, 199, 125, 0.16);
  background:
    radial-gradient(circle at top, rgba(115, 199, 125, 0.12), transparent 28%),
    linear-gradient(135deg, rgba(8, 18, 31, 0.92), rgba(11, 30, 48, 0.9), rgba(8, 18, 31, 0.96));
  padding: 2.5rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 24px 50px rgba(2, 8, 17, 0.3);
}

.showcase-image-card {
  position: relative;
  z-index: 2;
  overflow: hidden;
  width: min(100%, 60rem);
  border-radius: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background:
    linear-gradient(180deg, rgba(8, 14, 23, 0.96), rgba(5, 10, 18, 0.98)),
    radial-gradient(circle at top, rgba(115, 199, 125, 0.08), transparent 34%);
  padding: 1rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 24px 60px rgba(2, 8, 17, 0.34);
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
