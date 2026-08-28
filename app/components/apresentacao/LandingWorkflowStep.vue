<template>
  <article class="workflow-stat" :class="`workflow-stat--${tone}`">
    <div class="workflow-stat__shine" aria-hidden="true" />
    <div class="workflow-stat__pattern" aria-hidden="true">
      <span v-for="index in 8" :key="index">+</span>
    </div>

    <div class="workflow-stat__content">
      <div class="workflow-stat__value">{{ value }}</div>
      <h3 class="workflow-stat__label">{{ label }}</h3>
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
  tone: {
    type: String,
    default: 'slate'
  }
})
</script>

<style scoped>
.workflow-stat {
  position: relative;
  overflow: hidden;
  min-height: 23rem;
  border-radius: 2rem;
  padding: 2rem 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  isolation: isolate;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.workflow-stat:hover {
  transform: translateY(-6px);
  box-shadow: 0 32px 72px rgba(15, 23, 42, 0.22);
}

.workflow-stat--slate {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 24%),
    linear-gradient(135deg, #5d5a60 0%, #666269 34%, #747177 100%);
}

.workflow-stat--lime {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 22%),
    linear-gradient(135deg, #8eae00 0%, #a6c40f 52%, #97b60c 100%);
}

.workflow-stat--teal {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 22%),
    linear-gradient(135deg, #1d7d6d 0%, #22a08a 52%, #1b8976 100%);
}

.workflow-stat__shine {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.16), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, transparent 26%);
  pointer-events: none;
}

.workflow-stat__pattern {
  position: absolute;
  left: 50%;
  bottom: 1.7rem;
  display: flex;
  gap: 1rem;
  transform: translateX(-50%);
  color: rgba(28, 58, 78, 0.26);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  pointer-events: none;
}

.workflow-stat__content {
  position: relative;
  z-index: 1;
  max-width: 16rem;
}

.workflow-stat__value {
  font-size: clamp(3.9rem, 8vw, 5.8rem);
  line-height: 0.92;
  font-weight: 800;
  letter-spacing: -0.06em;
  white-space: nowrap;
  color: #ffffff;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.workflow-stat__label {
  margin-top: 1.3rem;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  line-height: 1.02;
  font-weight: 700;
  letter-spacing: -0.03em;
  white-space: nowrap;
  color: #ffffff;
}

@media (max-width: 768px) {
  .workflow-stat {
    min-height: 19rem;
    padding: 1.6rem 1.2rem;
  }

  .workflow-stat__pattern {
    gap: 0.7rem;
    font-size: 1.5rem;
  }
}
</style>
