<template>
  <tr :class="rowClasses">
    <td v-for="column in visibleColumns" :key="column" class="px-4 py-3.5 whitespace-nowrap overflow-hidden transition-colors duration-200 last:border-r-0">
      <!-- Coluna especial para previsão de pagamento -->
      <span
        v-if="column === 'previsaoPgto'"
        :class="[getCellClasses(column, venda), getTextOverflowClasses(column)]"
        :title="String(venda.previsaoPgto || '-')"
      >
        {{ venda.previsaoPgto || '-' }}
      </span>
      <span
        v-else-if="column === 'auditoria'"
        :class="[getCellClasses(column, venda), getTextOverflowClasses(column)]"
        :title="String(getAuditoriaLabel(venda) || '')"
      >
        {{ getAuditoriaLabel(venda) }}
      </span>
      <span
        v-else
        :class="[getCellClasses(column, venda), getTextOverflowClasses(column)]"
        :title="String(formatCellValue(column, venda[getColumnField(column)]) || '')"
      >
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

const { getAuditoriaLabel } = useAuditoriaStatus()

const rowClasses = computed(() => {
  const baseClasses = 'group border-b border-[#244b77]/10 transition-all duration-200 hover:bg-[#f3fbf4]'
  const isEven = props.index % 2 === 0
  return isEven ? `${baseClasses} bg-white` : `${baseClasses} bg-[#f9fcf9]`
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
const getStatusTextClass = (venda) => {
  const status = getAuditoriaLabel(venda)
  if (status === 'Conciliado') return 'text-emerald-700'
  if (status === 'Atrasado') return 'text-rose-700'
  return 'text-slate-700'
}

const getCellClasses = (column, venda) => {
  const statusClass = getStatusTextClass(venda)
  const baseClasses = `table-cell-text text-sm ${statusClass}`
  
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return baseClasses + ' table-strong-text text-right font-medium'
  }
  
  if (column === 'previsaoPgto') {
    return baseClasses + ' text-center font-medium'
  }
  if (column === 'auditoria') {
    return baseClasses + ' text-center font-medium'
  }
  if (column === 'empresa' || column === 'modalidade') {
    return baseClasses + ' table-strong-text font-medium'
  }
  if (column === 'adquirente' || column === 'bandeira') {
    return baseClasses + ' table-strong-text uppercase tracking-wide'
  }
  
  return baseClasses
}

const getTextOverflowClasses = (column) => {
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return 'block w-full overflow-hidden text-ellipsis'
  }

  return 'block max-w-full overflow-hidden text-ellipsis'
}

</script>

<style scoped>
.table-cell-text {
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
}

.table-strong-text {
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(47, 125, 50, 0.12);
}
</style>
