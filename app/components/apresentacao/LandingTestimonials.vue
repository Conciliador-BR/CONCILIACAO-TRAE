<template>
  <section id="depoimentos" class="testimonials-section relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
    <div class="testimonials-section__grid" aria-hidden="true" />
    <div class="testimonials-section__glow testimonials-section__glow--left" aria-hidden="true" />
    <div class="testimonials-section__glow testimonials-section__glow--right" aria-hidden="true" />

    <div class="testimonials-shell mx-auto max-w-7xl rounded-[2.5rem] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
      <div class="testimonials-heading mx-auto max-w-4xl text-center">
        <LandingSectionHeading
          eyebrow="Depoimentos"
          title="Quem vive a operação do supermercado percebe rápido quando a conciliação começa a sobrar."
        />
      </div>

      <div class="testimonials-grid mt-12">
        <article
          v-for="item in testimonials"
          :key="item.name"
          class="testimonial-card"
          :class="item.className"
        >
          <div class="testimonial-card__noise" aria-hidden="true" />
          <div class="testimonial-card__quote-mark" aria-hidden="true">"</div>

          <div class="testimonial-card__content">
            <p class="testimonial-card__quote">
              {{ item.quote }}
            </p>

            <div class="testimonial-card__footer">
              <div class="testimonial-card__meta">
                <h3>{{ item.name }}</h3>
                <p>{{ item.role }}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingSectionHeading from './LandingSectionHeading.vue'

const testimonials = [
  {
    name: 'Patricia Almeida',
    role: 'Financeiro de rede supermercadista',
    quote: 'Antes a gente perdia horas cruzando comprovante, extrato e operadora. Com a Economic Card, o time enxerga a diferenca e ja sabe onde cobrar.',
    className: 'testimonial-card--featured testimonial-card--glass'
  },
  {
    name: 'Rafael Costa',
    role: 'Diretor administrativo',
    quote: 'As taxas ficaram muito mais controladas. O que era percebido tarde demais hoje aparece na tela cedo, com contexto para agir.',
    className: 'testimonial-card--glass'
  },
  {
    name: 'Juliana Martins',
    role: 'Controladoria',
    quote: 'A conciliacao deixou de ser um gargalo. O fechamento ganhou confianca e a equipe passou a trabalhar com menos retrabalho.',
    className: 'testimonial-card--glass'
  },
  {
    name: 'Marcos Ribeiro',
    role: 'Socio de supermercado',
    quote: 'O maior ganho foi saber exatamente o que entrou, o que faltou e o que veio com cobranca indevida. Isso muda a margem no fim do mes.',
    className: 'testimonial-card--glass'
  },
  {
    name: 'Camila Nogueira',
    role: 'Coordenadora financeira',
    quote: 'Hoje eu consigo mostrar para a diretoria onde esta a divergencia sem depender de varias planilhas espalhadas.',
    className: 'testimonial-card--glass'
  },
  {
    name: 'Diego Ferreira',
    role: 'Gestor operacional',
    quote: 'Sistema e consultoria juntos fizeram diferenca. Nao ficou so no relatorio; ficou claro o que precisava ser ajustado na operacao.',
    className: 'testimonial-card--glass'
  }
]
</script>

<style scoped>
.testimonials-section {
  background:
    radial-gradient(circle at 18% 18%, rgba(226, 232, 240, 0.18), transparent 24%),
    radial-gradient(circle at 82% 12%, rgba(148, 163, 184, 0.2), transparent 20%),
    linear-gradient(180deg, #7b8796 0%, #667384 46%, #4b5665 100%);
}

.testimonials-section__grid,
.testimonials-section__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.testimonials-section__grid {
  opacity: 0.12;
  background-image:
    linear-gradient(rgba(71, 85, 105, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(71, 85, 105, 0.1) 1px, transparent 1px);
  background-size: 118px 118px;
}

.testimonials-section__glow {
  filter: blur(96px);
}

.testimonials-section__glow--left {
  background: radial-gradient(circle, rgba(226, 232, 240, 0.18) 0%, transparent 64%);
  transform: translate(-22%, -12%);
}

.testimonials-section__glow--right {
  background: radial-gradient(circle, rgba(100, 116, 139, 0.24) 0%, transparent 66%);
  transform: translate(28%, 8%);
}

.testimonials-shell {
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background:
    linear-gradient(180deg, rgba(96, 109, 124, 0.7), rgba(70, 82, 96, 0.82)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 36%, rgba(148, 163, 184, 0.08) 100%);
  box-shadow:
    0 28px 80px rgba(15, 23, 42, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(18px);
}

.testimonials-heading :deep(span) {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(15, 23, 42, 0.12);
  color: rgba(248, 250, 252, 0.92);
}

.testimonials-heading :deep(h2) {
  color: #f8fafc;
}

.testimonials-heading :deep(p) {
  color: rgba(226, 232, 240, 0.78);
}

.testimonials-grid {
  display: grid;
  gap: 1rem;
}

.testimonial-card {
  position: relative;
  overflow: hidden;
  min-height: 18rem;
  border-radius: 1.9rem;
  border: 1px solid rgba(148, 163, 184, 0.14);
  padding: 1.65rem;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.testimonial-card:hover {
  transform: translateY(-4px);
  border-color: rgba(125, 211, 252, 0.24);
  box-shadow: 0 26px 60px rgba(2, 6, 23, 0.28);
}

.testimonial-card__noise {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  mix-blend-mode: screen;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 4px 4px;
}

.testimonial-card__quote-mark {
  position: absolute;
  top: 1.1rem;
  right: 1.3rem;
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-size: 4.4rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.08);
}

.testimonial-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
}

.testimonial-card__quote {
  max-width: 32rem;
  font-size: 1.02rem;
  line-height: 1.8;
  color: rgba(241, 245, 249, 0.92);
}

.testimonial-card__footer {
  display: flex;
  align-items: center;
  margin-top: 1.8rem;
}

.testimonial-card__meta h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.testimonial-card__meta p {
  margin: 0.2rem 0 0;
  font-size: 0.92rem;
  color: rgba(226, 232, 240, 0.72);
}

.testimonial-card--featured .testimonial-card__quote {
  font-size: clamp(1.22rem, 1.2vw, 1.42rem);
  line-height: 1.7;
}

.testimonial-card--glass {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
    linear-gradient(150deg, rgba(5, 14, 25, 0.98), rgba(7, 18, 31, 0.98));
  backdrop-filter: blur(18px);
}

@media (min-width: 768px) {
  .testimonials-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .testimonials-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: minmax(17rem, auto);
  }

  .testimonial-card--featured {
    grid-column: span 1;
    grid-row: span 2;
    min-height: 100%;
  }
}

@media (max-width: 767px) {
  .testimonial-card {
    min-height: 16.5rem;
    padding: 1.4rem;
  }

  .testimonial-card__quote {
    font-size: 0.98rem;
    line-height: 1.72;
  }
}
</style>
