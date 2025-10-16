<template>
  <tr class="hover:bg-gray-50">
    <td v-for="column in visibleColumns" :key="column" class="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
      <!-- Coluna especial para previsão de pagamento -->
      <span v-if="column === 'previsaoPgto'" class="text-sm font-medium" :class="{
        'text-blue-600': venda.previsaoPgto && venda.previsaoPgto !== '-',
        'text-gray-400': !venda.previsaoPgto || venda.previsaoPgto === '-'
      }">
        {{ venda.previsaoPgto || '-' }}
      </span>
      <span v-else :class="getCellClasses(column)">
        {{ formatCellValue(column, venda[getColumnField(column)]) }}
      </span>
    </td>
  </tr>
</template>

<script setup>
defineProps({
  venda: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  visibleColumns: {
    type: Array,
    required: true
  }
})

defineEmits(['remover-venda'])

// Mapeamento de campos para vendas
const columnFieldMap = {
  dataVenda: 'dataVenda',
  modalidade: 'modalidade',
  nsu: 'nsu',
  vendaBruta: 'vendaBruta',
  vendaLiquida: 'vendaLiquida',
  taxaMdr: 'taxaMdr',
  despesaMdr: 'despesaMdr',
  numeroParcelas: 'numeroParcelas',
  bandeira: 'bandeira',
  valorAntecipado: 'valorAntecipado',
  despesasAntecipacao: 'despesasAntecipacao',
  valorLiquidoAntec: 'valorLiquidoAntec',
  empresa: 'empresa',
  matriz: 'matriz',
  adquirente: 'adquirente',
  previsaoPgto: 'previsaoPgto'  // ✅ Mapeamento da coluna
}

const getColumnField = (column) => {
  return columnFieldMap[column] || column
}

// Função para formatar valores das células
const formatCellValue = (column, value) => {
  if (value === null || value === undefined) return ''
  
  // Formatação para valores monetários
  if (['vendaBruta', 'vendaLiquida', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'].includes(column)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Formatação para taxa MDR (porcentagem)
  if (column === 'taxaMdr') {
    return `${value}%`
  }
  
  // Formatação para data
  if (column === 'dataVenda' && value) {
    // 🔍 DEBUG: Investigar discrepância de datas
    console.log('🔍 [VENDAS] DEBUG Data Venda:', {
      column,
      value,
      type: typeof value,
      isString: typeof value === 'string',
      matchesDDMMYYYY: typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/),
      originalValue: value
    })
    
    // Se a data já está no formato DD/MM/YYYY, retornar como está
    if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      console.log('✅ [VENDAS] Data já formatada DD/MM/YYYY:', value)
      return value
    }
    
    // 🔧 CORREÇÃO: Se a data está no formato YYYY-MM-DD, converter de forma segura
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = value.split('-')
      const dataFormatada = `${dia}/${mes}/${ano}`
      
      console.log('🔄 [VENDAS] Data YYYY-MM-DD convertida:', {
        original: value,
        formatted: dataFormatada
      })
      
      return dataFormatada
    }
    
    // Se a data está em outro formato, converter para DD/MM/YYYY usando criação segura
    try {
      let date
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Se está no formato YYYY-MM-DD, criar data local sem timezone
        const [ano, mes, dia] = value.split('-').map(Number)
        date = new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
      } else {
        date = new Date(value)
      }
      
      if (!isNaN(date.getTime())) {
        const dia = String(date.getDate()).padStart(2, '0')
        const mes = String(date.getMonth() + 1).padStart(2, '0')
        const ano = date.getFullYear()
        const dataFormatada = `${dia}/${mes}/${ano}`
        
        console.log('🔄 [VENDAS] Data convertida:', {
          original: value,
          dateObject: date,
          formatted: dataFormatada
        })
        
        return dataFormatada
      }
    } catch (error) {
      console.error('❌ [VENDAS] Erro ao formatar data:', error)
    }
    
    console.log('⚠️ [VENDAS] Retornando valor original:', value)
    return value
  }
  
  return value
}

// ✅ Nova função para classes das linhas com cores alternadas
const getRowClasses = (index) => {
  const baseClasses = 'hover:bg-blue-50 transition-colors duration-150'
  const isEven = index % 2 === 0
  return isEven ? baseClasses + ' bg-white' : baseClasses + ' bg-gray-50'
}

// Função para classes CSS das células
const getCellClasses = (column) => {
  const baseClasses = 'text-sm'
  
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return baseClasses + ' text-right font-medium'
  }
  
  // Estilo especial para previsão de pagamento
  if (column === 'previsaoPgto') {
    return baseClasses + ' text-center font-medium text-blue-600'
  }
  
  return baseClasses
}
</script>