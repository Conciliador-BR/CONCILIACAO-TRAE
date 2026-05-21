<template>
  <div class="login-side-panel">
    <div class="login-side-panel__chart-window" aria-hidden="true">
      <svg viewBox="0 0 620 700" class="login-side-panel__chart-svg" role="presentation">
        <defs>
          <linearGradient id="sideChartGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#4e9f5c" />
            <stop offset="55%" stop-color="#73c77d" />
            <stop offset="100%" stop-color="#9ce3a4" />
          </linearGradient>
          <filter id="sideChartGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker
            id="sideChartArrow"
            markerWidth="24"
            markerHeight="24"
            refX="14"
            refY="12"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M1 1 L23 12 L1 23 Q8 12 1 1 Z" fill="#9ce3a4" />
          </marker>
        </defs>
        <path
          class="login-side-panel__line login-side-panel__line--main"
          filter="url(#sideChartGlow)"
          marker-end="url(#sideChartArrow)"
          d="M54 670 L122 598 L188 620 L258 500 L324 528 L404 350 L482 386 L576 138"
          pathLength="100"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.login-side-panel {
  position: relative;
  width: 100%;
  height: 100%;
  background: none;
}

.login-side-panel__chart-window {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-side-panel__chart-svg {
  width: min(100%, 34rem);
  height: auto;
  overflow: visible;
  opacity: 0.2;
}

.login-side-panel__line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.login-side-panel__line--main {
  stroke: url(#sideChartGradient);
  stroke-width: 18;
  opacity: 1;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: lineGrow 7.5s linear infinite;
}

@keyframes lineGrow {
  0% {
    stroke-dashoffset: 100;
    opacity: 0.18;
  }
  8% {
    opacity: 0.92;
  }
  82% {
    stroke-dashoffset: 0;
    opacity: 0.92;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}
</style>
