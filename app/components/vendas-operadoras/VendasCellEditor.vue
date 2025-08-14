<template>
  <input
    :value="value"
    @input="$emit('update', $event.target.value)"
    :class="getCellClasses(column)"
    :placeholder="getPlaceholder(column)"
    :readonly="isReadOnly(column)"
    :step="getStep(column)"
    :type="getInputType(column)"
  />
</template>

<script setup>
defineProps({
  column: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: ''
  }
})

defineEmits(['update'])

// Funções auxiliares - APENAS INPUTS, SEM SELECTS
const getInputType = (column) => {
  if (['dataVenda'].includes(column)) return 'date'
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'].includes(column)) return 'number'
  if (['numeroParcelas'].includes(column)) return 'number'
  return 'text'
}

const getCellClasses = (column) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
  
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return baseClasses + ' text-right'
  }
  
  return baseClasses
}

const getPlaceholder = (column) => {
  const placeholders = {
    dataVenda: 'Data da venda',
    modalidade: 'Modalidade',
    nsu: 'NSU da transação',
    vendaBruta: 'Valor bruto',
    vendaLiquida: 'Valor líquido',
    taxaMdr: 'Taxa MDR',
    despesaMdr: 'Despesa MDR',
    numeroParcelas: 'Nº parcelas',
    bandeira: 'Bandeira',
    valorAntecipado: 'Valor antecipado',
    despesasAntecipacao: 'Despesas antecipação',
    valorLiquidoAntec: 'Valor líquido antec.',
    empresa: 'Empresa',
    matriz: 'Matriz'
  }
  return placeholders[column] || ''
}

const isReadOnly = (column) => {
  return false
}

const getStep = (column) => {
  return ['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'].includes(column) ? '0.01' : '1'
}
</script>