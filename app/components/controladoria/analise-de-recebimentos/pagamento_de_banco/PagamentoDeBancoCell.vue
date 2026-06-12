<template>
  <td class="px-8 py-5 whitespace-nowrap rounded-lg bg-gray-50 text-right text-sm font-bold">
    <span :class="classeValor">
      {{ textoExibicao }}
    </span>
  </td>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pagamentoBanco: {
    type: [Number, String],
    default: 0
  }
})

const valorNumerico = computed(() => Number(props.pagamentoBanco || 0))
const temValor = computed(() => Number.isFinite(valorNumerico.value) && valorNumerico.value !== 0)
const classeValor = computed(() => {
  if (!Number.isFinite(valorNumerico.value)) return 'text-gray-400'
  return valorNumerico.value < 0 ? 'text-rose-700' : 'text-emerald-700'
})
const textoExibicao = computed(() => {
  if (!temValor.value) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valorNumerico.value)
})
</script>
