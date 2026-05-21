<template>
  <div class="chart-accent" aria-hidden="true">
    <svg viewBox="0 0 260 180" class="chart-accent__svg" role="presentation">
      <defs>
        <linearGradient id="loginAccentGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#4e9f5c" />
          <stop offset="55%" stop-color="#73c77d" />
          <stop offset="100%" stop-color="#8fda98" />
        </linearGradient>
        <filter id="loginAccentGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="loginAccentArrow" markerWidth="16" markerHeight="16" refX="10" refY="8" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M1 1 L15 8 L1 15 Q5.5 8 1 1 Z" fill="#8fda98" />
        </marker>
      </defs>

      <g class="chart-accent__grid">
        <line x1="18" y1="148" x2="246" y2="148" />
        <line x1="18" y1="108" x2="246" y2="108" />
        <line x1="18" y1="68" x2="246" y2="68" />
      </g>

      <path
        class="chart-accent__line"
        d="M18 148 L48 118 L78 130 L112 88 L148 104 L184 60 L244 16"
        pathLength="100"
        filter="url(#loginAccentGlow)"
        marker-end="url(#loginAccentArrow)"
      />
    </svg>
  </div>
</template>

<style scoped>
.chart-accent {
  width: clamp(4.5rem, 10vw, 7rem);
  opacity: 0.88;
}

.chart-accent__svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.chart-accent__grid line {
  stroke: rgba(143, 218, 152, 0.16);
  stroke-width: 1.4;
}

.chart-accent__line {
  fill: none;
  stroke: url(#loginAccentGradient);
  stroke-width: 9;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: accentLineDraw 1.15s ease-out forwards, accentLineFloat 2.2s ease-in-out 1.15s infinite;
}

@keyframes accentLineDraw {
  from {
    stroke-dashoffset: 100;
    opacity: 0.25;
    transform: translateY(8px);
  }
  to {
    stroke-dashoffset: 0;
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes accentLineFloat {
  0%, 100% {
    transform: translateY(0);
  }
  35% {
    transform: translateY(-4px);
  }
  70% {
    transform: translateY(2px);
  }
}
</style>
