<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Vouchers</h2>
        <p class="text-sm text-gray-600 mt-1">
          Previsao futura dos recebimentos agrupada por bandeira e modalidade voucher
          <span v-if="!empresaSelecionada" class="text-amber-600 font-medium ml-2 text-xs">
            (Selecione uma empresa)
          </span>
        </p>
      </div>

      <button
        @click="carregarTabela"
        class="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
        :disabled="!empresaSelecionada || loading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Recarregar
      </button>
    </div>

    <div v-if="error" class="bg-red-50 text-red-700 px-6 py-3 text-sm border-b border-red-100">
      {{ error }}
    </div>

    <div v-if="successMessage" class="bg-green-50 text-green-700 px-6 py-3 text-sm border-b border-green-100 flex justify-between items-center">
      <span>{{ successMessage }}</span>
      <button @click="limparSucesso" class="text-green-800 hover:text-green-900">&times;</button>
    </div>

    <div v-if="loading && !linhasExibidas.length" class="px-8 py-10 flex items-center justify-center gap-3 text-gray-600">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span>Carregando vouchers da previsao manual...</span>
    </div>

    <div v-else-if="empresaSelecionada && !linhasExibidas.length" class="px-8 py-10 text-sm text-slate-600 bg-slate-50">
      Nenhum voucher com tabela de recebimento foi encontrado para a empresa selecionada.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th class="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Voucher</th>
            <th
              v-for="mes in meses"
              :key="mes.key"
              class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
            >
              {{ mes.label }}
            </th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Acao</th>
          </tr>
        </thead>

        <tbody v-for="(voucher, index) in linhasExibidas" :key="voucher.nome" class="bg-white divide-y divide-gray-100">
          <tr class="hover:bg-blue-50 transition-colors duration-200 group">
            <td class="px-8 py-5">
              <div class="flex items-center">
                <button
                  @click="toggleEditor(voucher, index)"
                  type="button"
                  class="flex min-w-0 items-center rounded-lg transition-colors"
                  :title="temObservacao(voucher) ? 'Ver observacao' : 'Adicionar observacao'"
                >
                  <div class="w-3 h-3 rounded-full mr-3 shrink-0" :class="getAdquirenteColor(index)"></div>
                  <span
                    class="truncate text-sm font-medium transition-colors"
                    :class="activeObservationIndex === index ? 'text-blue-800' : (temObservacao(voucher) ? 'text-blue-700 group-hover:text-blue-800' : 'text-gray-900 group-hover:text-blue-700')"
                  >
                    {{ voucher.nome }}
                  </span>
                </button>

                <span
                  v-if="temObservacao(voucher)"
                  class="ml-2 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"
                  title="Linha com observacao"
                >
                </span>
              </div>
            </td>

            <td
              v-for="mes in meses"
              :key="`${voucher.nome}-${mes.key}`"
              class="px-6 py-5 whitespace-nowrap text-right text-sm font-medium"
            >
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-gray-500">R$</span>
                <input
                  :value="voucher._meses[mes.key].input"
                  @input="atualizarInputMes(voucher, mes.key, $event?.target?.value)"
                  @focus="iniciarInputMes(voucher, mes.key, $event)"
                  @blur="finalizarInputMes(voucher, mes.key)"
                  :disabled="!empresaSelecionada || voucher.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  placeholder="0,00"
                />
              </div>
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
              {{ formatCurrency(totalVoucher(voucher)) }}
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="enviarVoucher(voucher)"
                :disabled="!empresaSelecionada || !temAlteracao(voucher) || voucher.status === 'sending'"
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

          <tr v-if="activeObservationIndex === index || temObservacao(voucher)" class="bg-slate-50/80">
            <td :colspan="totalColumns" class="px-8 pb-5 pt-0">
              <div v-if="activeObservationIndex === index" class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Observacao de {{ voucher.nome }}
                  </p>
                  <textarea
                    :value="currentObservation"
                    @input="setCurrentObservation($event?.target?.value ?? '')"
                    rows="3"
                    class="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Digite a observacao para este voucher..."
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
                      @click="saveObservationLocally(voucher, index)"
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
                      {{ voucher.observacoes }}
                    </p>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-8 py-5 text-sm font-bold">TOTAL Vouchers</td>
            <td
              v-for="mes in meses"
              :key="`total-${mes.key}`"
              class="px-6 py-5 text-right text-sm font-bold"
            >
              {{ formatCurrency(totais[mes.key]) }}
            </td>
            <td class="px-6 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">
              {{ formatCurrency(totais.total) }}
            </td>
            <td class="px-8 py-5 text-left text-sm font-bold"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useVouchersPrevisaoManual } from '~/composables/PageControladoria/previsao-de-recebimento/tabela_voucher_previsao_manual/useVouchersPrevisaoManual'

const props = defineProps({
  meses: {
    type: Array,
    default: () => []
  }
})

const { filtrosGlobais } = useGlobalFilters()
const {
  vouchersData,
  loading,
  error,
  successMessage,
  empresaSelecionada,
  carregar,
  atualizarInputMes,
  iniciarInputMes,
  finalizarInputMes,
  enviarVoucher,
  temAlteracao,
  totais
} = useVouchersPrevisaoManual(computed(() => props.meses))

const activeObservationIndex = ref(-1)
const currentObservation = ref('')

const linhasExibidas = computed(() => {
  if (!empresaSelecionada.value) return []
  return (vouchersData.value || []).filter((voucher) => voucher?._table_exists === true && Boolean(voucher?._table_name))
})

const totalColumns = computed(() => props.meses.length + 3)

const getAdquirenteColor = (index) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500']
  return colors[index % colors.length]
}

const temObservacao = (voucher) => Boolean(String(voucher?.observacoes || '').trim())

const totalVoucher = (voucher) => {
  return props.meses.reduce((acc, mes) => acc + Number(voucher?._meses?.[mes.key]?.value || 0), 0)
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const toggleEditor = (voucher, index) => {
  if (activeObservationIndex.value === index) {
    closeEditor()
    return
  }
  currentObservation.value = voucher?.observacoes || ''
  activeObservationIndex.value = index
}

const closeEditor = () => {
  currentObservation.value = ''
  activeObservationIndex.value = -1
}

const setCurrentObservation = (value) => {
  currentObservation.value = String(value || '')
}

const saveObservationLocally = (voucher, index) => {
  if (activeObservationIndex.value !== index || !voucher) return
  voucher.observacoes = currentObservation.value
  voucher.status = 'pending'
  closeEditor()
}

const limparSucesso = () => {
  successMessage.value = ''
}

const carregarTabela = async () => {
  closeEditor()
  await carregar()
}

onMounted(async () => {
  if (empresaSelecionada.value) {
    await carregarTabela()
  }
})

watch(
  () => [
    filtrosGlobais.empresaSelecionada,
    filtrosGlobais.dataInicial,
    filtrosGlobais.dataFinal,
    props.meses.map((mes) => mes?.sortKey || '').join('|')
  ],
  async () => {
    if (empresaSelecionada.value) {
      await carregarTabela()
      return
    }
    closeEditor()
  }
)
</script>
