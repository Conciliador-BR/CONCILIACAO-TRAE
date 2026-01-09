<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <h2 class="text-xl font-semibold text-gray-900">{{ adquirente }}</h2>
      <p class="text-sm text-gray-600 mt-1">Adquirente de Cartões</p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-2xl">
          <tr class="border-b border-blue-700/50">
            <th class="px-8 py-5 text-left text-sm font-bold text-white uppercase tracking-wider">Adquirente</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Débito</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Crédito</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Bruto</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Despesas MDR</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Líquido</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Despesas C/ antecipação</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Previsto</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Depositado</th>
            <th class="px-8 py-5 text-center text-sm font-bold text-white uppercase tracking-wider">Observações</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-for="(item, index) in recebimentosData" :key="index" class="hover:bg-gray-50 transition-colors duration-200 group">
            <td class="px-8 py-5 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" :class="getAdquirenteColor(index)"></div>
                <span class="text-sm font-medium text-gray-900 group-hover:text-blue-700">{{ item.adquirente }}</span>
              </div>
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.debito !== 0 ? 'text-red-600' : 'text-gray-400') : (item.debito > 0 ? 'text-blue-600' : 'text-gray-400')">
              {{ formatCurrency(item.debito) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? ((item.credito + item.credito2x + item.credito3x + item.credito4x5x6x) !== 0 ? 'text-red-600' : 'text-gray-400') : ((item.credito + item.credito2x + item.credito3x + item.credito4x5x6x) > 0 ? 'text-green-600' : 'text-gray-400')">
              {{ formatCurrency(item.credito + item.credito2x + item.credito3x + item.credito4x5x6x) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold bg-gray-50 rounded-lg" :class="item.adquirente === 'ALUGUEIS' ? (item.valor_bruto_total !== 0 ? 'text-red-600' : 'text-gray-400') : 'text-gray-900'">
              {{ formatCurrency(item.valor_bruto_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.despesa_mdr_total !== 0 ? 'text-red-600' : 'text-gray-400') : (item.despesa_mdr_total > 0 ? 'text-red-600' : 'text-gray-400')">
              {{ formatCurrency(item.despesa_mdr_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold bg-gray-50 rounded-lg" :class="item.adquirente === 'ALUGUEIS' ? (item.valor_liquido_total !== 0 ? 'text-red-600' : 'text-gray-400') : 'text-gray-900'">
              {{ formatCurrency(item.valor_liquido_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="item.adquirente === 'ALUGUEIS' ? (item.despesa_antecipacao_total !== 0 ? 'text-red-600' : 'text-gray-400') : (item.despesa_antecipacao_total > 0 ? 'text-red-600' : 'text-gray-400')">
              {{ formatCurrency(item.despesa_antecipacao_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold bg-gray-50 rounded-lg" :class="item.adquirente === 'ALUGUEIS' ? (item.valor_pago_total !== 0 ? 'text-red-600' : 'text-gray-400') : 'text-gray-900'">
              {{ formatCurrency(item.valor_pago_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="(item.valor_depositado || 0) > 0 ? 'text-green-600' : 'text-gray-400'">
              {{ formatCurrency(item.valor_depositado || 0) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-center text-sm font-medium">
              <button 
                @click="openModal(item, index)"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                :class="item.observacoes ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
              >
                <span v-if="item.observacoes" class="truncate max-w-[150px]">{{ item.observacoes }}</span>
                <span v-else>Adicionar</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-8 py-5 text-sm font-bold">TOTAL {{ adquirente }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.debito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito + totais.credito2x + totais.credito3x + totais.credito4x5x6x) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.vendaBruta) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesaMdr) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.vendaLiquida) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesaAntecipacao) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valorPago) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.valorDepositado || 0) }}</td>
            <td class="px-8 py-5 text-left text-sm font-bold"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Modal de Observações -->
    <ObservacoesModal 
      :is-open="isModalOpen"
      :initial-value="currentObservation"
      @close="closeModal"
      @save="saveObservation"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ObservacoesModal from './ObservacoesModal.vue'

const props = defineProps({
  recebimentosData: {
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

// Modal state
const isModalOpen = ref(false)
const currentObservation = ref('')
const activeItemIndex = ref(-1)

const openModal = (item, index) => {
  currentObservation.value = item.observacoes || ''
  activeItemIndex.value = index
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  currentObservation.value = ''
  activeItemIndex.value = -1
}

const saveObservation = (newObservation) => {
  if (activeItemIndex.value !== -1) {
    // Atualiza diretamente o item no array (reatividade do Vue cuidará da UI)
    props.recebimentosData[activeItemIndex.value].observacoes = newObservation
  }
  closeModal()
}

const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const getAdquirenteColor = (index) => {
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-red-500','bg-indigo-500','bg-pink-500','bg-yellow-500']
  return colors[index % colors.length]
}
</script>
