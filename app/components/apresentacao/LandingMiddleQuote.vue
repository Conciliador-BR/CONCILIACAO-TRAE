<template>
  <section class="w-full px-4 py-20 sm:px-6 lg:px-8">
    <div class="grid w-full gap-12 overflow-hidden rounded-[36px] border border-black/8 bg-[#d9dde2] p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-12 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
      <div class="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <p class="text-2xl font-semibold leading-tight text-black sm:text-3xl lg:text-4xl">
          Seu time cuida da loja.
        </p>
        <p class="mt-3 text-2xl font-semibold leading-tight text-black sm:text-3xl lg:text-4xl">
          A Economic Card cuida da conferência dos cartões.
        </p>
        <p class="mt-7 text-3xl font-bold leading-tight text-black sm:text-4xl lg:text-5xl">
          Software e consultoria para encontrar diferenças, recuperar valores e dar segurança ao financeiro.
        </p>
      </div>

      <div class="relative quote-visual">
        <div class="absolute -left-6 top-8 h-28 w-28 rounded-full bg-black/6 blur-3xl" />
        <div class="absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-black/8 blur-3xl" />
        <div class="quote-panel">
          <div class="quote-scene" aria-hidden="true">
            <div class="quote-scene__glow quote-scene__glow--blue" />
            <div class="quote-scene__glow quote-scene__glow--green" />

            <div class="quote-scene__dashboard">
              <div class="quote-scene__header">
                <div class="quote-scene__dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div class="quote-scene__header-chip">Conferencia</div>
              </div>

              <div class="quote-scene__metrics">
                <div class="quote-scene__metric quote-scene__metric--navy">
                  <span>Cartoes</span>
                  <strong>R$ 884 mil</strong>
                </div>
                <div class="quote-scene__metric quote-scene__metric--green">
                  <span>Liquido</span>
                  <strong>R$ 871 mil</strong>
                </div>
                <div class="quote-scene__metric quote-scene__metric--light">
                  <span>Divergencias</span>
                  <strong>23 alertas</strong>
                </div>
              </div>

              <div class="quote-scene__content">
                <div class="quote-scene__chart">
                  <div class="quote-scene__bars">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div class="quote-scene__ledger">
                  <div class="quote-scene__ledger-row">
                    <span>Deposito banco</span>
                    <strong class="is-positive">ok</strong>
                  </div>
                  <div class="quote-scene__ledger-row">
                    <span>Voucher</span>
                    <strong class="is-positive">ok</strong>
                  </div>
                  <div class="quote-scene__ledger-row">
                    <span>Taxa MDR</span>
                    <strong class="is-alert">revisar</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="quote-scene__card-stack">
              <div class="quote-scene__mini-card quote-scene__mini-card--top">
                <span>Cartao</span>
                <strong>Venda conciliada</strong>
              </div>
              <div class="quote-scene__mini-card quote-scene__mini-card--bottom">
                <span>Voucher</span>
                <strong>Recebimento validado</strong>
              </div>
            </div>

            <div class="quote-scene__bank">
              <div class="quote-scene__bank-icon" />
              <span>Banco</span>
              <strong>Deposito confirmado</strong>
            </div>

            <div class="quote-scene__flow quote-scene__flow--one" />
            <div class="quote-scene__flow quote-scene__flow--two" />
          </div>
        </div>
        <div class="quote-badges">
          <div class="floating-badge">
            <span class="floating-badge__label">Conferência</span>
            <strong class="floating-badge__value">Cartões, vouchers e depósitos no mesmo fluxo visual</strong>
          </div>
          <div class="floating-badge">
            <span class="floating-badge__label">Segurança</span>
            <strong class="floating-badge__value">Diferenças e cobranças aparecem com clareza para o financeiro</strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.quote-visual {
  animation: heroFadeUp 0.95s ease 0.1s both;
}

.quote-panel {
  position: relative;
  overflow: hidden;
  border-radius: 2.2rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(220, 225, 232, 0.88));
  padding: 0.85rem;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.quote-panel::after {
  content: '';
  position: absolute;
  inset: auto 10% -18% 10%;
  height: 7rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.14), rgba(16, 185, 129, 0.09) 45%, transparent 72%);
  filter: blur(30px);
  pointer-events: none;
}

.quote-scene {
  position: relative;
  min-height: 24rem;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.72), transparent 22%),
    linear-gradient(135deg, #f4f7fb 0%, #e8edf3 42%, #d9e2ed 100%);
}

.quote-scene__glow,
.quote-scene__flow {
  position: absolute;
  pointer-events: none;
}

.quote-scene__glow {
  border-radius: 9999px;
  filter: blur(42px);
}

.quote-scene__glow--blue {
  left: 12%;
  top: 18%;
  width: 12rem;
  height: 12rem;
  background: rgba(59, 130, 246, 0.18);
}

.quote-scene__glow--green {
  right: 10%;
  bottom: 14%;
  width: 11rem;
  height: 11rem;
  background: rgba(16, 185, 129, 0.16);
}

.quote-scene__dashboard {
  position: absolute;
  left: 23%;
  top: 12%;
  width: 54%;
  border-radius: 1.8rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(235, 241, 247, 0.96));
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.12);
  padding: 1rem;
}

.quote-scene__header,
.quote-scene__content,
.quote-scene__ledger-row,
.quote-scene__dots,
.quote-scene__metrics {
  display: flex;
}

.quote-scene__header {
  align-items: center;
  justify-content: space-between;
}

.quote-scene__dots {
  gap: 0.3rem;
}

.quote-scene__dots span {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.9);
}

.quote-scene__header-chip {
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.quote-scene__metrics {
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.quote-scene__metric {
  flex: 1;
  display: grid;
  gap: 0.28rem;
  border-radius: 1rem;
  padding: 0.8rem;
  color: #fff;
}

.quote-scene__metric span {
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.85;
}

.quote-scene__metric strong {
  font-size: 0.86rem;
  line-height: 1.2;
}

.quote-scene__metric--navy {
  background: linear-gradient(180deg, #163d69, #123255);
}

.quote-scene__metric--green {
  background: linear-gradient(180deg, #1f8b63, #176b4d);
}

.quote-scene__metric--light {
  background: linear-gradient(180deg, #4492d2, #2f6da9);
}

.quote-scene__content {
  gap: 0.8rem;
  margin-top: 0.9rem;
}

.quote-scene__chart,
.quote-scene__ledger {
  flex: 1;
  border-radius: 1.15rem;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.quote-scene__chart {
  padding: 0.95rem;
}

.quote-scene__bars {
  display: flex;
  align-items: end;
  gap: 0.38rem;
  height: 100%;
  min-height: 6.9rem;
}

.quote-scene__bars span {
  flex: 1;
  border-radius: 0.5rem 0.5rem 0 0;
  background: linear-gradient(180deg, #1e67ab, #29a4d7);
}

.quote-scene__bars span:nth-child(1) { height: 42%; }
.quote-scene__bars span:nth-child(2) { height: 78%; }
.quote-scene__bars span:nth-child(3) { height: 58%; }
.quote-scene__bars span:nth-child(4) { height: 88%; }
.quote-scene__bars span:nth-child(5) { height: 66%; }

.quote-scene__ledger {
  padding: 0.8rem 0.9rem;
}

.quote-scene__ledger-row {
  align-items: center;
  justify-content: space-between;
  padding: 0.54rem 0;
  color: #475569;
  font-size: 0.72rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.quote-scene__ledger-row:last-child {
  border-bottom: 0;
}

.quote-scene__ledger-row strong {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.quote-scene__ledger-row .is-positive {
  color: #15803d;
}

.quote-scene__ledger-row .is-alert {
  color: #b45309;
}

.quote-scene__card-stack {
  position: absolute;
  left: 6%;
  top: 23%;
  width: 11rem;
}

.quote-scene__mini-card {
  position: absolute;
  left: 0;
  width: 100%;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: linear-gradient(135deg, #0b2f52, #0d7fc2);
  box-shadow: 0 18px 35px rgba(15, 23, 42, 0.16);
  padding: 0.9rem 1rem;
  color: #fff;
}

.quote-scene__mini-card span,
.quote-scene__bank span {
  display: block;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.84;
}

.quote-scene__mini-card strong,
.quote-scene__bank strong {
  display: block;
  margin-top: 0.28rem;
  font-size: 0.82rem;
  line-height: 1.3;
}

.quote-scene__mini-card--top {
  top: 0;
  transform: rotate(-6deg);
}

.quote-scene__mini-card--bottom {
  top: 5.2rem;
  background: linear-gradient(135deg, #0c5679, #17a773);
  transform: rotate(4deg);
}

.quote-scene__bank {
  position: absolute;
  right: 7%;
  bottom: 14%;
  width: 11.4rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
  padding: 0.95rem 1rem;
  color: #0f172a;
}

.quote-scene__bank-icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.85rem;
  background:
    linear-gradient(180deg, rgba(30, 64, 175, 0.1), rgba(16, 185, 129, 0.14)),
    linear-gradient(135deg, #ffffff, #e7edf4);
  margin-bottom: 0.75rem;
}

.quote-scene__flow {
  border-top: 2px dashed rgba(37, 99, 235, 0.26);
}

.quote-scene__flow--one {
  left: 17%;
  top: 31%;
  width: 10%;
  transform: rotate(8deg);
}

.quote-scene__flow--two {
  right: 18%;
  top: 58%;
  width: 10%;
  border-color: rgba(16, 185, 129, 0.3);
  transform: rotate(-14deg);
}

.quote-badges {
  margin-top: 1rem;
  display: grid;
  gap: 0.9rem;
}

.floating-badge {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1.4rem;
  background: rgba(245, 247, 250, 0.88);
  padding: 0.95rem 1rem;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
}

.floating-badge__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(15, 23, 42, 0.52);
}

.floating-badge__value {
  font-size: 0.96rem;
  line-height: 1.4;
  color: #111827;
}

@keyframes heroFadeUp {
  from {
    opacity: 0;
    transform: translateY(26px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1023px) {
  .quote-scene {
    min-height: 18rem;
  }

  .quote-scene__dashboard {
    left: 16%;
    width: 66%;
  }

  .quote-scene__card-stack,
  .quote-scene__bank {
    transform: scale(0.88);
  }

  .quote-scene__card-stack {
    left: 2%;
    top: 18%;
  }

  .quote-scene__bank {
    right: 2%;
    bottom: 8%;
  }

  .quote-badges {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1024px) {
  .quote-scene {
    min-height: 30rem;
  }

  .quote-badges {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

</style>
