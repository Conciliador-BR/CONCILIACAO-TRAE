<template>
  <tr :class="rowClasses">
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
import { computed } from 'vue'
import { useAuditoriaStatus } from '~/composables/useAuditoriaStatus'

const props = defineProps({
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

const { getAuditoriaLabel, getRowClassByStatus } = useAuditoriaStatus()

const rowClasses = computed(() => {
  const statusClass = getRowClassByStatus(props.venda)
  if (statusClass) return statusClass
  
  // Default striped/hover logic if no status color
  const baseClasses = 'hover:bg-blue-50 transition-colors duration-150'
  const isEven = props.index % 2 === 0
  return isEven ? baseClasses + ' bg-white' : baseClasses + ' bg-gray-50'
})

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

// Removido getRowClasses pois agora usamos rowClasses computed
// const getRowClasses = (index) => { ... }

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
// (Mantemos getAuditoriaLabel e getAuditoriaClasses para a célula específica, se necessário, 
// mas a lógica principal de label vem do composable agora)

const getAuditoriaClasses = (venda) => {
  const label = getAuditoriaLabel(venda)
  const base = 'text-sm text-center font-medium block'
  
  // As cores das CÉLULAS podem ser mantidas ou removidas já que a linha toda muda.
  // O usuário pediu "a linha deve ficar verde", etc.
  // Vamos manter o texto colorido para reforçar, ou ajustar para harmonizar com o fundo.
  // Se o fundo é verde (conciliado), texto verde escuro fica bom.
  
  if (label === 'Conciliado') return `${base} text-green-900`
  if (label === 'Atrasado') return `${base} text-red-900`
  if (label === 'A receber') return `${base} text-blue-600` // Linha é padrão, texto azul
  
  return `${base} text-gray-500`
}
</script>
