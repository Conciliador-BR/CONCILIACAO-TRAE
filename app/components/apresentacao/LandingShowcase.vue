<template>
  <section id="showcase" class="showcase-section w-full overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
    <div class="showcase-section__grid" aria-hidden="true" />
    <div class="showcase-section__glow showcase-section__glow--left" aria-hidden="true" />
    <div class="showcase-section__glow showcase-section__glow--right" aria-hidden="true" />
    <div class="showcase-section__rain" aria-hidden="true" />
    <div class="showcase-shell overflow-hidden rounded-[40px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
      <div class="showcase-heading mx-auto max-w-4xl">
        <LandingSectionHeading
          title="Veja em uma tela o que seu supermercado vendeu, recebeu e ainda precisa conferir"
        />
      </div>

      <div class="mt-12 space-y-10 lg:space-y-14">
        <div class="showcase-row">
          <article class="showcase-image-card showcase-image-card--left">
            <div class="showcase-mockup" aria-label="Tela ilustrada de análise de vendas">
              <div class="showcase-mockup__glow showcase-mockup__glow--left" />
              <div class="showcase-mockup__glow showcase-mockup__glow--right" />

              <div class="showcase-mockup__metrics">
                <div
                  v-for="metric in showcaseSalesMetrics"
                  :key="metric.title"
                  class="showcase-metric"
                  :class="`showcase-metric--${metric.tone}`"
                >
                  <span>{{ metric.title }}</span>
                  <strong>{{ metric.value }}</strong>
                  <small>{{ metric.caption }}</small>
                </div>
              </div>

              <div class="showcase-mockup__summary">
                <div
                  v-for="item in showcaseSalesSummary"
                  :key="item.title"
                  class="showcase-summary-card"
                >
                  <span>{{ item.title }}</span>
                  <strong>{{ item.value }}</strong>
                  <small>{{ item.caption }}</small>
                </div>
              </div>

              <div class="showcase-mockup__charts">
                <div class="showcase-chart-panel">
                  <div class="showcase-chart-panel__header">
                    <div class="showcase-chart-panel__title">Receita por Bandeira</div>
                    <div class="showcase-chart-panel__tabs">
                      <span class="is-active">Barras</span>
                      <span>Linhas</span>
                      <span>Pizza</span>
                    </div>
                  </div>

                  <div class="showcase-bar-chart">
                    <div class="showcase-bar-chart__scale">
                      <span>R$ 200k</span>
                      <span>R$ 100k</span>
                      <span>R$ 0</span>
                    </div>

                    <div class="showcase-bar-chart__plot">
                      <div
                        v-for="item in showcaseSalesBars"
                        :key="item.label"
                        class="showcase-bar-chart__group"
                      >
                        <div class="showcase-bar-chart__bars">
                          <span class="showcase-bar-chart__bar showcase-bar-chart__bar--bruto" :style="{ height: item.bruto }" />
                          <span class="showcase-bar-chart__bar showcase-bar-chart__bar--liquido" :style="{ height: item.liquido }" />
                          <span class="showcase-bar-chart__bar showcase-bar-chart__bar--taxa" :style="{ height: item.taxa }" />
                        </div>
                        <div class="showcase-bar-chart__label">{{ item.label }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="showcase-chart-panel">
                  <div class="showcase-chart-panel__header">
                    <div class="showcase-chart-panel__title">Custo de Taxas</div>
                    <div class="showcase-chart-panel__tabs">
                      <span>Barras</span>
                      <span>Linhas</span>
                      <span class="is-active">Pizza</span>
                    </div>
                  </div>

                  <div class="showcase-donut-layout">
                    <div class="showcase-donut">
                      <div class="showcase-donut__ring" />
                    </div>

                    <div class="showcase-donut-list">
                      <div
                        v-for="item in showcaseSalesLegend"
                        :key="item.label"
                        class="showcase-donut-list__item"
                      >
                        <span class="showcase-donut-list__label">
                          <i class="showcase-legend-dot" :class="`showcase-legend-dot--${item.tone}`" />
                          {{ item.label }}
                        </span>
                        <strong>{{ item.value }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
            <div class="showcase-mockup showcase-mockup--receipts" aria-label="Tela ilustrada de análise de recebimentos">
              <div class="showcase-mockup__glow showcase-mockup__glow--left" />
              <div class="showcase-mockup__glow showcase-mockup__glow--right" />

              <div class="showcase-insight-row">
                <div
                  v-for="item in showcaseReceiptInsights"
                  :key="item.title"
                  class="showcase-insight-card"
                  :class="`showcase-insight-card--${item.tone}`"
                >
                  <span>{{ item.kicker }}</span>
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.caption }}</small>
                </div>
              </div>

              <div class="showcase-mockup__metrics showcase-mockup__metrics--compact">
                <div
                  v-for="metric in showcaseReceiptMetrics"
                  :key="metric.title"
                  class="showcase-metric"
                  :class="`showcase-metric--${metric.tone}`"
                >
                  <span>{{ metric.title }}</span>
                  <strong>{{ metric.value }}</strong>
                  <small>{{ metric.caption }}</small>
                </div>
              </div>

              <div class="showcase-mockup__charts">
                <div class="showcase-chart-panel">
                  <div class="showcase-chart-panel__header">
                    <div class="showcase-chart-panel__title">Liquido por Adquirente</div>
                    <div class="showcase-chart-panel__tabs">
                      <span class="is-active">Barras</span>
                      <span>Linhas</span>
                      <span>Pizza</span>
                    </div>
                  </div>

                  <div class="showcase-bar-chart showcase-bar-chart--receipts">
                    <div class="showcase-bar-chart__plot">
                      <div
                        v-for="item in showcaseReceiptBars"
                        :key="item.label"
                        class="showcase-bar-chart__group"
                      >
                        <div class="showcase-bar-chart__bars">
                          <span class="showcase-bar-chart__bar showcase-bar-chart__bar--bruto" :style="{ height: item.bruto }" />
                        </div>
                        <div class="showcase-bar-chart__label">{{ item.label }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="showcase-chart-panel">
                  <div class="showcase-chart-panel__header">
                    <div class="showcase-chart-panel__title">Custo por Adquirente</div>
                    <div class="showcase-chart-panel__tabs">
                      <span>Barras</span>
                      <span>Linhas</span>
                      <span class="is-active">Pizza</span>
                    </div>
                  </div>

                  <div class="showcase-donut-layout">
                    <div class="showcase-donut showcase-donut--receipts">
                      <div class="showcase-donut__ring" />
                    </div>

                    <div class="showcase-donut-list">
                      <div
                        v-for="item in showcaseReceiptLegend"
                        :key="item.label"
                        class="showcase-donut-list__item"
                      >
                        <span class="showcase-donut-list__label">
                          <i class="showcase-legend-dot" :class="`showcase-legend-dot--${item.tone}`" />
                          {{ item.label }}
                        </span>
                        <strong>{{ item.value }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingSectionHeading from './LandingSectionHeading.vue'

const showcaseSalesMetrics = [
  { title: 'Receita Bruta', value: 'R$ 884.012,97', caption: 'Total vendido', tone: 'navy' },
  { title: 'Custo de Taxas', value: 'R$ 12.589,14', caption: 'Despesas de cartao', tone: 'cyan' },
  { title: 'Receita Liquida', value: 'R$ 871.423,83', caption: 'Apos taxas', tone: 'indigo' },
  { title: 'Margem Bruta', value: '98,58%', caption: 'Rentabilidade', tone: 'green' }
]

const showcaseSalesSummary = [
  { title: 'Ticket Medio Bruto', value: 'R$ 51,15', caption: 'por transacao' },
  { title: 'Ticket Medio Liquido', value: 'R$ 50,42', caption: 'apos taxas' },
  { title: 'Total de Transacoes', value: '17.283', caption: 'operacoes' }
]

const showcaseSalesBars = [
  { label: 'VISA', bruto: '52%', liquido: '49%', taxa: '4%' },
  { label: 'MASTER', bruto: '66%', liquido: '63%', taxa: '4%' },
  { label: 'ELO', bruto: '37%', liquido: '34%', taxa: '2%' },
  { label: 'AMEX', bruto: '18%', liquido: '16%', taxa: '1.2%' },
  { label: 'PIX', bruto: '78%', liquido: '77%', taxa: '0.8%' }
]

const showcaseSalesLegend = [
  { label: 'Visa', value: 'R$ 2.087', tone: 'visa' },
  { label: 'Master', value: 'R$ 2.658', tone: 'mastercard' },
  { label: 'Elo', value: 'R$ 727', tone: 'elo' },
  { label: 'Pix', value: 'R$ 674', tone: 'pix' }
]

const showcaseReceiptInsights = [
  { kicker: 'Melhor adquirente', title: 'Sicredi', caption: 'Maior concentracao do periodo', tone: 'green' },
  { kicker: 'Insight', title: 'Credito dominante', caption: 'Recebeu mais no parcelado', tone: 'blue' },
  { kicker: 'Atencao', title: 'Ponto de ajuste', caption: 'Depositos com revisao', tone: 'cyan' }
]

const showcaseReceiptMetrics = [
  { title: 'Liquido Recebido', value: 'R$ 271.572,62', caption: 'Entrada confirmada', tone: 'navy' },
  { title: 'Valor Previsto', value: 'R$ 271.572,62', caption: 'Total esperado', tone: 'indigo' },
  { title: 'Despesas Totais', value: 'R$ 4.222,27', caption: 'MDR e ajustes', tone: 'cyan' },
  { title: 'Valor Bruto', value: 'R$ 275.983,89', caption: 'Antes das taxas', tone: 'green' }
]

const showcaseReceiptBars = [
  { label: 'SICREDI', bruto: '88%' },
  { label: 'BANCO SICOOB', bruto: '10%' },
  { label: 'ALELO', bruto: '6%' },
  { label: 'LE CARD', bruto: '4%' },
  { label: 'VR', bruto: '3%' }
]

const showcaseReceiptLegend = [
  { label: 'Sicredi', value: 'R$ 27 mil', tone: 'visa' },
  { label: 'Alelo', value: 'R$ 14 mil', tone: 'mastercard' },
  { label: 'Compocard', value: 'R$ 8 mil', tone: 'elo' },
  { label: 'VR', value: 'R$ 5 mil', tone: 'pix' }
]
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
  text-align: center;
  margin-inline: auto;
}

.showcase-heading :deep(p) {
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
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
    radial-gradient(circle at top, rgba(25, 77, 123, 0.18), transparent 24%),
    linear-gradient(180deg, #08111d 0%, #0a1522 50%, #09121d 100%);
  padding: 1rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 24px 60px rgba(2, 8, 17, 0.34);
}

.showcase-mockup {
  position: relative;
  min-height: 30rem;
  overflow: hidden;
  border-radius: 26px;
  background:
    radial-gradient(circle at 50% 0%, rgba(134, 239, 172, 0.16), transparent 24%),
    linear-gradient(180deg, #08111d 0%, #0a1522 50%, #09121d 100%);
  padding: 1.25rem;
}

.showcase-mockup__glow {
  position: absolute;
  border-radius: 9999px;
  filter: blur(70px);
  pointer-events: none;
}

.showcase-mockup__glow--left {
  left: -4rem;
  bottom: -2rem;
  width: 14rem;
  height: 14rem;
  background: rgba(74, 222, 128, 0.12);
}

.showcase-mockup__glow--right {
  right: -3rem;
  top: -3rem;
  width: 13rem;
  height: 13rem;
  background: rgba(15, 160, 206, 0.16);
}

.showcase-mockup__metrics,
.showcase-mockup__summary,
.showcase-mockup__charts,
.showcase-chart-panel__header,
.showcase-bar-chart__bars,
.showcase-bar-chart__plot,
.showcase-donut-layout,
.showcase-donut-list__item,
.showcase-insight-row {
  display: grid;
}

.showcase-mockup__metrics {
  position: relative;
  z-index: 1;
  gap: 0.8rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.showcase-metric,
.showcase-summary-card,
.showcase-chart-panel,
.showcase-insight-card {
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 16px 34px rgba(2, 8, 17, 0.24);
}

.showcase-metric {
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  color: #f8fafc;
}

.showcase-metric span,
.showcase-summary-card span,
.showcase-insight-card span {
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.72);
}

.showcase-metric strong,
.showcase-summary-card strong,
.showcase-insight-card strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.05rem;
  line-height: 1.15;
  color: #ffffff;
}

.showcase-metric small,
.showcase-summary-card small,
.showcase-insight-card small {
  display: block;
  margin-top: 0.18rem;
  font-size: 0.68rem;
  color: rgba(226, 232, 240, 0.66);
}

.showcase-metric--navy {
  background: linear-gradient(180deg, #0a2e52, #0c2036);
}

.showcase-metric--cyan {
  background: linear-gradient(180deg, #0c5679, #0a3c58);
}

.showcase-metric--indigo {
  background: linear-gradient(180deg, #2b6097, #214a74);
}

.showcase-metric--green {
  background: linear-gradient(180deg, #1a7c59, #155841);
}

.showcase-mockup__summary {
  position: relative;
  z-index: 1;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 0.85rem;
}

.showcase-summary-card {
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  background: linear-gradient(180deg, rgba(14, 35, 58, 0.9), rgba(8, 22, 38, 0.92));
}

.showcase-mockup__charts {
  position: relative;
  z-index: 1;
  gap: 0.8rem;
  grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
  margin-top: 0.85rem;
}

.showcase-chart-panel {
  gap: 1rem;
  border-radius: 1.2rem;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(10, 27, 44, 0.9), rgba(7, 19, 33, 0.94));
}

.showcase-chart-panel__header {
  gap: 0.75rem;
  grid-template-columns: 1fr auto;
  align-items: center;
}

.showcase-chart-panel__title {
  font-size: 0.86rem;
  font-weight: 700;
  color: #f8fafc;
}

.showcase-chart-panel__tabs {
  display: inline-flex;
  gap: 0.35rem;
}

.showcase-chart-panel__tabs span {
  padding: 0.18rem 0.42rem;
  border-radius: 0.45rem;
  font-size: 0.58rem;
  color: rgba(191, 219, 254, 0.72);
}

.showcase-chart-panel__tabs .is-active {
  background: rgba(15, 160, 206, 0.28);
  color: #e0f2fe;
}

.showcase-bar-chart {
  display: grid;
  gap: 0.7rem;
}

.showcase-bar-chart__scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.54rem;
  color: rgba(148, 163, 184, 0.72);
}

.showcase-bar-chart__plot {
  align-items: end;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.8rem;
  min-height: 11rem;
  padding: 0.85rem 0.6rem 0.3rem;
  border-radius: 0.95rem;
  background:
    linear-gradient(rgba(126, 148, 170, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(126, 148, 170, 0.05) 1px, transparent 1px);
  background-size: 100% 25%, 20% 100%;
}

.showcase-bar-chart__group {
  display: grid;
  gap: 0.45rem;
  justify-items: center;
}

.showcase-bar-chart__bars {
  display: flex;
  align-items: end;
  gap: 0.16rem;
  height: 100%;
}

.showcase-bar-chart__bar {
  width: 0.52rem;
  border-radius: 0.45rem 0.45rem 0 0;
}

.showcase-bar-chart__bar--bruto {
  background: #22639c;
}

.showcase-bar-chart__bar--liquido {
  background: #19b489;
}

.showcase-bar-chart__bar--taxa {
  background: #0fa0ce;
}

.showcase-bar-chart__label {
  font-size: 0.56rem;
  color: rgba(191, 219, 254, 0.72);
}

.showcase-donut-layout {
  grid-template-columns: 8.5rem minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
}

.showcase-donut {
  display: grid;
  place-items: center;
}

.showcase-donut__ring {
  width: 7.5rem;
  aspect-ratio: 1;
  border-radius: 9999px;
  background:
    radial-gradient(circle at center, #0d1722 0 38%, transparent 39%),
    conic-gradient(#d79b33 0 29%, #58a85c 29% 41%, #5578a8 41% 66%, #2c527e 66% 83%, #1f7cbc 83% 92%, #0fa0ce 92% 100%);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
}

.showcase-donut--receipts .showcase-donut__ring {
  background:
    radial-gradient(circle at center, #0d1722 0 38%, transparent 39%),
    conic-gradient(#173b63 0 64%, #6a3dc2 64% 74%, #2e8a53 74% 84%, #d79b33 84% 100%);
}

.showcase-donut-list {
  display: grid;
  gap: 0.5rem;
}

.showcase-donut-list__item {
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  font-size: 0.64rem;
  color: rgba(226, 232, 240, 0.72);
}

.showcase-donut-list__item strong {
  font-size: 0.66rem;
  color: #ffffff;
}

.showcase-donut-list__label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.showcase-legend-dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 9999px;
}

.showcase-legend-dot--visa {
  background: #5578a8;
}

.showcase-legend-dot--mastercard {
  background: #d79b33;
}

.showcase-legend-dot--elo {
  background: #58a85c;
}

.showcase-legend-dot--pix {
  background: #0fa0ce;
}

.showcase-mockup--receipts {
  min-height: 29rem;
}

.showcase-insight-row {
  position: relative;
  z-index: 1;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 0.85rem;
}

.showcase-insight-card {
  border-radius: 1rem;
  padding: 0.95rem 1rem;
}

.showcase-insight-card--green {
  background: linear-gradient(135deg, #0f6c5a, #19b489);
}

.showcase-insight-card--blue {
  background: linear-gradient(135deg, #1e4f88, #2e7fcb);
}

.showcase-insight-card--cyan {
  background: linear-gradient(135deg, #0d5f86, #0fa0ce);
}

.showcase-mockup__metrics--compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.showcase-bar-chart--receipts .showcase-bar-chart__plot {
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

@media (max-width: 1023px) {
  .showcase-mockup,
  .showcase-mockup--receipts {
    min-height: auto;
  }

  .showcase-mockup__metrics,
  .showcase-mockup__metrics--compact,
  .showcase-mockup__summary,
  .showcase-insight-row,
  .showcase-mockup__charts {
    grid-template-columns: 1fr;
  }

  .showcase-donut-layout {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .showcase-bar-chart__plot {
    gap: 0.45rem;
  }
}
</style>
