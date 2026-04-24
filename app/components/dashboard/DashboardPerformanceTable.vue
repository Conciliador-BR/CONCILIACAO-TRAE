<template>
  <div class="bg-white rounded-xl shadow-lg border border-[#DCE7F3]">
    <div class="p-6 border-b border-[#E4ECF5]">
      <h3 class="text-lg font-semibold text-[#102A43]">Performance por Empresa</h3>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-[#F7FAFC]">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-[#486581] uppercase">Empresa</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-[#486581] uppercase">Receita</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-[#486581] uppercase">Taxa Média</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-[#486581] uppercase">Crescimento</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-[#486581] uppercase">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#E4ECF5]">
          <tr v-for="empresa in empresas" :key="empresa.nome" class="hover:bg-[#F8FAFC]">
            <td class="px-6 py-4 text-sm font-medium text-[#102A43]">{{ empresa.nome }}</td>
            <td class="px-6 py-4 text-sm text-[#486581]">R$ {{ formatCurrency(empresa.receita) }}</td>
            <td class="px-6 py-4 text-sm text-[#486581]">{{ empresa.taxaMedia }}%</td>
            <td class="px-6 py-4 text-sm">
              <span :class="empresa.crescimento >= 0 ? 'text-[#1E7E34]' : 'text-[#C92A2A]'">
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
    case 'Excelente': return 'bg-[#E6F4EA] text-[#1E7E34] border border-[#B7E4C7]'
    case 'Bom': return 'bg-[#EAF3FF] text-[#1D4ED8] border border-[#BFDBFE]'
    case 'Atenção': return 'bg-[#FFF4E5] text-[#B56A00] border border-[#FFD8A8]'
    case 'Crítico': return 'bg-[#FDECEC] text-[#C92A2A] border border-[#F5C2C7]'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
