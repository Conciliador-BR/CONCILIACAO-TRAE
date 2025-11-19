<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6" v-if="props.recebimentos.length > 0">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">4. Recebimentos Processados</h2>
      <div class="flex space-x-4">
        <span class="text-sm text-gray-600">
          Total: {{ props.recebimentos.length }} recebimentos
        </span>
        <span class="text-sm text-gray-600">
          Valor Bruto: {{ formatCurrency(valorBrutoTotal) }}
        </span>
        <span class="text-sm text-gray-600 font-semibold text-green-600">
          Valor Líquido: {{ formatCurrency(valorLiquidoTotal) }}
        </span>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">ID</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Recebimento</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Modalidade</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Bruto</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido</th>
            <th class="px-2 py-2 text-right text-xs font-medium">% MDR</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor MDR</th>
            <th class="px-2 py-2 text-center text-xs font-medium">Nº Parcelas</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Bandeira</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Pago</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Adquirente</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Empresa</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Matriz</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(r, index) in paginatedRecebimentos" 
            :key="index"
            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="px-2 py-2 text-xs">{{ r.id || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(r.data_venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(r.data_recebimento) }}</td>
            <td class="px-2 py-2 text-xs">{{ r.modalidade }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ r.nsu }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium">{{ formatCurrency(r.valor_bruto) }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium text-green-600">{{ formatCurrency(r.valor_liquido) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatPercent(r.taxa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(r.despesa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-center">{{ r.numero_parcelas || 1 }}</td>
            <td class="px-2 py-2 text-xs">{{ r.bandeira }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(r.valor_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(r.despesa_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(r.valor_liquido_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs">{{ r.adquirente }}</td>
            <td class="px-2 py-2 text-xs">{{ r.empresa }}</td>
            <td class="px-2 py-2 text-xs">{{ r.matriz }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <RecebimentosPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :items-per-page="itemsPerPage"
      @update:currentPage="setPage"
      @update:itemsPerPage="setItemsPerPage"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import RecebimentosPagination from './RecebimentosPagination.vue'

const props = defineProps({
  recebimentos: { type: Array, default: () => [] }
})

const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalItems = computed(() => props.recebimentos.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedRecebimentos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.recebimentos.slice(start, end)
})

const setPage = (page) => { if (page >= 1 && page <= totalPages.value) currentPage.value = page }
const setItemsPerPage = (newSize) => { itemsPerPage.value = newSize; currentPage.value = 1 }

const valorBrutoTotal = computed(() => props.recebimentos.reduce((t, r) => t + (r.valor_bruto || 0), 0))
const valorLiquidoTotal = computed(() => props.recebimentos.reduce((t, r) => t + (r.valor_liquido || 0), 0))

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const formatPercent = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  const abs = Math.abs(n)

  // Normaliza:
  // - Se vier como 69 (pontos percentuais), divide por 100 -> 0.69
  // - Se vier muito pequeno (ex.: 0.0069), multiplica por 100 -> 0.69
  // - Se vier como 0.69, mantém -> 0.69
  let pct
  if (abs > 1) pct = n / 100
  else if (abs <= 0.05) pct = n * 100
  else pct = n

  return `${pct.toFixed(2)}%`
}
const formatDate = (input) => {
  if (input === null || input === undefined || input === '') return '-'
  const toPtBr = (y, m, d) => `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${String(y).padStart(4,'0')}`
  const excelSerialToPtBr = (n) => {
    const base = new Date(Date.UTC(1899,11,30))
    const dt = new Date(base.getTime() + Math.round(Number(n)) * 86400000)
    return toPtBr(dt.getUTCFullYear(), dt.getUTCMonth()+1, dt.getUTCDate())
  }
  if (typeof input === 'number' && Number.isFinite(input)) return excelSerialToPtBr(input)
  const str = String(input).trim()
  const first = str.split(/[T\s]+/)[0]
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(first)) return first
  if (/^\d{4}-\d{2}-\d{2}$/.test(first)) {
    const [y,m,d] = first.split('-').map(Number)
    return toPtBr(y,m,d)
  }
  if (/^\d+$/.test(str) && str.length >= 5) return excelSerialToPtBr(parseInt(str,10))
  const dt = new Date(str)
  if (!isNaN(dt.getTime())) return toPtBr(dt.getFullYear(), dt.getMonth()+1, dt.getDate())
  return '-'
}
</script>