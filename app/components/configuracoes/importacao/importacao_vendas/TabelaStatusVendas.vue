<template>
  <div v-if="vendas.length > 0" class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">5. Cruzamento de Vendas com Supabase</h2>
      <button
        class="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="cruzando"
        @click="$emit('executar-cruzamento')"
      >
        {{ cruzando ? 'Cruzando...' : 'Executar Cruzamento' }}
      </button>
    </div>

    <div v-if="cruzamentoExecutado" class="flex flex-wrap gap-4 mb-4 text-sm">
      <span class="text-gray-700">Total: {{ vendasStatus.length }}</span>
      <span class="text-green-700 font-medium">Enviadas: {{ totalEnviadas }}</span>
      <span class="text-yellow-700 font-medium">Pendentes: {{ totalPendentes }}</span>
      <span class="text-red-700 font-medium">Não enviadas: {{ totalNaoEnviadas }}</span>
    </div>

    <div v-if="cruzamentoExecutado" class="overflow-x-auto border border-gray-200 rounded-lg">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Modalidade</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Bruto</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Adquirente</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Empresa</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(venda, index) in vendasStatus"
            :key="index"
            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="px-2 py-2 text-xs">{{ formatDate(venda.data_venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ String(venda.modalidade || '').toUpperCase() }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ venda.nsu || '-' }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_bruto) }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.adquirente || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.empresa || '-' }}</td>
            <td class="px-2 py-2 text-xs">
              <span :class="statusClass(venda.status_envio)" class="px-2 py-1 rounded-full font-medium">
                {{ statusLabel(venda.status_envio) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  vendas: { type: Array, default: () => [] },
  vendasStatus: { type: Array, default: () => [] },
  cruzamentoExecutado: { type: Boolean, default: false },
  cruzando: { type: Boolean, default: false }
})

defineEmits(['executar-cruzamento'])

const totalEnviadas = computed(() => props.vendasStatus.filter(v => v.status_envio === 'enviada').length)
const totalPendentes = computed(() => props.vendasStatus.filter(v => v.status_envio === 'pendente_envio').length)
const totalNaoEnviadas = computed(() => props.vendasStatus.filter(v => v.status_envio === 'nao_enviada').length)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

const formatDate = (value) => {
  if (!value) return '-'
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [y, m, d] = String(value).split('-')
    return `${d}/${m}/${y}`
  }
  return String(value)
}

const statusLabel = (status) => {
  if (status === 'enviada') return 'Enviada'
  if (status === 'nao_enviada') return 'Não Enviada'
  return 'Pendente de Envio'
}

const statusClass = (status) => {
  if (status === 'enviada') return 'bg-green-100 text-green-700'
  if (status === 'nao_enviada') return 'bg-red-100 text-red-700'
  return 'bg-yellow-100 text-yellow-700'
}
</script>
