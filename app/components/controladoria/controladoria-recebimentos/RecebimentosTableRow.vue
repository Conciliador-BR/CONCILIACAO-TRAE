<template>
  <tr class="hover:bg-gray-50">
    <td v-for="column in visibleColumns" :key="column" class="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
      <span :class="getCellClasses(column)">
        {{ formatCellValue(column, recebimento[getColumnField(column)]) }}
      </span>
    </td>
  </tr>
</template>

<script setup>
defineProps({
  recebimento: { type: Object, required: true },
  index: { type: Number, required: true },
  visibleColumns: { type: Array, required: true }
})

const columnFieldMap = {
  dataRecebimento: 'dataRecebimento',
  dataVenda: 'dataVenda',
  modalidade: 'modalidade',
  nsu: 'nsu',
  valorBruto: 'valorBruto',
  valorLiquido: 'valorLiquido',
  taxaMdr: 'taxaMdr',
  despesaMdr: 'despesaMdr',
  numeroParcelas: 'numeroParcelas',
  bandeira: 'bandeira',
  empresa: 'empresa',
  matriz: 'matriz',
  adquirente: 'adquirente'
}

const getColumnField = (column) => columnFieldMap[column] || column

const formatCellValue = (column, value) => {
  if (value === null || value === undefined) return ''
  if (['valorBruto','valorLiquido','despesaMdr'].includes(column)) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  if (column === 'taxaMdr') {
    return `${value}%`
  }
  if ((column === 'dataRecebimento' || column === 'dataVenda') && value) {
    const str = String(value)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y,m,d] = str.split('-')
      return `${d}/${m}/${y}`
    }
    try {
      const date = new Date(str)
      if (!isNaN(date.getTime())) {
        const dia = String(date.getDate()).padStart(2, '0')
        const mes = String(date.getMonth() + 1).padStart(2, '0')
        const ano = date.getFullYear()
        return `${dia}/${mes}/${ano}`
      }
    } catch {}
    return value
  }
  return value
}

const getCellClasses = (column) => {
  const base = 'text-sm'
  if (['valorBruto','valorLiquido','taxaMdr','despesaMdr','numeroParcelas'].includes(column)) return base + ' text-right font-medium'
  return base
}
</script>