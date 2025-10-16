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
  // 🔍 DEBUG: Investigar discrepância de datas de previsão
  console.log('🔍 [PREVISAO_COLUNA] DEBUG Venda completa:', {
    id: props.venda.id,
    data_venda: props.venda.data_venda,
    dataVenda: props.venda.dataVenda,
    previsao_pgto: props.venda.previsao_pgto,
    previsaoPgto: props.venda.previsaoPgto,
    empresa: props.venda.empresa
  })
  
  // Primeiro, tentar usar a coluna previsao_pgto se existir
  if (props.venda.previsao_pgto) {
    console.log('✅ [PREVISAO_COLUNA] Usando previsao_pgto existente:', props.venda.previsao_pgto)
    
    // 🔧 CORREÇÃO: Criar data de forma segura para evitar problemas de timezone
    let data
    if (typeof props.venda.previsao_pgto === 'string' && props.venda.previsao_pgto.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Se está no formato YYYY-MM-DD, criar data local sem timezone
      const [ano, mes, dia] = props.venda.previsao_pgto.split('-').map(Number)
      data = new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
    } else {
      data = new Date(props.venda.previsao_pgto)
    }
    
    if (!isNaN(data.getTime())) {
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      }).format(data)
      
      console.log('🔄 [PREVISAO_COLUNA] Previsao formatada:', {
        original: props.venda.previsao_pgto,
        dateObject: data,
        formatted: dataFormatada,
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
        dia: data.getDate()
      })
      
      return dataFormatada
    }
  }
  
  // Fallback: usar data_venda + 30 dias se previsao_pgto não existir
  if (props.venda.data_venda) {
    console.log('⚠️ [PREVISAO_COLUNA] Calculando fallback com data_venda:', props.venda.data_venda)
    
    // 🔧 CORREÇÃO: Criar data de forma segura para evitar problemas de timezone
    let dataVenda
    if (typeof props.venda.data_venda === 'string' && props.venda.data_venda.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Se está no formato YYYY-MM-DD, criar data local sem timezone
      const [ano, mes, dia] = props.venda.data_venda.split('-').map(Number)
      dataVenda = new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
    } else {
      dataVenda = new Date(props.venda.data_venda)
    }
    
    if (!isNaN(dataVenda.getTime())) {
      const dataPrevisao = new Date(dataVenda)
      dataPrevisao.setDate(dataPrevisao.getDate() + 30)
      
      // Pular fins de semana
      while (dataPrevisao.getDay() === 0 || dataPrevisao.getDay() === 6) {
        dataPrevisao.setDate(dataPrevisao.getDate() + 1)
      }
      
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      }).format(dataPrevisao)
      
      console.log('🔄 [PREVISAO_COLUNA] Fallback calculado:', {
        data_venda: props.venda.data_venda,
        dataVendaObject: dataVenda,
        dataPrevisaoObject: dataPrevisao,
        formatted: dataFormatada
      })
      
      return dataFormatada
    }
  }
  
  console.log('❌ [PREVISAO_COLUNA] Nenhuma data válida encontrada')
  return '-'
})
</script>