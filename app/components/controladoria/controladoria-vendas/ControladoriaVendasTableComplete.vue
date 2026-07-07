<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden" :class="{ 'print-keep': adquirente === 'STONE', 'print-break-after': adquirente === 'STONE' }">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <h2 class="text-xl font-semibold text-gray-900">{{ adquirente }}</h2>
      <p class="text-sm text-gray-600 mt-1">Adquirente de Cartões</p>
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
            <th v-if="mostrarCredito4x6" class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito 4x-6x</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Voucher</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas MDR</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas com Antecipação</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Bruto</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Líquido</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <template v-for="(item, index) in vendasData" :key="index">
            <tr class="hover:bg-blue-50 transition-colors duration-200 group">
            <td class="px-8 py-5">
              <div class="flex items-center">
                <button
                  @click="toggleEditor(item, index)"
                  type="button"
                  class="flex min-w-0 items-center rounded-lg transition-colors"
                  :title="temObservacao(item) ? 'Ver observacao' : 'Adicionar observacao'"
                >
                  <div class="w-3 h-3 rounded-full mr-3 shrink-0" :class="getAdquirenteColor(index, item)"></div>
                  <span
                    class="truncate text-sm font-medium transition-colors"
                    :class="getAdquirenteTextClass(item, index)"
                  >
                    {{ getAdquirenteLabel(item.adquirente) }}
                  </span>
                </button>
                <span
                  v-if="temObservacao(item)"
                  class="ml-2 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"
                  title="Linha com observacao"
                >
                </span>
              </div>
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, item.debito, 'text-blue-600')">
              {{ formatCurrency(item.debito) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, item.credito, 'text-green-600')">
              {{ formatCurrency(item.credito) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, item.credito2x, 'text-green-600')">
              {{ formatCurrency(item.credito2x) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, item.credito3x, 'text-green-600')">
              {{ formatCurrency(item.credito3x) }}
            </td>
            <td v-if="mostrarCredito4x6" class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, item.credito4x5x6x, 'text-green-600')">
              {{ formatCurrency(item.credito4x5x6x) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, item.voucher, 'text-purple-600')">
              {{ formatCurrency(item.voucher) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.despesa_mdr_total > 0 ? 'text-red-600' : 'text-gray-400'">
              {{ formatCurrency(item.despesa_mdr_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.despesa_antecipacao_total > 0 ? 'text-red-600' : 'text-gray-400'">
              {{ formatDespesaAntecipacao(item) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold bg-gray-50 rounded-lg" :class="isLinhaAlugueis(item) && item.valor_bruto_total !== 0 ? 'text-red-600' : 'text-gray-900'">
              {{ formatCurrency(item.valor_bruto_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold bg-gray-50 rounded-lg" :class="isLinhaAlugueis(item) && item.valor_liquido_total !== 0 ? 'text-red-600' : 'text-gray-900'">
              {{ formatCurrency(item.valor_liquido_total) }}
            </td>
            </tr>
            <tr v-if="activeItemIndex === index || temObservacao(item)" class="bg-slate-50/80">
              <td :colspan="totalColumns" class="px-8 pb-5 pt-0">
                <div v-if="activeItemIndex === index" class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Observacao de {{ getAdquirenteLabel(item.adquirente) }}
                    </p>
                    <textarea
                      v-model="currentObservation"
                      rows="3"
                      class="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Digite a observacao para este adquirente..."
                    ></textarea>
                    <div class="mt-3 flex items-center justify-end gap-2">
                      <button
                        @click="closeEditor"
                        type="button"
                        class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        @click="saveObservationLocally(item, index)"
                        type="button"
                        class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
                      >
                        Salvar observacao
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3"
                >
                  <div class="flex items-start gap-3">
                    <span class="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400"></span>
                    <div class="min-w-0 flex-1">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Observacao
                      </p>
                      <p class="mt-1 break-words text-sm leading-6 text-slate-600">
                        {{ item.observacoes }}
                      </p>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
        <!-- Linha de Totais -->
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-8 py-5 text-sm font-bold">TOTAL {{ adquirente }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.debito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito2x) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito3x) }}</td>
            <td v-if="mostrarCredito4x6" class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito4x5x6x) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.voucher) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesaMdr) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesaAntecipacao) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.vendaBruta) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.vendaLiquida) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

// Props
const props = defineProps({
  vendasData: {
    type: Array,
    required: true
  },
  totais: {
    type: Object,
    required: true
  },
  adquirente: {
    type: String,
    required: true
  }
})

const currentObservation = ref('')
const activeItemIndex = ref(-1)

const mostrarCredito4x6 = computed(() => {
  if (!Array.isArray(props.vendasData) || props.vendasData.length === 0) return false
  return props.vendasData.some(item => Number(item?.credito4x5x6x || 0) !== 0)
})
const totalColumns = computed(() => (mostrarCredito4x6.value ? 11 : 10))

// Métodos
const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para cores dos adquirentes
const getAdquirenteColor = (index, item = null) => {
  if (isLinhaAlugueis(item)) return 'bg-gray-900'
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-yellow-500'
  ]
  return colors[index % colors.length]
}

const getAdquirenteTextClass = (item, index) => {
  if (isLinhaAlugueis(item)) return 'text-gray-900 group-hover:text-gray-900'
  return activeItemIndex.value === index
    ? 'text-blue-800'
    : (temObservacao(item) ? 'text-blue-700 group-hover:text-blue-800' : 'text-gray-900 group-hover:text-blue-700')
}

const linhasSemAntecipacao = [
  'PIX',
  'VOUCHER',
  'VOUCHERS',
  'ALELO',
  'TICKET',
  'VR',
  'SODEXO',
  'PLUXE',
  'PLUXEE',
  'COMPROCARD',
  'LECARD',
  'UPBRASIL',
  'ECXCARD',
  'FNCARD',
  'BENVISA',
  'CREDSHOP',
  'RCCARD',
  'GOODCARD',
  'BIGCARD',
  'BKCARD',
  'GREENCARD',
  'BRASILCARD',
  'BOLTCARD',
  'CABAL',
  'VEROCARD',
  'FACECARD',
  'VALECARD',
  'NAIP'
]

const isLinhaSemAntecipacao = (item) => {
  const adquirente = String(item?.adquirente || '').toUpperCase()
  return linhasSemAntecipacao.includes(adquirente)
}

const formatDespesaAntecipacao = (item) => {
  if (isLinhaSemAntecipacao(item)) return '-'
  return formatCurrency(item?.despesa_antecipacao_total || 0)
}

const getAdquirenteLabel = (adquirente) => {
  if (String(adquirente || '').toUpperCase() === 'OUTROS') return 'ALUGUEIS'
  return adquirente
}

const isLinhaAlugueis = (item) => {
  const adq = String(item?.adquirente || '').toUpperCase()
  return adq === 'OUTROS' || adq === 'ALUGUEIS'
}

const getValorClass = (item, valor, classePositiva) => {
  if (isLinhaAlugueis(item) && Number(valor || 0) !== 0) {
    return 'text-gray-900'
  }
  return Number(valor || 0) > 0 ? classePositiva : 'text-gray-400'
}

const temObservacao = (item) => Boolean(String(item?.observacoes || '').trim())

const toggleEditor = (item, index) => {
  if (activeItemIndex.value === index) {
    closeEditor()
    return
  }
  currentObservation.value = item?.observacoes || ''
  activeItemIndex.value = index
}

const closeEditor = () => {
  currentObservation.value = ''
  activeItemIndex.value = -1
}

const saveObservationLocally = (item, index) => {
  if (activeItemIndex.value !== index || !item) return
  item.observacoes = currentObservation.value
  closeEditor()
}
</script>
