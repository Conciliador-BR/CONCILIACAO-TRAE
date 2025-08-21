<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6" v-if="vendas.length > 0">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">4. Vendas Processadas</h2>
      <div class="flex space-x-4">
        <span class="text-sm text-gray-600">
          Total: {{ vendas.length }} vendas
        </span>
        <span class="text-sm text-gray-600">
          Valor Bruto: {{ formatCurrency(valorBrutoTotal) }}
        </span>
        <span class="text-sm text-gray-600 font-semibold text-green-600">
          Valor Líquido: {{ formatCurrency(valorLiquidoTotal) }}
        </span>
      </div>
    </div>
    
    <!-- Tabela de Vendas -->
    <div class="overflow-x-auto">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">ID</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Modalidade</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Bruto</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Taxa MDR</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa MDR</th>
            <th class="px-2 py-2 text-center text-xs font-medium">Nº Parcelas</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Bandeira</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido Antecipação</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Empresa</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Matriz</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(venda, index) in vendas.slice(0, 10)" :key="index" class="border-t hover:bg-gray-50">
            <td class="px-2 py-2 text-xs">{{ venda.id || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(venda.data_venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.modalidade }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ venda.nsu }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium">{{ formatCurrency(venda.valor_bruto) }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium text-green-600">{{ formatCurrency(venda.valor_liquido) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.taxa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.despesa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-center">{{ venda.numero_parcelas || 1 }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.bandeira }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.despesa_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_liquido_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.empresa }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.matriz }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="vendas.length > 10" class="text-center py-4 text-gray-500">
        ... e mais {{ vendas.length - 10 }} vendas
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  vendas: {
    type: Array,
    default: () => []
  }
})

const valorBrutoTotal = computed(() => {
  return props.vendas.reduce((total, venda) => total + (venda.valor_bruto || 0), 0)
})

const valorLiquidoTotal = computed(() => {
  return props.vendas.reduce((total, venda) => total + (venda.valor_liquido || 0), 0)
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}
</script>