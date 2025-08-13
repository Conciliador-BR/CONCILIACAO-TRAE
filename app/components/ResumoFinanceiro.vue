<template>
  <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
    <h2 class="text-xl font-bold text-gray-800 mb-4">Vendas Operadoras</h2>
    
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <!-- Vendas Brutas -->
      <div class="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
        <h3 class="text-sm font-medium text-blue-700 mb-1">Vendas Brutas</h3>
        <p class="text-lg font-bold text-blue-900">R$ {{ formatCurrency(resumo.vendasBrutas) }}</p>
        <span class="text-xs text-blue-600">{{ resumo.qtdVendasBrutas }} Registros</span>
      </div>
      
      <!-- Taxa -->
      <div class="bg-red-50 p-4 rounded-lg shadow border border-red-200">
        <h3 class="text-sm font-medium text-red-700 mb-1">Taxa</h3>
        <p class="text-lg font-bold text-red-900">-R$ {{ formatCurrency(resumo.taxa) }}</p>
        <span class="text-xs text-red-600">Taxa Média: {{ resumo.taxaMedia }}%</span>
      </div>
      
      <!-- Vendas Líquidas -->
      <div class="bg-green-50 p-4 rounded-lg shadow border border-green-200">
        <h3 class="text-sm font-medium text-green-700 mb-1">Vendas Líquidas</h3>
        <p class="text-lg font-bold text-green-900">R$ {{ formatCurrency(resumo.vendasLiquidas) }}</p>
        <span class="text-xs text-green-600">{{ resumo.qtdVendasLiquidas }} Registros</span>
      </div>
      
      <!-- Débitos -->
      <div class="bg-orange-50 p-4 rounded-lg shadow border border-orange-200">
        <h3 class="text-sm font-medium text-orange-700 mb-1">Débitos</h3>
        <p class="text-lg font-bold text-orange-900">-R$ {{ formatCurrency(resumo.debitos) }}</p>
        <span class="text-xs text-orange-600">{{ resumo.qtdDebitos }} Registros</span>
      </div>
      
      <!-- Rejeitados -->
      <div class="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
        <h3 class="text-sm font-medium text-purple-700 mb-1">Rejeitados</h3>
        <p class="text-lg font-bold text-purple-900">R$ {{ formatCurrency(resumo.rejeitados) }}</p>
        <span class="text-xs text-purple-600">{{ resumo.qtdRejeitados }} Registros</span>
      </div>
      
      <!-- Total Líquido -->
      <div class="bg-blue-100 p-4 rounded-lg shadow border border-blue-300">
        <h3 class="text-sm font-medium text-blue-800 mb-1">Total Líquido</h3>
        <p class="text-lg font-bold text-blue-900">R$ {{ formatCurrency(resumo.totalLiquido) }}</p>
        <span class="text-xs text-blue-700">Saldo Final</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  resumo: {
    type: Object,
    default: () => ({
      vendasBrutas: 984541.77,
      qtdVendasBrutas: 11,
      taxa: 699.96,
      taxaMedia: 2.04,
      vendasLiquidas: 21706.80,
      qtdVendasLiquidas: 25,
      debitos: 0,
      qtdDebitos: 11,
      rejeitados: 0,
      qtdRejeitados: 0,
      totalLiquido: 960417.35
    })
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
</script>