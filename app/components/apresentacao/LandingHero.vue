<template>
  <section class="relative overflow-hidden bg-[#07121f]">
    <div class="hero-grid absolute inset-0 opacity-30" />
    <div class="hero-aura hero-aura--left" />
    <div class="hero-aura hero-aura--right" />

    <div class="relative w-full">
      <div class="hero-shell">
        <div class="hero-stage">
          <div class="hero-stage__noise" />
          <div class="hero-stage__grid" />
          <div class="hero-stage__glow hero-stage__glow--one" />
          <div class="hero-stage__glow hero-stage__glow--two" />
          <div class="hero-rain" aria-hidden="true">
            <span
              v-for="drop in rainDrops"
              :key="`drop-${drop.id}`"
              class="hero-rain__drop"
              :style="drop.dropStyle"
            />
            <span
              v-for="drop in rainDrops"
              :key="`splash-${drop.id}`"
              class="hero-rain__splash"
              :style="drop.splashStyle"
            />
          </div>

          <div class="hero-copy">
            <h1 class="hero-title">
              Seu supermercado vende no cartão, mas recebe o valor certo?
            </h1>
          </div>

          <div class="hero-surface" aria-hidden="true" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const rainDrops = [
  { id: 1, left: '8%', delay: 0.15, duration: 2.8, height: '6.8rem', drift: '-0.8rem', travel: '31rem' },
  { id: 2, left: '16%', delay: 1.1, duration: 3.2, height: '7.6rem', drift: '-0.55rem', travel: '33rem' },
  { id: 3, left: '23%', delay: 0.7, duration: 2.95, height: '6.2rem', drift: '-0.7rem', travel: '30rem' },
  { id: 4, left: '31%', delay: 1.85, duration: 3.35, height: '7.8rem', drift: '-0.4rem', travel: '34rem' },
  { id: 5, left: '39%', delay: 0.4, duration: 2.7, height: '6.5rem', drift: '-0.85rem', travel: '31.5rem' },
  { id: 6, left: '47%', delay: 1.45, duration: 3.1, height: '7.1rem', drift: '-0.45rem', travel: '33rem' },
  { id: 7, left: '54%', delay: 0.95, duration: 2.85, height: '6.4rem', drift: '-0.7rem', travel: '31rem' },
  { id: 8, left: '61%', delay: 1.95, duration: 3.25, height: '7.4rem', drift: '-0.35rem', travel: '34rem' },
  { id: 9, left: '69%', delay: 0.3, duration: 2.75, height: '6.1rem', drift: '-0.9rem', travel: '30.5rem' },
  { id: 10, left: '77%', delay: 1.25, duration: 3.05, height: '7rem', drift: '-0.45rem', travel: '32.8rem' },
  { id: 11, left: '85%', delay: 0.8, duration: 2.9, height: '6.3rem', drift: '-0.75rem', travel: '31.2rem' },
  { id: 12, left: '92%', delay: 1.7, duration: 3.15, height: '7.5rem', drift: '-0.35rem', travel: '33.6rem' }
].map((drop) => {
  const impactRatio = 0.82
  return {
    id: drop.id,
    dropStyle: {
      '--drop-left': drop.left,
      '--drop-delay': `${drop.delay}s`,
      '--drop-duration': `${drop.duration}s`,
      '--drop-height': drop.height,
      '--drop-drift': drop.drift,
      '--drop-travel': drop.travel
    },
    splashStyle: {
      '--drop-left': drop.left,
      '--splash-delay': `${(drop.delay + (drop.duration * impactRatio)).toFixed(2)}s`,
      '--splash-cycle': `${drop.duration}s`
    }
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&display=swap');

.hero-shell,
.hero-copy {
  animation: heroFadeUp 0.8s ease both;
}

.hero-grid {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.9), transparent 82%);
}

.hero-aura {
  position: absolute;
  border-radius: 9999px;
  filter: blur(110px);
  pointer-events: none;
}

.hero-aura--left {
  left: -4rem;
  top: 4rem;
  height: 24rem;
  width: 24rem;
  background: rgba(31, 79, 119, 0.24);
}

.hero-aura--right {
  right: -6rem;
  top: 6rem;
  height: 26rem;
  width: 26rem;
  background: rgba(115, 199, 125, 0.18);
}

.hero-shell {
  overflow: hidden;
  border-radius: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.hero-stage {
  position: relative;
  overflow: hidden;
  border-radius: 0;
  min-height: 43rem;
  padding: 6rem 1.4rem 15rem;
  background:
    radial-gradient(circle at 50% 18%, rgba(115, 199, 125, 0.22), transparent 22%),
    radial-gradient(circle at 50% 100%, rgba(115, 199, 125, 0.12), transparent 28%),
    linear-gradient(180deg, #03070d 0%, #06111e 34%, #09233b 72%, #07131f 100%);
}

.hero-stage__noise,
.hero-stage__grid,
.hero-stage__glow {
  position: absolute;
  pointer-events: none;
}

.hero-stage__noise {
  inset: 0;
  opacity: 0.1;
  background-image: radial-gradient(rgba(255, 255, 255, 0.4) 0.7px, transparent 0.7px);
  background-size: 18px 18px;
}

.hero-stage__grid {
  inset: 0;
  opacity: 0.06;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
  background-size: 120px 120px;
  mask-image: none;
}

.hero-stage__glow {
  border-radius: 9999px;
  filter: blur(90px);
}

.hero-stage__glow--one {
  left: 18%;
  top: 10%;
  width: 20rem;
  height: 20rem;
  background: rgba(115, 199, 125, 0.24);
  animation: glowFloat 12s ease-in-out infinite;
}

.hero-stage__glow--two {
  right: 14%;
  top: 12%;
  width: 24rem;
  height: 24rem;
  background: rgba(31, 79, 119, 0.28);
  animation: glowFloat 14s ease-in-out infinite reverse;
}

.hero-rain {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.hero-rain__drop {
  position: absolute;
  top: -20%;
  left: var(--drop-left);
  width: 2px;
  height: var(--drop-height);
  opacity: 0;
  border-radius: 9999px;
  background: linear-gradient(180deg, rgba(186, 255, 63, 0), rgba(167, 243, 121, 0.9), rgba(80, 177, 255, 0.08));
  box-shadow:
    0 0 14px rgba(167, 243, 121, 0.36),
    0 0 24px rgba(59, 130, 246, 0.18);
  filter: blur(0.2px);
  transform: translate3d(0, -8rem, 0);
  animation: rainFall var(--drop-duration) linear infinite;
  animation-delay: var(--drop-delay);
}

.hero-rain__splash {
  position: absolute;
  left: var(--drop-left);
  bottom: 13.2rem;
  width: 4.5rem;
  height: 1.7rem;
  transform: translateX(-50%);
}

.hero-rain__splash::before,
.hero-rain__splash::after {
  content: '';
  position: absolute;
  left: 50%;
  opacity: 0;
}

.hero-rain__splash::before {
  bottom: 0.05rem;
  width: 3.6rem;
  height: 1rem;
  border-top: 1.5px solid rgba(190, 255, 119, 0.72);
  border-radius: 9999px;
  transform: translateX(-50%) scaleX(0.16);
  box-shadow: 0 0 18px rgba(190, 255, 119, 0.2);
  animation: splashRing var(--splash-cycle) linear infinite;
  animation-delay: var(--splash-delay);
}

.hero-rain__splash::after {
  bottom: 0.2rem;
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 9999px;
  background: rgba(214, 255, 177, 0.95);
  box-shadow:
    -0.9rem -0.45rem 0 0 rgba(214, 255, 177, 0.72),
    0.85rem -0.42rem 0 0 rgba(214, 255, 177, 0.7),
    0 -0.95rem 0 0 rgba(214, 255, 177, 0.68);
  transform: translateX(-50%) translateY(0) scale(0.2);
  animation: splashDots var(--splash-cycle) linear infinite;
  animation-delay: var(--splash-delay);
}

.hero-copy {
  position: relative;
  z-index: 3;
  margin: 0 auto;
  max-width: 58rem;
  text-align: center;
}

.hero-title {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: clamp(2.8rem, 5vw, 5rem);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 0.98;
  color: #fff;
  text-shadow:
    0 8px 24px rgba(2, 6, 23, 0.42),
    0 0 42px rgba(115, 199, 125, 0.08);
}

.hero-surface {
  position: absolute;
  left: 50%;
  bottom: -3rem;
  z-index: 1;
  width: min(86rem, calc(100% - 4rem));
  height: 12rem;
  transform: translateX(-50%);
  border-radius: 2rem 2rem 0 0;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background:
    linear-gradient(180deg, rgba(7, 16, 27, 0.98), rgba(2, 6, 12, 0.98)),
    linear-gradient(90deg, rgba(34, 197, 94, 0.05), transparent 32%, rgba(59, 130, 246, 0.08) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 -24px 60px rgba(2, 6, 23, 0.36);
}

.hero-surface::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 50%;
  width: calc(100% - 1.5rem);
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(190, 255, 119, 0.42), rgba(96, 165, 250, 0.36), transparent);
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

@keyframes rainFall {
  0% {
    opacity: 0;
    transform: translate3d(0, -8rem, 0);
  }
  14% {
    opacity: 0.7;
  }
  78% {
    opacity: 0.82;
  }
  84% {
    opacity: 0;
    transform: translate3d(var(--drop-drift), var(--drop-travel), 0);
  }
  100% {
    opacity: 0;
    transform: translate3d(var(--drop-drift), var(--drop-travel), 0);
  }
}

@keyframes splashRing {
  0%, 82% {
    opacity: 0;
    transform: translateX(-50%) scaleX(0.16);
  }
  86% {
    opacity: 0.9;
    transform: translateX(-50%) scaleX(0.55);
  }
  92% {
    opacity: 0.18;
    transform: translateX(-50%) scaleX(1.15);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) scaleX(1.35);
  }
}

@keyframes splashDots {
  0%, 82% {
    opacity: 0;
    transform: translateX(-50%) translateY(0) scale(0.2);
  }
  86% {
    opacity: 0.92;
    transform: translateX(-50%) translateY(-0.4rem) scale(1);
  }
  91% {
    opacity: 0.35;
    transform: translateX(-50%) translateY(-0.9rem) scale(0.9);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-1.15rem) scale(0.3);
  }
}

@keyframes glowFloat {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(1.5rem, -1rem, 0) scale(1.06);
  }
}

@media (max-width: 1023px) {
  .hero-title {
    font-size: clamp(2.4rem, 8vw, 4rem);
  }

  .hero-stage {
    min-height: 39rem;
    padding-bottom: 13rem;
  }

  .hero-rain__splash {
    bottom: 11.5rem;
  }

  .hero-surface {
    width: calc(100% - 2rem);
    height: 10.5rem;
  }
}

@media (max-width: 640px) {
  .hero-stage {
    min-height: 34rem;
    padding: 4.5rem 1rem 10.5rem;
  }

  .hero-rain__drop {
    width: 1.5px;
  }

  .hero-rain__splash {
    bottom: 8.7rem;
    width: 3.6rem;
  }

  .hero-surface {
    bottom: -2rem;
    width: calc(100% - 1rem);
    height: 8rem;
    border-radius: 1.25rem 1.25rem 0 0;
  }
}
</style>
