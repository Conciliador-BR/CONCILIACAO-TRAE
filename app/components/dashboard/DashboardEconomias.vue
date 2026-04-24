<template>
  <div class="bg-white p-6 rounded-xl shadow-lg border border-[#DCE7F3]">
    <h3 class="text-lg font-semibold text-[#102A43] mb-4">Análise de Economias e Otimizações</h3>
    <div class="space-y-4">
      <div class="flex justify-between items-center p-3 bg-[#E6F4EA] rounded-lg border border-[#B7E4C7]">
        <span class="text-sm font-medium text-[#1E7E34]">Negociação de Taxas</span>
        <span class="text-lg font-bold text-[#1E7E34]">R$ {{ formatCurrency(economias.negociacaoTaxas) }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-[#EAF3FF] rounded-lg border border-[#BFDBFE]">
        <span class="text-sm font-medium text-[#1D4ED8]">Otimização de Bandeiras</span>
        <span class="text-lg font-bold text-[#1D4ED8]">R$ {{ formatCurrency(economias.otimizacaoBandeiras) }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-[#FFF4E5] rounded-lg border border-[#FFD8A8]">
        <span class="text-sm font-medium text-[#B56A00]">Consolidação de Adquirentes</span>
        <span class="text-lg font-bold text-[#B56A00]">R$ {{ formatCurrency(economias.consolidacaoAdquirentes) }}</span>
      </div>
      <div class="border-t pt-3">
        <div class="flex justify-between items-center">
          <span class="text-base font-semibold text-[#102A43]">Total de Economias</span>
          <span class="text-xl font-bold text-[#102A43]">R$ {{ formatCurrency(economias.total) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  economias: {
    type: Object,
    required: true
  }
})

const formatCurrency = (value) => {
  if (!value) return '0,00'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}
</script>
