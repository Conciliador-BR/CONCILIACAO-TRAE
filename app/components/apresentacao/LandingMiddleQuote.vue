<template>
  <section class="px-6 py-20 lg:px-8">
    <div class="mx-auto grid max-w-6xl gap-12 overflow-hidden rounded-[36px] border border-[#244b77]/10 bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] p-8 shadow-2xl shadow-[#163a5a]/20 sm:p-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
      <div class="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <p class="text-2xl font-semibold leading-tight text-blue-50 sm:text-3xl lg:text-4xl">
          Seu negócio não para.
        </p>
        <p class="mt-3 text-2xl font-semibold leading-tight text-blue-50 sm:text-3xl lg:text-4xl">
          Sua conciliação também não.
        </p>
        <p class="mt-7 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
          Quem busca precisão, escolhe Economic Card.
        </p>
      </div>

      <div class="relative quote-visual">
        <div class="absolute -left-6 top-8 h-28 w-28 rounded-full bg-[#73c77d]/20 blur-3xl" />
        <div class="absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-[#1f4f77]/35 blur-3xl" />
        <div class="floating-badge floating-badge--left">
          <span class="floating-badge__label">Auditoria</span>
          <strong class="floating-badge__value">Recuperacao de perdas</strong>
        </div>
        <div class="floating-badge floating-badge--right">
          <span class="floating-badge__label">Automacao</span>
          <strong class="floating-badge__value">Conciliacao sem pausa</strong>
        </div>
        <div class="quote-panel">
          <img
            src="/apresentacao/hero-dashboard.svg"
            alt="Painel executivo de conciliacao financeira"
            class="w-full rounded-[24px] border border-white/10 bg-slate-950/20"
          />
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
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  box-shadow: 0 24px 56px rgba(6, 17, 29, 0.28);
  backdrop-filter: blur(16px);
  animation: floatPanel 8s ease-in-out infinite;
}

.floating-badge {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 12rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 1.4rem;
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(16px);
  padding: 0.95rem 1rem;
  box-shadow: 0 18px 40px rgba(6, 17, 29, 0.28);
  animation: floatBadge 7s ease-in-out infinite;
}

.floating-badge--left {
  left: -1.5rem;
  top: 3rem;
}

.floating-badge--right {
  right: -1rem;
  bottom: 2.5rem;
  animation-delay: 1.2s;
}

.floating-badge__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(191, 219, 254, 0.88);
}

.floating-badge__value {
  font-size: 0.96rem;
  line-height: 1.4;
  color: #ffffff;
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

@keyframes floatPanel {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes floatBadge {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (max-width: 1023px) {
  .floating-badge {
    position: static;
    margin-bottom: 1rem;
    min-width: 0;
  }
}
</style>
