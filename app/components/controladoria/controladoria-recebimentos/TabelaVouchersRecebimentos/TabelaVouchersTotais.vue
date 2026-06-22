<template>
  <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
    <tr class="font-bold">
      <td class="px-8 py-5 text-sm font-bold">TOTAL Vouchers</td>
      <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_bruto) }}</td>
      <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesa_mdr) }}</td>
      <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_liquido) }}</td>
      <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesa_antecipacao) }}</td>
      <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_previsto) }}</td>
      <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.pgto_banco) }}</td>
      <td class="px-8 py-5 text-left text-sm font-bold"></td>
    </tr>
  </tfoot>
</template>

<script setup>
defineProps({
  totais: {
    type: Object,
    default: () => ({})
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
</script>
