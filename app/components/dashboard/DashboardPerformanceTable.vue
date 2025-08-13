<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-200">
    <div class="p-6 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800">Performance por Empresa</h3>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receita</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxa Média</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crescimento</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="empresa in empresas" :key="empresa.nome" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ empresa.nome }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">R$ {{ formatCurrency(empresa.receita) }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ empresa.taxaMedia }}%</td>
            <td class="px-6 py-4 text-sm">
              <span :class="empresa.crescimento >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ empresa.crescimento >= 0 ? '+' : '' }}{{ empresa.crescimento }}%
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getStatusClass(empresa.status)">
                {{ empresa.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  empresas: {
    type: Array,
    required: true
  }
})

const formatCurrency = (value) => {
  if (!value) return '0,00'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

const getStatusClass = (status) => {
  switch(status) {
    case 'Excelente': return 'bg-green-100 text-green-800'
    case 'Bom': return 'bg-blue-100 text-blue-800'
    case 'Atenção': return 'bg-yellow-100 text-yellow-800'
    case 'Crítico': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>