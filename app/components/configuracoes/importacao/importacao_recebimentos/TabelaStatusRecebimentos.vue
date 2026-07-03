<template>
  <div v-if="recebimentos.length > 0" class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">5. Cruzamento de Recebimentos com Supabase</h2>
      <button
        class="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="cruzando"
        @click="$emit('executar-cruzamento')"
      >
        {{ cruzando ? 'Cruzando...' : 'Executar Cruzamento' }}
      </button>
    </div>

    <div v-if="cruzamentoExecutado" class="flex flex-wrap gap-4 mb-4 text-sm">
      <span class="text-gray-700">Total: {{ recebimentosStatus.length }}</span>
      <span class="text-green-700 font-medium">Enviados: {{ totalEnviados }}</span>
      <span class="text-yellow-700 font-medium">Pendentes: {{ totalPendentes }}</span>
      <span class="text-red-700 font-medium">Não enviados: {{ totalNaoEnviados }}</span>
    </div>

    <div v-if="cruzamentoExecutado" class="overflow-x-auto border border-gray-200 rounded-lg">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Recebimento</th>
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
            v-for="(r, index) in recebimentosStatus"
            :key="index"
            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="px-2 py-2 text-xs">{{ formatDate(r.data_venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(r.data_recebimento || r.data_pgto) }}</td>
            <td class="px-2 py-2 text-xs">{{ String(r.modalidade || '').toUpperCase() }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ r.nsu || '-' }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(r.valor_bruto) }}</td>
            <td class="px-2 py-2 text-xs">{{ r.adquirente || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ r.empresa || '-' }}</td>
            <td class="px-2 py-2 text-xs">
              <span :class="statusClass(r.status_envio)" class="px-2 py-1 rounded-full font-medium">
                {{ statusLabel(r.status_envio) }}
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

defineEmits(['executar-cruzamento'])

const props = defineProps({
  recebimentos: { type: Array, default: () => [] },
  recebimentosStatus: { type: Array, default: () => [] },
  cruzamentoExecutado: { type: Boolean, default: false },
  cruzando: { type: Boolean, default: false }
})

const totalEnviados = computed(() => props.recebimentosStatus.filter(v => v.status_envio === 'enviada').length)
const totalPendentes = computed(() => props.recebimentosStatus.filter(v => v.status_envio === 'pendente_envio').length)
const totalNaoEnviados = computed(() => props.recebimentosStatus.filter(v => v.status_envio === 'nao_enviada').length)

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const formatDate = (value) => {
  if (!value) return '-'
  const first = String(value).trim().split(/[T\s]+/)[0]
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(first)) {
    const [d, m, y] = first.split('/')
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(first)) {
    const [d, m, y] = first.split('-')
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [y, m, d] = String(value).split('-')
    return `${d}/${m}/${y}`
  }
  return String(value)
}
const statusLabel = (status) => status === 'enviada' ? 'Enviado' : status === 'nao_enviada' ? 'Não Enviado' : 'Pendente'
const statusClass = (status) => status === 'enviada' ? 'bg-green-100 text-green-700' : status === 'nao_enviada' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
</script>
