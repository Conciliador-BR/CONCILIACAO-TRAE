<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <h2 class="text-xl font-semibold text-gray-900">{{ adquirente }}</h2>
      <p class="text-sm text-gray-600 mt-1">Previsão consolidada por bandeira e modalidade</p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th class="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Adquirente</th>
            <th
              v-for="mes in meses"
              :key="mes.key"
              class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
            >
              {{ mes.label }}
            </th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Bruto</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Líquido</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr
            v-for="(item, index) in previsoesData"
            :key="`${adquirente}-${item.nome}-${index}`"
            class="hover:bg-blue-50 transition-colors duration-200"
          >
            <td class="px-8 py-5">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" :class="getRowColor(index)"></div>
                <span class="text-sm font-medium text-gray-900">{{ item.nome }}</span>
              </div>
            </td>
            <td
              v-for="mes in meses"
              :key="mes.key"
              class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium"
              :class="Number(item?.[mes.key] || 0) > 0 ? 'text-blue-700' : 'text-gray-400'"
            >
              {{ formatCurrency(item?.[mes.key] || 0) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
              {{ formatCurrency(item.valorBruto) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
              {{ formatCurrency(item.valorLiquido) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-8 py-5 text-sm font-bold">TOTAL {{ adquirente }}</td>
            <td
              v-for="mes in meses"
              :key="mes.key"
              class="px-8 py-5 text-right text-sm font-bold"
            >
              {{ formatCurrency(totais?.[mes.key] || 0) }}
            </td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valorBruto) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valorLiquido) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  previsoesData: {
    type: Array,
    required: true
  },
  totais: {
    type: Object,
    required: true
  },
  adquirente: {
    type: String,
    required: true
  },
  meses: {
    type: Array,
    default: () => []
  }
})

const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const getRowColor = (index) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-yellow-500'
  ]
  return colors[index % colors.length]
}
</script>
