<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <h2 class="text-xl font-semibold text-gray-900">ÚNICA</h2>
      <p class="text-sm text-gray-600 mt-1">Adquirente de Cartões</p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-2xl">
          <tr class="border-b border-blue-700/50">
            <th class="px-8 py-5 text-left text-sm font-bold text-white uppercase tracking-wider">Adquirente</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Débito</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Crédito</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Crédito 2x</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Crédito 3x</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Crédito 4x-6x</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Bruto</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Despesas MDR</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Líquido</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Despesas C/ antecipação</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Pago</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-for="(item, index) in recebimentosData" :key="index" class="hover:bg-gray-50 transition-colors duration-200 group">
            <td class="px-8 py-5 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" :class="getAdquirenteColor(index)"></div>
                <span class="text-sm font-medium text-gray-900 group-hover:text-blue-700">{{ item.adquirente }}</span>
              </div>
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.debito !== 0 ? 'text-red-600' : 'text-gray-400') : (item.debito > 0 ? 'text-blue-600' : 'text-gray-400')">
              {{ formatCurrency(item.debito) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.credito !== 0 ? 'text-red-600' : 'text-gray-400') : (item.credito > 0 ? 'text-green-600' : 'text-gray-400')">
              {{ formatCurrency(item.credito) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.credito2x !== 0 ? 'text-red-600' : 'text-gray-400') : (item.credito2x > 0 ? 'text-green-600' : 'text-gray-400')">
              {{ formatCurrency(item.credito2x) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.credito3x !== 0 ? 'text-red-600' : 'text-gray-400') : (item.credito3x > 0 ? 'text-green-600' : 'text-gray-400')">
              {{ formatCurrency(item.credito3x) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.credito4x5x6x !== 0 ? 'text-red-600' : 'text-gray-400') : (item.credito4x5x6x > 0 ? 'text-green-600' : 'text-gray-400')">
              {{ formatCurrency(item.credito4x5x6x) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold bg-gray-50 rounded-lg" :class="item.adquirente === 'ALUGUEIS' ? (item.valor_bruto_total !== 0 ? 'text-red-600' : 'text-gray-400') : 'text-gray-900'">
              {{ formatCurrency(item.valor_bruto_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.despesa_mdr_total !== 0 ? 'text-red-600' : 'text-gray-400') : (item.despesa_mdr_total > 0 ? 'text-red-600' : 'text-gray-400')">
              {{ formatCurrency(item.despesa_mdr_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold bg-gray-50 rounded-lg" :class="item.adquirente === 'ALUGUEIS' ? (item.valor_liquido_total !== 0 ? 'text-red-600' : 'text-gray-400') : 'text-gray-900'">
              {{ formatCurrency(item.valor_liquido_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.despesa_antecipacao_total !== 0 ? 'text-red-600' : 'text-gray-400') : (item.despesa_antecipacao_total > 0 ? 'text-red-600' : 'text-gray-400')">
              {{ formatCurrency(item.despesa_antecipacao_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold bg-gray-50 rounded-lg" :class="item.adquirente === 'ALUGUEIS' ? (item.valor_pago_total !== 0 ? 'text-red-600' : 'text-gray-400') : 'text-gray-900'">
              {{ formatCurrency(item.valor_pago_total) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-8 py-5 text-sm font-bold">TOTAL ÚNICA</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.debito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito2x) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito3x) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito4x5x6x) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.vendaBruta) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesaMdr) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.vendaLiquida) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesaAntecipacao) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valorPago) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  recebimentosData: {
    type: Array,
    required: true
  },
  totais: {
    type: Object,
    required: true
  }
})

const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const getAdquirenteColor = (index) => {
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-red-500','bg-indigo-500','bg-pink-500','bg-yellow-500']
  return colors[index % colors.length]
}
</script>