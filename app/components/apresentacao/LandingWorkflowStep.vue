<template>
  <article class="workflow-stat" :class="`workflow-stat--${tone}`">
    <div class="workflow-stat__noise" aria-hidden="true" />
    <div class="workflow-stat__glow" aria-hidden="true" />
    <div class="workflow-stat__grid" aria-hidden="true" />

    <div class="workflow-stat__content">
      <div class="workflow-stat__value">{{ value }}</div>
      <h3 class="workflow-stat__label">{{ label }}</h3>
      <p class="workflow-stat__description">{{ description }}</p>
    </div>

    <div class="workflow-stat__footer" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  </article>
</template>

<script setup>
defineProps({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  tone: {
    type: String,
    default: 'ocean'
  }
})
</script>

<style scoped>
.workflow-stat {
  position: relative;
  overflow: hidden;
  min-height: 24rem;
  padding: 1.25rem;
  border-radius: 2rem;
  isolation: isolate;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 26%),
    linear-gradient(145deg, rgba(4, 10, 20, 0.98), rgba(8, 18, 32, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 26px 80px rgba(2, 6, 23, 0.34);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}

.workflow-stat:hover {
  transform: translateY(-8px);
  border-color: rgba(148, 163, 184, 0.26);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 34px 90px rgba(2, 6, 23, 0.44);
}

.workflow-stat--ocean {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 26%),
    radial-gradient(circle at top right, rgba(15, 160, 206, 0.18), transparent 36%),
    linear-gradient(145deg, #05111d 0%, #0a2038 54%, #0b1830 100%);
}

.workflow-stat--emerald {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 26%),
    radial-gradient(circle at top right, rgba(115, 199, 125, 0.18), transparent 36%),
    linear-gradient(145deg, #05111d 0%, #0a2a25 54%, #071822 100%);
}

.workflow-stat--violet {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 26%),
    radial-gradient(circle at top right, rgba(129, 140, 248, 0.18), transparent 36%),
    linear-gradient(145deg, #08111f 0%, #20163b 54%, #0a1629 100%);
}

.workflow-stat__noise,
.workflow-stat__glow,
.workflow-stat__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.workflow-stat__noise {
  opacity: 0.1;
  background-image: radial-gradient(rgba(255, 255, 255, 0.5) 0.7px, transparent 0.7px);
  background-size: 18px 18px;
}

.workflow-stat__glow {
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.18), transparent 24%),
    radial-gradient(circle at 82% 100%, rgba(255, 255, 255, 0.1), transparent 28%);
}

.workflow-stat__grid {
  opacity: 0.08;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.22) 1px, transparent 1px);
  background-size: 92px 92px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.96), transparent 85%);
}

.workflow-stat__content,
.workflow-stat__footer {
  position: relative;
  z-index: 1;
}

.workflow-stat__content {
  margin-top: 0.8rem;
  max-width: 17rem;
}

.workflow-stat__value {
  font-size: clamp(3.8rem, 7vw, 5.5rem);
  line-height: 0.9;
  font-weight: 800;
  letter-spacing: -0.07em;
  color: #ffffff;
  text-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
}

.workflow-stat__label {
  margin-top: 1rem;
  max-width: 12ch;
  font-size: clamp(1.6rem, 3vw, 2.15rem);
  line-height: 0.98;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #f8fbff;
  text-transform: lowercase;
  text-wrap: balance;
}

.workflow-stat__description {
  margin-top: 0.95rem;
  max-width: 15rem;
  font-size: 0.98rem;
  line-height: 1.7;
  color: rgba(221, 232, 246, 0.72);
}

.workflow-stat__footer {
  position: absolute;
  left: 1.25rem;
  right: 1.25rem;
  bottom: 1.25rem;
  display: grid;
  grid-template-columns: 1.3fr 0.9fr 0.5fr;
  gap: 0.7rem;
}

.workflow-stat__footer span {
  height: 0.3rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
}

.workflow-stat__footer span:first-child {
  background: rgba(255, 255, 255, 0.24);
}

@media (max-width: 768px) {
  .workflow-stat {
    min-height: 21.5rem;
  }

  .workflow-stat__content {
    margin-top: 1.75rem;
  }
}
</style>
