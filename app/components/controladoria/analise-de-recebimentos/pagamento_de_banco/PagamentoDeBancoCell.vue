<template>
  <td class="px-8 py-6 whitespace-nowrap text-right text-sm font-bold bg-gray-50/50 rounded-lg">
    <span :class="temValor ? 'text-emerald-700' : 'text-gray-400'">
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
const temValor = computed(() => Number.isFinite(valorNumerico.value) && valorNumerico.value > 0)
const textoExibicao = computed(() => {
  if (!temValor.value) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valorNumerico.value)
})
</script>
