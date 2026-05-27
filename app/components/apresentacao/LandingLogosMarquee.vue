<template>
  <section class="px-6 py-16 lg:px-8">
    <div class="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/70 px-6 py-8 shadow-sm shadow-[#163a5a]/5 backdrop-blur-sm lg:px-8">
      <div class="mx-auto max-w-3xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#163a5a]">Autorizadoras e vouchers</p>
        <p class="mt-3 text-sm leading-7 text-slate-600">
          Marcas que fazem parte da rotina de conciliacao e recebimentos acompanhada pela plataforma.
        </p>
      </div>

      <div class="marquee-shell mt-8">
        <div class="marquee-track">
          <div v-for="(logo, index) in marqueeLogos" :key="`${logo.name}-${index}`" class="logo-card">
            <img :src="logo.src" :alt="logo.name" class="logo-image" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const logos = [
  { name: 'American Express', src: '/Logos_Adquirentes/Autorizadoras/American-Express-Logo-PNG-Transparent-Image.png' },
  { name: 'Elo', src: '/Logos_Adquirentes/Autorizadoras/Elo-Servicos-S.A.-Logo-Vector.svg-.png' },
  { name: 'Visa', src: '/Logos_Adquirentes/Autorizadoras/visa_PNG4.png' },
  { name: 'Mastercard', src: '/Logos_Adquirentes/Autorizadoras/MASTERCARD.png' },
  { name: 'Stone', src: '/Logos_Adquirentes/Autorizadoras/logo-stone.png' },
  { name: 'Cielo', src: '/Logos_Adquirentes/Autorizadoras/cielo-logo.png' },
  { name: 'Rede', src: '/Logos_Adquirentes/Autorizadoras/logo_rede.png' },
  { name: 'Sicredi', src: '/Logos_Adquirentes/Autorizadoras/sicredi-logo-768x181.png' },
  { name: 'Comprocard', src: '/Logos_Adquirentes/Vouchers/logo%20COMPROCARD.png' },
  { name: 'Lecard', src: '/Logos_Adquirentes/Vouchers/lecard.png' },
  { name: 'Pluxee', src: '/Logos_Adquirentes/Vouchers/logo_pluxee_azul.png' },
  { name: 'Nutricash', src: '/Logos_Adquirentes/Vouchers/Nutricash.png' },
  { name: 'Valecard', src: '/Logos_Adquirentes/Vouchers/valecard-logo.png' },
  { name: 'VR', src: '/Logos_Adquirentes/Vouchers/logo%20VR.png' },
  { name: 'Ticket', src: '/Logos_Adquirentes/Vouchers/logo-ticket-1024.png' }
]

const marqueeLogos = [...logos, ...logos]
</script>

<style scoped>
.marquee-shell {
  position: relative;
  overflow: hidden;
}

.marquee-shell::before,
.marquee-shell::after {
  content: '';
  position: absolute;
  top: 0;
  z-index: 2;
  height: 100%;
  width: 6rem;
  pointer-events: none;
}

.marquee-shell::before {
  left: 0;
  background: linear-gradient(90deg, rgba(248, 250, 252, 0.98), rgba(248, 250, 252, 0));
}

.marquee-shell::after {
  right: 0;
  background: linear-gradient(270deg, rgba(248, 250, 252, 0.98), rgba(248, 250, 252, 0));
}

.marquee-track {
  display: flex;
  width: max-content;
  gap: 1rem;
  animation: marqueeMove 34s linear infinite;
}

.logo-card {
  display: flex;
  min-width: 11rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  padding: 1.1rem 1.4rem;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.logo-image {
  height: 2.7rem;
  width: auto;
  max-width: 9rem;
  object-fit: contain;
  filter: saturate(1.02);
}

@keyframes marqueeMove {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-50% - 0.5rem));
  }
}

@media (max-width: 768px) {
  .marquee-track {
    animation-duration: 26s;
  }

  .logo-card {
    min-width: 9.5rem;
    padding: 0.9rem 1.1rem;
  }

  .logo-image {
    height: 2.2rem;
    max-width: 7.5rem;
  }
}
</style>
