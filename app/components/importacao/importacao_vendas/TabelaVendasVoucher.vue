<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <h2 class="text-2xl font-bold text-gray-900">4. Vendas Processadas (Vouchers)</h2>
      <p class="text-sm text-gray-600 mt-1">Pré-visualização das vendas de vouchers antes do envio</p>
    </div>

    <div class="p-6 overflow-x-auto">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-6">
          <div>
            <p class="text-xs text-gray-500">Vendas Brutas</p>
            <p class="text-sm font-semibold text-gray-900">{{ formatarMoeda(totalBruto) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Vendas Líquidas</p>
            <p class="text-sm font-semibold text-green-700">{{ formatarMoeda(totalLiquido) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Valor de Despesa</p>
            <p class="text-sm font-semibold text-red-600">{{ formatarMoeda(totalDespesa) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Transações</p>
            <p class="text-sm font-semibold text-gray-900">{{ vendasFormatadas.length }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Mostrar</label>
          <select v-model.number="pageSize" class="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white/90 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option v-for="opt in [10,20,30,40,50]" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <span class="text-sm text-gray-600">por página</span>
        </div>
      </div>

      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Adquirente</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NSU</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Venda</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Previsão Pgto</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Modalidade</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor Bruto</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Despesa</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor Líquido</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Empresa</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">EC</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-for="(v, idx) in rowsPagina" :key="idx" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-900">{{ v.adquirente }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ v.nsu }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ formatarDataExibicao(v.data_venda) }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ formatarDataExibicao(v.previsao_pgto) }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ v.modalidade }}</td>
            <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ formatarMoeda(v.valor_bruto) }}</td>
            <td class="px-4 py-3 text-sm text-red-600 text-right">{{ formatarMoeda(v.despesa) }}</td>
            <td class="px-4 py-3 text-sm text-green-700 text-right">{{ formatarMoeda(v.valor_liquido) }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ v.empresa }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ v.ec }}</td>
          </tr>
          <tr v-if="vendasFormatadas.length === 0">
            <td colspan="10" class="px-4 py-6 text-center text-sm text-gray-500">Nenhuma venda de voucher processada</td>
          </tr>
        </tbody>
      </table>

      <div class="flex items-center justify-between mt-4">
        <div class="text-sm text-gray-600">
          Mostrando {{ inicioIndice + 1 }}–{{ fimIndice }} de {{ vendasFormatadas.length }}
        </div>
        <div class="flex items-center gap-2">
          <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-2 border rounded-md text-sm"
                  :class="currentPage === 1 ? 'text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed' : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'">
            « Anterior
          </button>
          <span class="text-sm text-gray-700">Página {{ currentPage }} de {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages || totalPages === 0" class="px-3 py-2 border rounded-md text-sm"
                  :class="(currentPage === totalPages || totalPages === 0) ? 'text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed' : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'">
            Próxima »
          </button>
        </div>
      </div>
    </div>

    <div class="px-8 py-4 bg-gray-50 border-t border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-xs text-gray-500">Transações</p>
          <p class="text-sm font-semibold text-gray-900">{{ vendasFormatadas.length }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Vendas Brutas</p>
          <p class="text-sm font-semibold text-gray-900">{{ formatarMoeda(totalBruto) }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Valor de Despesa</p>
          <p class="text-sm font-semibold text-red-600">{{ formatarMoeda(totalDespesa) }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Vendas Líquidas</p>
          <p class="text-sm font-semibold text-green-700">{{ formatarMoeda(totalLiquido) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  vendas: { type: Array, default: () => [] }
})

const isSentinela = (iso) => iso === '0001-01-01'

const vendasFormatadas = computed(() => props.vendas.map(v => ({
  adquirente: (v.adquirente || '').toString().toUpperCase(),
  nsu: v.nsu || '',
  data_venda: v.data_venda_text || v.data_venda || null,
  previsao_pgto: v.previsao_pgto_text || v.previsao_pgto || null,
  modalidade: v.modalidade || '',
  valor_bruto: Number(v.valor_bruto || 0),
  despesa: Number(v.despesa || 0),
  valor_liquido: Number(v.valor_liquido || 0),
  empresa: v.empresa || '',
  ec: v.ec || ''
})))

const totalBruto = computed(() => vendasFormatadas.value.reduce((sum, v) => sum + (v.valor_bruto || 0), 0))
const totalLiquido = computed(() => vendasFormatadas.value.reduce((sum, v) => sum + (v.valor_liquido || 0), 0))
const totalDespesa = computed(() => vendasFormatadas.value.reduce((sum, v) => sum + (v.despesa || 0), 0))

// Paginação
const pageSize = ref(10)
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(vendasFormatadas.value.length / pageSize.value)))
const inicioIndice = computed(() => (currentPage.value - 1) * pageSize.value)
const fimIndice = computed(() => Math.min(vendasFormatadas.value.length, inicioIndice.value + pageSize.value))
const rowsPagina = computed(() => vendasFormatadas.value.slice(inicioIndice.value, fimIndice.value))

watch(pageSize, () => { currentPage.value = 1 })
watch(vendasFormatadas, () => { currentPage.value = 1 })

const prevPage = () => { if (currentPage.value > 1) currentPage.value -= 1 }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value += 1 }

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)

const formatarDataExibicao = (valor) => {
  if (!valor) return '-'
  if (valor === '0001-01-01') return '00/00/0000'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return valor
  try {
    const [y, m, d] = String(valor).split('-')
    if (y && m && d) return `${d}/${m}/${y}`
    return '-'
  } catch { return '-'}
}
</script>