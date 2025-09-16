<template>
  <div class="text-right">
    <span v-if="previsaoDia" :class="{
      'text-green-600 font-bold': previsaoDia.valorTotalPrevisto > 0,
      'text-gray-400': previsaoDia.valorTotalPrevisto === 0
    }">
      {{ formatCurrency(previsaoDia.valorTotalPrevisto) }}
    </span>
    <span v-else class="text-gray-400">-</span>
    
    <!-- Tooltip com detalhes -->
    <div v-if="previsaoDia && previsaoDia.totalVendas > 0" 
         class="text-xs text-gray-500 mt-1">
      {{ previsaoDia.totalVendas }} venda{{ previsaoDia.totalVendas > 1 ? 's' : '' }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: String,
    required: true
  },
  previsoesDiarias: {
    type: Array,
    default: () => []
  }
})

// Encontrar previsão para esta data
const previsaoDia = computed(() => {
  if (!props.data || !props.previsoesDiarias) return null
  
  // Converter data do banco (pode estar em formato diferente) para DD/MM/YYYY
  let dataFormatada = props.data
  
  // Se a data está em formato ISO (YYYY-MM-DD), converter
  if (props.data.includes('-')) {
    const [ano, mes, dia] = props.data.split('-')
    dataFormatada = `${dia}/${mes}/${ano}`
  }
  
  return props.previsoesDiarias.find(previsao => previsao.data === dataFormatada)
})

// Função para formatar valor monetário
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
</script>