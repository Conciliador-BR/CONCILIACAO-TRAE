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
      <span v-else-if="column === 'auditoria'" :class="getAuditoriaClasses(venda)">
        {{ getAuditoriaLabel(venda) }}
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
  previsaoPgto: 'previsaoPgto',
  auditoria: 'auditoria'
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
    // Se a data já está no formato DD/MM/YYYY, retornar como está
    if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return value
    }
    
    // Se a data está no formato YYYY-MM-DD, converter de forma segura
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = value.split('-')
      const dataFormatada = `${dia}/${mes}/${ano}`
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
        return dataFormatada
      }
    } catch (error) {
      // Erro silencioso ao formatar data
    }
    
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
  if (column === 'auditoria') {
    return baseClasses + ' text-center font-medium'
  }
  
  return baseClasses
}

// Lógica para Auditoria
const getAuditoriaLabel = (venda) => {
  const status = venda.auditoria
  if (status === 'Conciliado') return 'Conciliado'
  
  const previsao = venda.previsaoPgto
  if (!previsao || previsao === '-') return status || 'Não conciliado'
  
  try {
    // Parse DD/MM/YYYY
    const parts = previsao.split('/')
    if (parts.length !== 3) return status || 'Não conciliado'
    
    const dia = parseInt(parts[0], 10)
    const mes = parseInt(parts[1], 10) - 1
    const ano = parseInt(parts[2], 10)
    
    const dataPrevista = new Date(ano, mes, dia)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    // Comparar datas (ignorando hora)
    if (dataPrevista < hoje) return 'Atrasado'
    return 'A receber'
  } catch (e) {
    return status || 'Não conciliado'
  }
}

const getAuditoriaClasses = (venda) => {
  const label = getAuditoriaLabel(venda)
  const base = 'text-sm text-center font-medium block'
  
  if (label === 'Conciliado') return `${base} text-green-600`
  if (label === 'Atrasado') return `${base} text-red-600`
  if (label === 'A receber') return `${base} text-blue-600`
  
  return `${base} text-gray-500`
}
</script>
