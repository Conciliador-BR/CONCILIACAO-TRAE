<template>
  <Transition name="login-transition">
    <div
      v-if="visible"
      class="pointer-events-none fixed inset-0 z-[140] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(18,60,33,0.1),rgba(18,60,33,0.03)_42%,transparent_76%)]"
      aria-hidden="true"
    >
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="chart-stage">
          <svg viewBox="0 0 1600 900" class="chart-svg" role="presentation">
            <defs>
              <linearGradient id="chartLineGradient" x1="0%" y1="85%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#4e9f5c" />
                <stop offset="55%" stop-color="#73c77d" />
                <stop offset="100%" stop-color="#8fda98" />
              </linearGradient>
              <filter id="chartGlow">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker id="chartArrow" markerWidth="34" markerHeight="34" refX="22" refY="17" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M3 3 L31 17 L3 31 Q11 17 3 3 Z" fill="#8fda98" />
              </marker>
            </defs>

            <g class="chart-grid">
              <line x1="140" y1="720" x2="1460" y2="720" />
              <line x1="140" y1="570" x2="1460" y2="570" />
              <line x1="140" y1="420" x2="1460" y2="420" />
              <line x1="140" y1="270" x2="1460" y2="270" />
              <line x1="140" y1="120" x2="1460" y2="120" />
            </g>

            <path
              class="chart-line"
              d="M120 735 L250 590 L360 640 L500 445 L640 525 L805 310 L975 395 L1145 170 L1410 60"
              pathLength="100"
              filter="url(#chartGlow)"
              marker-end="url(#chartArrow)"
            />
          </svg>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.chart-stage {
  width: min(92vw, 1280px);
  opacity: 0.2;
  transform: scale(1.18);
  animation: chartStageMotion 2.4s ease-in-out both;
}

.chart-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.chart-grid line {
  stroke: rgba(115, 199, 125, 0.14);
  stroke-width: 2;
}

.chart-line {
  fill: none;
  stroke: url(#chartLineGradient);
  stroke-width: 22;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: chartLineRise 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards, chartLineWave 1.5s ease-in-out 0.95s 1;
}

.login-transition-enter-active,
.login-transition-leave-active {
  transition: opacity 0.28s ease;
}

.login-transition-enter-from,
.login-transition-leave-to {
  opacity: 0;
}

@keyframes chartLineRise {
  0% {
    stroke-dashoffset: 100;
    transform: translateY(36px) scale(0.985);
    opacity: 0.2;
  }
  100% {
    stroke-dashoffset: 0;
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes chartLineWave {
  0% {
    transform: translateY(0);
  }
  16.66% {
    transform: translateY(-26px);
  }
  33.33% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(18px);
  }
  66.66% {
    transform: translateY(0);
  }
  83.33% {
    transform: translateY(-14px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes chartStageMotion {
  0% {
    transform: scale(1.08);
  }
  16.66% {
    transform: translateY(-16px) scale(1.16);
  }
  33.33% {
    transform: translateY(0) scale(1.18);
  }
  50% {
    transform: translateY(10px) scale(1.17);
  }
  66.66% {
    transform: translateY(0) scale(1.18);
  }
  83.33% {
    transform: translateY(-7px) scale(1.175);
  }
  100% {
    transform: translateY(0) scale(1.18);
  }
}
</style>
