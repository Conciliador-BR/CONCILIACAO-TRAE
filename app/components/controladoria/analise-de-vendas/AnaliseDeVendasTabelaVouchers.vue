<template>
  <div class="rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur shadow-xl">
    <div class="px-6 py-4 border-b border-gray-200/70">
      <h3 class="text-lg font-semibold text-gray-900">Análise Detalhada - Vouchers</h3>
      <p class="text-sm text-gray-600 mt-1">Receita e margem por voucher (sem detalhamento por adquirente)</p>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Bruta</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Taxa</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Líquida</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margem Bruta</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa Efetiva</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucratividade</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(item, index) in dados"
            :key="item.voucher"
            :class="[index % 2 === 0 ? 'bg-white' : 'bg-gray-50', 'hover:bg-blue-50 transition']"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.voucher }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ formatarMoeda(item.receitaBruta) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">{{ formatarMoeda(item.custoTaxa) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">{{ formatarMoeda(item.receitaLiquida) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatarPercentual(item.margemBruta) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatarPercentual(item.taxaEfetiva) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['px-2 py-1 text-xs font-medium rounded-full', getClassificacao(item.lucratividade)]">
                {{ item.lucratividade }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <p class="text-xs text-gray-500">Receita Bruta Total</p>
          <p class="text-sm font-semibold text-gray-900">{{ formatarMoeda(totalReceitaBruta) }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Custo Total Taxas</p>
          <p class="text-sm font-semibold text-red-600">{{ formatarMoeda(totalCustoTaxa) }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Receita Líquida Total</p>
          <p class="text-sm font-semibold text-green-700">{{ formatarMoeda(totalReceitaLiquida) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dados: {
    type: Array,
    default: () => []
  }
})

const totalReceitaBruta = computed(() => props.dados.reduce((acc, item) => acc + (Number(item?.receitaBruta) || 0), 0))
const totalCustoTaxa = computed(() => props.dados.reduce((acc, item) => acc + (Number(item?.custoTaxa) || 0), 0))
const totalReceitaLiquida = computed(() => props.dados.reduce((acc, item) => acc + (Number(item?.receitaLiquida) || 0), 0))

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor || 0)
}

const formatarPercentual = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((valor || 0) / 100)
}

const getClassificacao = (lucratividade) => {
  if (lucratividade === 'Alta') return 'bg-green-100 text-green-800'
  if (lucratividade === 'Media') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}
</script>
