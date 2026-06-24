<template>
  <div
    class="rounded-3xl border border-white/12 bg-white/[0.08] p-5 shadow-[0_24px_80px_rgba(3,14,26,0.32)] backdrop-blur-xl"
    @mouseenter="handleMouseEnter"
  >
    <div class="stat-value text-3xl font-bold text-white sm:text-4xl">{{ displayValue }}</div>
    <div class="stat-label mt-2 text-sm font-medium text-blue-100">{{ label }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
})

const animatedValue = ref(null)
let hoverInterval = null

const animationConfig = computed(() => {
  if (props.label === 'Recuperados') {
    return {
      start: 800,
      end: 1000,
      step: 10,
      format: value => (value >= 1000 ? '+1 milhão' : `+${value} mil`)
    }
  }

  if (props.label === 'Economizados em Taxas') {
    return {
      start: 80,
      end: 100,
      step: 1,
      format: value => `+${value} mil`
    }
  }

  return null
})

const displayValue = computed(() => {
  if (!animationConfig.value) {
    return props.value
  }

  const currentValue = animatedValue.value ?? animationConfig.value.end
  return animationConfig.value.format(currentValue)
})

const handleMouseEnter = () => {
  if (!animationConfig.value) {
    return
  }

  if (hoverInterval) {
    window.clearInterval(hoverInterval)
  }

  animatedValue.value = animationConfig.value.start
  animatedValue.value = Math.min(
    animatedValue.value + animationConfig.value.step,
    animationConfig.value.end
  )
  hoverInterval = window.setInterval(() => {
    if (!animationConfig.value) {
      window.clearInterval(hoverInterval)
      hoverInterval = null
      return
    }

    if (animatedValue.value >= animationConfig.value.end) {
      animatedValue.value = animationConfig.value.end
      window.clearInterval(hoverInterval)
      hoverInterval = null
      return
    }

    animatedValue.value = Math.min(
      animatedValue.value + animationConfig.value.step,
      animationConfig.value.end
    )
  }, 45)
}

onBeforeUnmount(() => {
  if (hoverInterval) {
    window.clearInterval(hoverInterval)
  }
})

if (import.meta.client) {
  handleMouseEnter()
}
</script>

<style scoped>
.stat-value {
  text-shadow: 0 8px 24px rgba(3, 14, 26, 0.4);
}

.stat-label {
  text-shadow: 0 5px 16px rgba(3, 14, 26, 0.34);
}
</style>
