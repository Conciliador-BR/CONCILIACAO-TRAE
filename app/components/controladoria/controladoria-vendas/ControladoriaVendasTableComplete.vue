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
            <th class="px-8 py-5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Observações</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-for="(item, index) in vendasData" :key="index" 
              class="hover:bg-blue-50 transition-colors duration-200 group">
            <td class="px-8 py-5 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" :class="getAdquirenteColor(index)"></div>
                <span class="text-sm font-medium text-gray-900 group-hover:text-blue-700">{{ getAdquirenteLabel(item.adquirente) }}</span>
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
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
              {{ formatCurrency(item.valor_bruto_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
              {{ formatCurrency(item.valor_liquido_total) }}
            </td>
            <td class="px-8 py-5 text-center text-sm font-medium">
              <button
                @click="openModal(item)"
                class="pdf-observacao-btn inline-flex w-full items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                :class="item.observacoes ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
                :title="item.observacoes || 'Adicionar descrição'"
              >
                <span v-if="item.observacoes" class="whitespace-normal break-words leading-snug text-left">{{ item.observacoes }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </td>
          </tr>
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
            <td class="px-8 py-5"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <ObservacoesModal
      :is-open="isModalOpen"
      :initial-value="currentObservation"
      @close="closeModal"
      @save="saveObservation"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ObservacoesModal from '../controladoria-recebimentos/ObservacoesModal.vue'

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

const isModalOpen = ref(false)
const currentObservation = ref('')
const activeItem = ref(null)

const openModal = (item) => {
  currentObservation.value = item?.observacoes || ''
  activeItem.value = item || null
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  currentObservation.value = ''
  activeItem.value = null
}

const saveObservation = (newObservation) => {
  if (activeItem.value) {
    activeItem.value.observacoes = newObservation
  }
  closeModal()
}

const mostrarCredito4x6 = computed(() => {
  if (!Array.isArray(props.vendasData) || props.vendasData.length === 0) return false
  return props.vendasData.some(item => Number(item?.credito4x5x6x || 0) !== 0)
})

// Métodos
const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para cores dos adquirentes
const getAdquirenteColor = (index) => {
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

const getValorClass = (item, valor, classePositiva) => {
  if (String(item?.adquirente || '').toUpperCase() === 'OUTROS' && Number(valor || 0) !== 0) {
    return 'text-red-600'
  }
  return Number(valor || 0) > 0 ? classePositiva : 'text-gray-400'
}
</script>
