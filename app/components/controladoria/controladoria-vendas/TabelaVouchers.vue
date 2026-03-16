<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 mt-6 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Vouchers</h2>
        <p class="text-sm text-gray-600 mt-1">
          Adquirente de Cartões 
          <span v-if="!empresaSelecionada" class="text-amber-600 font-medium ml-2 text-xs">
            (Selecione uma empresa)
          </span>
        </p>
      </div>
      <button 
        @click="carregarTaxas" 
        class="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
        :disabled="!empresaSelecionada || loading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Atualizar Taxas
      </button>
    </div>

    <!-- Mensagens de Feedback -->
    <div v-if="error" class="bg-red-50 text-red-700 px-6 py-3 text-sm border-b border-red-100">
      {{ error }}
    </div>
    <div v-if="successMessage" class="bg-green-50 text-green-700 px-6 py-3 text-sm border-b border-green-100 flex justify-between items-center">
      <span>{{ successMessage }}</span>
      <button @click="successMessage = null" class="text-green-800 hover:text-green-900">&times;</button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th class="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Adquirente</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Débito</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito 2x</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito 3x</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito 4x-6x</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Voucher</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas MDR</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Bruto</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Líquido</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Ação</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-for="(voucher, index) in linhasExibidas" :key="voucher.nome" 
              class="hover:bg-blue-50 transition-colors duration-200 group">
            <td class="px-8 py-5 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" :class="getAdquirenteColor(index)"></div>
                <span class="text-sm font-medium text-gray-900 group-hover:text-blue-700">{{ voucher.nome }}</span>
              </div>
            </td>
            
            <!-- Débito -->
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <!-- Crédito -->
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <!-- Crédito 2x -->
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <!-- Crédito 3x -->
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <!-- Crédito 4x-6x -->
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <!-- Voucher -->
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-gray-500">R$</span>
                <input
                  :value="voucher._voucher_input"
                  @input="onInputVoucher(voucher, $event)"
                  @focus="onFocusVoucher(voucher, $event)"
                  @blur="onBlurVoucher(voucher, $event)"
                  :disabled="!empresaSelecionada || voucher.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm text-purple-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  placeholder="0,00"
                />
              </div>
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs" :class="Number(voucher.despesa_mdr || 0) > 0 ? 'text-red-600' : 'text-gray-500'">R$</span>
                <input
                  :value="voucher._mdr_input"
                  @input="onInputMdr(voucher, $event)"
                  @focus="onFocusMdr(voucher, $event)"
                  @blur="onBlurMdr(voucher)"
                  :disabled="!empresaSelecionada || voucher.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  :class="Number(voucher.despesa_mdr || 0) > 0 ? 'text-red-600 font-medium' : 'text-gray-600'"
                  placeholder="0,00"
                />
              </div>
            </td>
            
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50/50 rounded-lg">
               {{ formatCurrency(voucher.valor_bruto) }}
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50/50 rounded-lg">
              {{ formatCurrency(voucher.valor_liquido) }}
            </td>
            
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="enviarVenda(voucher)"
                :disabled="!empresaSelecionada || (Number(voucher._delta_bruto || 0) === 0 && Number(voucher._delta_mdr || 0) === 0) || voucher.status === 'sending'"
                class="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                :class="{
                  'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600': voucher.status !== 'success' && voucher.status !== 'error',
                  'bg-green-600 hover:bg-green-500': voucher.status === 'success',
                  'bg-red-600 hover:bg-red-500': voucher.status === 'error'
                }"
              >
                <svg v-if="voucher.status === 'sending'" class="animate-spin -ml-0.5 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span v-if="voucher.status === 'pending' || voucher.status === 'sending'">Enviar</span>
                <span v-else-if="voucher.status === 'success'">OK</span>
                <span v-else>Erro</span>
              </button>
            </td>
          </tr>
        </tbody>
        <!-- Linha de Totais -->
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-8 py-5 text-sm font-bold">TOTAL Vouchers</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.voucher) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesa_mdr) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_bruto) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_liquido) }}</td>
            <td class="px-8 py-5"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useVouchersManual } from '~/composables/PageControladoria/controladoria-vendas/tabela_voucher_manual'
import { useVendas } from '~/composables/useVendas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

const round2 = (value) => {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const formatBRLNumber = (value) => {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(round2(value))
}

const parseBRL = (value) => {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const raw = String(value).trim()
  if (!raw) return 0
  const normalized = raw
    .replace(/\s/g, '')
    .replace(/[^0-9,.-]/g, '')

  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length

  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)

  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return 0
  return round2(parsed)
}

const { filtroAtivo } = useVendas()
const { filtrosGlobais } = useGlobalFilters()
const { vouchersData, loading, error, successMessage, fetchTaxas, calcularValores, enviarVenda } = useVouchersManual(filtroAtivo)

const empresaSelecionada = computed(() => Boolean(filtroAtivo.value?.empresa) || Boolean(filtrosGlobais.empresaSelecionada))

const linhasExibidas = computed(() => {
  if (!empresaSelecionada.value) return []
  return vouchersData.value.filter(v => v?._table_exists === true && Boolean(v?._table_name))
})

const totais = computed(() => {
  return linhasExibidas.value.reduce((acc, v) => {
    acc.debito += Number(v.debito || 0)
    acc.credito += Number(v.credito || 0)
    acc.credito2x += Number(v.credito2x || 0)
    acc.credito3x += Number(v.credito3x || 0)
    acc.credito4x6x += Number(v.credito4x6x || 0)
    acc.voucher += Number(v.voucher || 0)
    acc.despesa_mdr += Number(v.despesa_mdr || 0)
    acc.valor_bruto += Number(v.valor_bruto || 0)
    acc.valor_liquido += Number(v.valor_liquido || 0)
    return acc
  }, {
    debito: 0, credito: 0, credito2x: 0, credito3x: 0, credito4x6x: 0,
    voucher: 0, despesa_mdr: 0, valor_bruto: 0, valor_liquido: 0
  })
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const getAdquirenteColor = (index) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500'
  ]
  return colors[index % colors.length]
}

const carregarTaxas = () => {
  if (empresaSelecionada.value) {
    fetchTaxas()
  }
}

const onInputVoucher = (voucher, event) => {
  const raw = String(event?.target?.value ?? '')
  voucher._voucher_input = raw
  const parsed = parseBRL(raw)
  if (parsed < 0) {
    const baseDb = Number(voucher._bruto_db || 0)
    const desired = round2(baseDb + parsed)
    voucher.voucher = desired
  } else {
    voucher.voucher = parsed
  }
  onEditar(voucher)
}

const onFocusVoucher = (voucher, event) => {
  voucher._editing_voucher = true
  event?.target?.select?.()
}

const onBlurVoucher = (voucher) => {
  voucher._editing_voucher = false
  voucher._voucher_input = formatBRLNumber(voucher.voucher)
}

const onInputMdr = (voucher, event) => {
  const raw = String(event?.target?.value ?? '')
  voucher._mdr_input = raw
  voucher._mdr_manual = true
  voucher.despesa_mdr = parseBRL(raw)
  calcularValores(voucher)
}

const onFocusMdr = (voucher, event) => {
  voucher._editing_mdr = true
  voucher._mdr_manual = true
  event?.target?.select?.()
}

const onBlurMdr = (voucher) => {
  voucher._editing_mdr = false
  voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
  calcularValores(voucher)
}

const onEditar = (voucher) => {
  voucher._has_db_values = false
  calcularValores(voucher)
}

watch(
  () => [
    filtrosGlobais.empresaSelecionada,
    filtrosGlobais.dataInicial,
    filtrosGlobais.dataFinal,
    filtroAtivo.value?.empresa,
    filtroAtivo.value?.dataInicial,
    filtroAtivo.value?.dataFinal
  ],
  () => {
    if (empresaSelecionada.value) {
      fetchTaxas()
      return
    }

    vouchersData.value.forEach(v => {
      v.taxa = 0
      calcularValores(v)
    })
  },
  { immediate: true }
)

</script>
