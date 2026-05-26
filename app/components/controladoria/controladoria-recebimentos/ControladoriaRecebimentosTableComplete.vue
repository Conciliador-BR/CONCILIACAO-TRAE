<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <h2 class="text-xl font-semibold text-gray-900">{{ adquirente }}</h2>
      <p class="text-sm text-gray-600 mt-1">Adquirente de Cartões</p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th class="col-adquirente-pdf px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Adquirente</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Débito</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito</th>
            <th v-if="mostrarVoucher" class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Voucher</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Bruto</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas MDR</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Líquido</th>
            <th class="col-antecipacao-pdf px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas C/ antecipação</th>
            <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Previsto</th>
            <PagamentoDeBancoHeader />
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <template v-for="(item, index) in recebimentosData" :key="index">
            <tr class="group transition-colors duration-200 hover:bg-blue-50">
            <td class="col-adquirente-pdf px-8 py-5">
              <div class="flex items-center">
                <button
                  @click="toggleEditor(item, index)"
                  type="button"
                  class="flex min-w-0 items-center rounded-lg transition-colors"
                  :title="temObservacao(item) ? 'Ver observacao' : 'Adicionar observacao'"
                >
                  <div class="w-3 h-3 rounded-full mr-3 shrink-0" :class="getAdquirenteColor(index)"></div>
                  <span
                    class="truncate text-sm font-medium transition-colors"
                    :class="activeItemIndex === index ? 'text-blue-800' : (temObservacao(item) ? 'text-blue-700 group-hover:text-blue-800' : 'text-gray-900 group-hover:text-blue-700')"
                  >
                    {{ item.adquirente }}
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
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, item.credito + item.credito2x + item.credito3x + item.credito4x5x6x, 'text-green-600')">
              {{ formatCurrency(item.credito + item.credito2x + item.credito3x + item.credito4x5x6x) }}
            </td>
            <td v-if="mostrarVoucher" class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, item.voucher || 0, 'text-purple-600')">
              {{ formatCurrency(item.voucher || 0) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap rounded-lg bg-gray-50 text-right text-sm font-bold" :class="getTotalClass(item, item.valor_bruto_total)">
              {{ formatCurrency(item.valor_bruto_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="Number(item.despesa_mdr_total || 0) > 0 ? 'text-red-600' : 'text-gray-400'">
              {{ formatCurrency(item.despesa_mdr_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap rounded-lg bg-gray-50 text-right text-sm font-bold" :class="getTotalClass(item, item.valor_liquido_total)">
              {{ formatCurrency(item.valor_liquido_total) }}
            </td>
            <td class="col-antecipacao-pdf px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="Number(item.despesa_antecipacao_total || 0) > 0 ? 'text-red-600' : 'text-gray-400'">
              {{ formatCurrency(item.despesa_antecipacao_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap rounded-lg bg-gray-50 text-right text-sm font-bold" :class="getTotalClass(item, item.valor_pago_total)">
              {{ formatCurrency(item.valor_pago_total) }}
            </td>
            <PagamentoDeBancoCell :pagamento-banco="item.pgto_banco" />
            </tr>
            <tr v-if="activeItemIndex === index || temObservacao(item)" class="bg-slate-50/80">
              <td :colspan="totalColumns" class="px-8 pb-5 pt-0">
                <div v-if="activeItemIndex === index" class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Observacao de {{ item.adquirente }}
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
                        @click="saveObservationLocally(index)"
                        type="button"
                        :disabled="salvandoObservacao"
                        class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Salvar observacao
                      </button>
                      <button
                        @click="sendObservation(index)"
                        type="button"
                        :disabled="salvandoObservacao"
                        class="inline-flex items-center rounded-md px-3 py-2 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        :class="{
                          'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600': envioStatus !== 'success' && envioStatus !== 'error',
                          'bg-green-600 hover:bg-green-500': envioStatus === 'success',
                          'bg-red-600 hover:bg-red-500': envioStatus === 'error'
                        }"
                      >
                        <svg v-if="salvandoObservacao" class="animate-spin -ml-0.5 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span v-if="envioStatus === 'pending' || salvandoObservacao">Enviar</span>
                        <span v-else-if="envioStatus === 'success'">OK</span>
                        <span v-else>Erro</span>
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
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="col-adquirente-pdf px-8 py-5 text-sm font-bold">TOTAL {{ adquirente }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.debito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.credito + totais.credito2x + totais.credito3x + totais.credito4x5x6x) }}</td>
            <td v-if="mostrarVoucher" class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.voucher || 0) }}</td>
            <td class="px-8 py-5 rounded-lg bg-white/20 text-right text-sm font-bold">{{ formatCurrency(totais.vendaBruta) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesaMdr) }}</td>
            <td class="px-8 py-5 rounded-lg bg-white/20 text-right text-sm font-bold">{{ formatCurrency(totais.vendaLiquida) }}</td>
            <td class="col-antecipacao-pdf px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesaAntecipacao) }}</td>
            <td class="px-8 py-5 rounded-lg bg-white/20 text-right text-sm font-bold">{{ formatCurrency(totais.valorPago) }}</td>
            <td class="px-8 py-5 text-left text-sm font-bold text-blue-100">{{ formatCurrency(totalPgtoBanco) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div v-if="erroObservacao" class="px-8 py-3 text-sm text-red-600 bg-red-50 border-t border-red-100">
      {{ erroObservacao }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import PagamentoDeBancoCell from '~/components/controladoria/analise-de-recebimentos/pagamento_de_banco/PagamentoDeBancoCell.vue'
import PagamentoDeBancoHeader from '~/components/controladoria/analise-de-recebimentos/pagamento_de_banco/PagamentoDeBancoHeader.vue'

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

const mostrarVoucher = computed(() => {
  const totalVoucher = Number(props?.totais?.voucher || 0)
  if (totalVoucher !== 0) return true
  return Array.isArray(props.recebimentosData) && props.recebimentosData.some(item => Number(item?.voucher || 0) !== 0)
})

const totalPgtoBanco = computed(() => {
  return (props.recebimentosData || []).reduce((acc, item) => {
    return acc + Number(item?.pgto_banco || 0)
  }, 0)
})

const totalColumns = computed(() => (mostrarVoucher.value ? 10 : 9))
const currentObservation = ref('')
const activeItemIndex = ref(-1)
const salvandoObservacao = ref(false)
const erroObservacao = ref('')
const envioStatus = ref('pending')

const temObservacao = (item) => Boolean(String(item?.observacoes || '').trim())

const openEditor = (item, index) => {
  erroObservacao.value = ''
  currentObservation.value = item.observacoes || ''
  activeItemIndex.value = index
  envioStatus.value = 'pending'
}

const toggleEditor = (item, index) => {
  if (activeItemIndex.value === index) {
    closeEditor()
    return
  }
  openEditor(item, index)
}

const closeEditor = () => {
  currentObservation.value = ''
  activeItemIndex.value = -1
  erroObservacao.value = ''
  envioStatus.value = 'pending'
}

const saveObservationLocally = (index) => {
  if (activeItemIndex.value === -1 || activeItemIndex.value !== index) {
    return
  }

  const item = props.recebimentosData[index]
  item.observacoes = currentObservation.value
  envioStatus.value = 'pending'
}

const sendObservation = async (index) => {
  if (activeItemIndex.value === -1 || activeItemIndex.value !== index || salvandoObservacao.value) {
    return
  }

  const item = props.recebimentosData[index]
  const newObservation = currentObservation.value
  item.observacoes = newObservation

  const sourceRows = Array.isArray(item?._sourceRows) ? item._sourceRows : []
  const sourceMap = sourceRows.reduce((acc, row) => {
    const table = row?.table
    const id = row?.id
    if (!table || id === null || id === undefined) return acc
    if (!acc[table]) acc[table] = new Set()
    acc[table].add(id)
    return acc
  }, {})

  const updates = Object.entries(sourceMap)
  if (updates.length === 0) {
    envioStatus.value = 'success'
    closeEditor()
    return
  }

  salvandoObservacao.value = true
  erroObservacao.value = ''
  envioStatus.value = 'pending'
  try {
    for (const [table, idsSet] of updates) {
      const ids = Array.from(idsSet)
      const { error } = await supabase
        .from(table)
        .update({ observacoes: newObservation })
        .in('id', ids)

      if (error) {
        throw new Error(error.message || `Falha ao salvar observação na tabela ${table}`)
      }
    }
    envioStatus.value = 'success'
    closeEditor()
  } catch (error) {
    envioStatus.value = 'error'
    erroObservacao.value = error?.message || 'Erro ao salvar observação no Supabase'
  } finally {
    salvandoObservacao.value = false
  }
}

const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const getAdquirenteColor = (index) => {
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-red-500','bg-indigo-500','bg-pink-500','bg-yellow-500']
  return colors[index % colors.length]
}

const isLinhaAlugueis = (item) => String(item?.adquirente || '').toUpperCase() === 'ALUGUEIS'

const getValorClass = (item, valor, classePositiva) => {
  if (isLinhaAlugueis(item) && Number(valor || 0) !== 0) {
    return 'text-red-600'
  }
  return Number(valor || 0) > 0 ? classePositiva : 'text-gray-400'
}

const getTotalClass = (item, valor) => {
  if (isLinhaAlugueis(item)) {
    return Number(valor || 0) !== 0 ? 'text-red-600' : 'text-gray-400'
  }
  return 'text-gray-900'
}
</script>
