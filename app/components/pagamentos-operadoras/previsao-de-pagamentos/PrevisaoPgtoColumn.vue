<template>
  <span :class="{
    'text-green-600 font-medium': previsaoExistente && previsaoExistente !== '-',
    'text-gray-400': !previsaoExistente || previsaoExistente === '-',
    'text-blue-600': previsaoExistente
  }">
    {{ previsaoExistente || '-' }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  venda: {
    type: Object,
    required: true
  }
})

// Buscar a previsão de pagamento da coluna previsao_pgto
const previsaoExistente = computed(() => {
  // Primeiro, tentar usar a coluna previsao_pgto se existir
  if (props.venda.previsao_pgto) {
    const data = new Date(props.venda.previsao_pgto)
    if (!isNaN(data.getTime())) {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      }).format(data)
    }
  }
  
  // Fallback: usar data_venda + 30 dias se previsao_pgto não existir
  if (props.venda.data_venda) {
    const dataVenda = new Date(props.venda.data_venda)
    if (!isNaN(dataVenda.getTime())) {
      const dataPrevisao = new Date(dataVenda)
      dataPrevisao.setDate(dataPrevisao.getDate() + 30)
      
      // Pular fins de semana
      while (dataPrevisao.getDay() === 0 || dataPrevisao.getDay() === 6) {
        dataPrevisao.setDate(dataPrevisao.getDate() + 1)
      }
      
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      }).format(dataPrevisao)
    }
  }
  
  return '-'
})
</script>