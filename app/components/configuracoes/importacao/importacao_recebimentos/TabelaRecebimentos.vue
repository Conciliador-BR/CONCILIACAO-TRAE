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
        <span class="text-sm text-gray-600 text-red-600">
          Valor de Despesa: {{ formatCurrency(valorDespesaMdrTotal) }}
        </span>
        <button
          type="button"
          class="text-sm text-red-600 hover:underline"
          :class="filtroAntecipacaoAtivo ? 'font-semibold underline' : 'text-gray-600'"
          @click="toggleFiltroAntecipacao"
        >
          Valor de Despesa c/ Antecipação: {{ formatCurrency(valorDespesaAntecipacaoTotal) }}
          <span v-if="filtroAntecipacaoAtivo">(filtrado)</span>
        </button>
        <button
          type="button"
          class="text-sm text-red-600 hover:underline"
          :class="filtroAluguelAtivo ? 'font-semibold underline' : 'text-gray-600'"
          @click="toggleFiltroAluguel"
        >
          Despesa com Aluguel: {{ formatCurrency(valorDespesaAluguelTotal) }}
          <span v-if="filtroAluguelAtivo">(filtrado)</span>
        </button>
        <span class="text-sm text-gray-600 font-semibold text-green-600">
          Valor Líquido Sem Antecipação: {{ formatCurrency(valorLiquidoTotal) }}
        </span>
        <span class="text-sm text-gray-600 font-semibold text-green-600">
          Valor Líquido c/ Antecipação: {{ formatCurrency(valorLiquidoComAntecipacaoTotal) }}
        </span>
        <span v-if="adquirenteExibir" class="text-sm text-gray-600">
          Adquirente: {{ adquirenteExibir }}
        </span>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">ID</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Sale Summary</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Ordem Credito</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Recebimento</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Modalidade</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Lote Pgto</th>
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
            <th class="px-2 py-2 text-left text-xs font-medium">JSON</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(r, index) in paginatedRecebimentos" 
            :key="index"
            :class="[index % 2 === 0 ? 'bg-white' : 'bg-gray-50', isLinhaAluguel(r) ? 'text-red-600 font-medium' : '']"
          >
            <td class="px-2 py-2 text-xs">{{ r.id || '-' }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ r.sale_summary_number || '-' }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ r.numero_ordem_credito || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(r.data_venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(r.data_recebimento) }}</td>
            <td class="px-2 py-2 text-xs">{{ r.modalidade }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ r.nsu }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ r.numero_lote_pagamento || '-' }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium">{{ formatCurrency(r.valor_bruto) }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium" :class="isLinhaAluguel(r) ? 'text-red-600' : 'text-green-600'">{{ formatCurrency(r.valor_liquido) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatPercent(r.taxa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium" :class="isLinhaAluguel(r) ? 'text-red-600' : ''">{{ formatCurrency(r.despesa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-center">{{ r.numero_parcelas ?? 0 }}</td>
            <td class="px-2 py-2 text-xs">{{ r.bandeira }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(r.valor_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(r.despesa_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(r.valor_liquido_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs">{{ r.adquirente }}</td>
            <td class="px-2 py-2 text-xs">{{ r.empresa }}</td>
            <td class="px-2 py-2 text-xs">{{ r.matriz }}</td>
            <td class="px-2 py-2 text-xs align-top">
              <button
                type="button"
                class="text-blue-600 hover:text-blue-800 hover:underline"
                @click="abrirJson(r)"
              >
                Ver JSON
              </button>
            </td>
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

    <div
      v-if="jsonAberto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="fecharJson"
    >
      <div class="w-full max-w-5xl rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 class="text-lg font-semibold text-gray-900">JSON do Recebimento</h3>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            @click="fecharJson"
          >
            Fechar
          </button>
        </div>

        <div class="max-h-[75vh] overflow-auto bg-gray-950 p-4">
          <pre class="text-xs leading-5 text-green-200 whitespace-pre-wrap break-words">{{ jsonSelecionado }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import RecebimentosPagination from './RecebimentosPagination.vue'

const props = defineProps({
  recebimentos: { type: Array, default: () => [] },
  adquirente: { type: String, default: '' }
})

const currentPage = ref(1)
const itemsPerPage = ref(10)
const filtroAntecipacaoAtivo = ref(false)
const filtroAluguelAtivo = ref(false)
const jsonAberto = ref(false)
const jsonSelecionado = ref('{}')

const recebimentosFiltrados = computed(() => {
  let base = props.recebimentos
  if (filtroAntecipacaoAtivo.value) {
    base = base.filter((r) => Number(r?.despesa_antecipacao || 0) > 0)
  }
  if (filtroAluguelAtivo.value) {
    base = base.filter((r) => isLinhaAluguel(r))
  }
  return base
})

const totalItems = computed(() => recebimentosFiltrados.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedRecebimentos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return recebimentosFiltrados.value.slice(start, end)
})

const setPage = (page) => { if (page >= 1 && page <= totalPages.value) currentPage.value = page }
const setItemsPerPage = (newSize) => { itemsPerPage.value = newSize; currentPage.value = 1 }
const toggleFiltroAntecipacao = () => {
  filtroAntecipacaoAtivo.value = !filtroAntecipacaoAtivo.value
  currentPage.value = 1
}
const toggleFiltroAluguel = () => {
  filtroAluguelAtivo.value = !filtroAluguelAtivo.value
  currentPage.value = 1
}

const valorBrutoTotal = computed(() => props.recebimentos.reduce((t, r) => t + (r.valor_bruto || 0), 0))
const valorLiquidoTotal = computed(() => props.recebimentos.reduce((t, r) => t + (r.valor_liquido || 0), 0))

const valorDespesaMdrTotal = computed(() => props.recebimentos.reduce((t, r) => t + Number(r.despesa_mdr || 0), 0))
const valorDespesaAntecipacaoTotal = computed(() => props.recebimentos.reduce((t, r) => t + Number(r.despesa_antecipacao || 0), 0))
const valorLiquidoComAntecipacaoTotal = computed(() => {
  return valorBrutoTotal.value - valorDespesaMdrTotal.value - valorDespesaAntecipacaoTotal.value
})
const parseNumber = (value) => {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

const isLinhaAluguel = (r) => {
  const texto = [
    r?.modalidade,
    r?.tipo_lancamento,
    r?.lancamento,
    r?.descricao,
    r?.observacoes,
    r?.motivo
  ]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
  return texto.includes('ALUGUEL')
}

const valorDespesaAluguelTotal = computed(() => {
  const totalLiquido = props.recebimentos.reduce((total, r) => {
    if (!isLinhaAluguel(r)) return total
    const mdr = parseNumber(r?.despesa_mdr)
    const antecipacao = parseNumber(r?.despesa_antecipacao)
    const fallback = parseNumber(r?.valor_bruto) - parseNumber(r?.valor_liquido)
    const valorAluguel = mdr || antecipacao || fallback
    return total + valorAluguel
  }, 0)

  return Math.abs(totalLiquido)
})

const adquirenteExibir = computed(() => String(props.adquirente || '').trim().toUpperCase())

const formatJson = (registro) => {
  try {
    return JSON.stringify(registro?.json_original ?? registro, null, 2)
  } catch {
    return '{}'
  }
}

const abrirJson = (registro) => {
  jsonSelecionado.value = formatJson(registro)
  jsonAberto.value = true
}

const fecharJson = () => {
  jsonAberto.value = false
  jsonSelecionado.value = '{}'
}

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
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(first)) {
    const [d, m, y] = first.split('/').map(Number)
    return toPtBr(y, m, d)
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(first)) {
    const [d, m, y] = first.split('-').map(Number)
    return toPtBr(y, m, d)
  }
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
