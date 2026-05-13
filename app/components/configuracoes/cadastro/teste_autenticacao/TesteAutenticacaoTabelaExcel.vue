<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Tabela de Vendas</h3>
          <p class="mt-1 text-xs text-gray-600">Visualizacao tipo Excel com os principais campos da conciliacao retornados pela API.</p>
        </div>
        <div class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
          {{ rows.length }} registro(s)
        </div>
      </div>
    </div>

    <div v-if="rows.length" class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-100 sticky top-0 z-10">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="odd:bg-white even:bg-slate-50 hover:bg-blue-50/50"
          >
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-gray-800">{{ row.dataVenda }}</td>
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-gray-800">{{ row.dataPagamento }}</td>
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3 font-mono text-gray-800">{{ row.nsu }}</td>
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-gray-800">{{ row.valorBruto }}</td>
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-gray-800">{{ row.valorLiquido }}</td>
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-gray-800">{{ row.valorMdr }}</td>
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3">
              <span class="inline-flex rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                {{ row.status }}
              </span>
            </td>
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-gray-800">{{ row.modalidade }}</td>
            <td class="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-gray-800">{{ row.bandeira }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="px-6 py-10 text-center text-sm text-gray-500">
      Execute a consulta da REDE para preencher a tabela tipo Excel com as vendas retornadas pela API.
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: {
    type: Array,
    default: () => []
  }
})

const columns = [
  { key: 'dataVenda', label: 'Data Venda' },
  { key: 'dataPagamento', label: 'Data Pagamento' },
  { key: 'nsu', label: 'NSU' },
  { key: 'valorBruto', label: 'Valor Bruto' },
  { key: 'valorLiquido', label: 'Valor Liquido' },
  { key: 'valorMdr', label: 'Valor MDR' },
  { key: 'status', label: 'Status' },
  { key: 'modalidade', label: 'Modalidade' },
  { key: 'bandeira', label: 'Bandeira' }
]
</script>
