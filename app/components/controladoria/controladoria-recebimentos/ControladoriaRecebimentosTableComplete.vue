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
          <template v-for="(item, index) in linhasExibidas" :key="item._displayKey || index">
            <tr class="group transition-colors duration-200 hover:bg-blue-50">
            <td class="col-adquirente-pdf px-8 py-5">
              <div class="flex items-center">
                <button
                  @click="toggleEditor(item)"
                  type="button"
                  class="flex min-w-0 items-center rounded-lg transition-colors"
                  :title="temObservacao(item) ? 'Ver observacao e antecipacao' : 'Adicionar observacao e antecipacao'"
                >
                  <div class="w-3 h-3 rounded-full mr-3 shrink-0" :class="getAdquirenteColor(index, item)"></div>
                  <span
                    class="truncate text-sm font-medium transition-colors"
                    :class="getAdquirenteTextClass(item)"
                  >
                    {{ getAdquirenteDisplayName(item) }}
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
            <td v-if="mostrarVoucher" class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="getValorClass(item, getVoucherDisplayValue(item), 'text-purple-600')">
              {{ formatCurrency(getVoucherDisplayValue(item)) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap rounded-lg bg-gray-50 text-right text-sm font-bold" :class="getTotalClass(item, item.valor_bruto_total)">
              {{ formatCurrency(item.valor_bruto_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="Number(item.despesa_mdr_total || 0) !== 0 ? 'text-red-600' : 'text-gray-400'">
              {{ formatExpenseCurrency(item.despesa_mdr_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap rounded-lg bg-gray-50 text-right text-sm font-bold" :class="getTotalClass(item, item.valor_liquido_total)">
              {{ formatCurrency(item.valor_liquido_total) }}
            </td>
            <td class="col-antecipacao-pdf px-8 py-5 whitespace-nowrap text-right text-sm font-medium" :class="Number(item.despesa_antecipacao_total || 0) !== 0 ? 'text-red-600' : 'text-gray-400'">
              {{ formatCurrency(item.despesa_antecipacao_total) }}
            </td>
            <td class="px-8 py-5 whitespace-nowrap rounded-lg bg-gray-50 text-right text-sm font-bold" :class="getTotalClass(item, item.valor_pago_total)">
              {{ formatCurrency(item.valor_pago_total) }}
            </td>
            <PagamentoDeBancoCell :pagamento-banco="item.pgto_banco" />
            </tr>
            <tr v-if="activeItemKey === item._displayKey || temObservacao(item)" class="bg-slate-50/80">
              <td :colspan="totalColumns" class="px-8 pb-5 pt-0">
                <div v-if="activeItemKey === item._displayKey" class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Observacao e despesa com antecipacao de {{ getAdquirenteDisplayName(item) }}
                    </p>
                    <textarea
                      v-model="currentObservation"
                      rows="3"
                      class="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Digite a observacao para este adquirente..."
                    ></textarea>
                    <div class="mt-3">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Despesa com antecipacao
                      </p>
                      <div class="relative mt-2 max-w-xs">
                        <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-500">R$</span>
                        <input
                          :value="currentAntecipacaoInput"
                          inputmode="decimal"
                          class="block w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-right text-sm font-medium text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="0,00"
                          @input="onInputAntecipacao"
                          @blur="onBlurAntecipacao"
                        />
                      </div>
                    </div>
                    <div class="mt-3 flex items-center justify-end gap-2">
                      <button
                        @click="closeEditor"
                        type="button"
                        class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        @click="saveObservationLocally(item)"
                        type="button"
                        :disabled="salvandoObservacao"
                        class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Salvar
                      </button>
                      <button
                        @click="sendObservation(item)"
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
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.debito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.credito) }}</td>
            <td v-if="mostrarVoucher" class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totalVoucherExibido) }}</td>
            <td class="px-8 py-5 rounded-lg bg-white/20 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.vendaBruta) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatExpenseCurrency(totaisExibidos.despesaMdr) }}</td>
            <td class="px-8 py-5 rounded-lg bg-white/20 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.vendaLiquida) }}</td>
            <td class="col-antecipacao-pdf px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.despesaAntecipacao) }}</td>
            <td class="px-8 py-5 rounded-lg bg-white/20 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.valorPago) }}</td>
            <td class="px-8 py-5 text-left text-sm font-bold text-white">{{ formatCurrency(totalPgtoBanco) }}</td>
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
import { computed, ref, watch } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { isMissingColumnError } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/supabaseUtils'
import { logPgtoBancoDebug } from '~/utils/debugPgtoBancoControladoria'
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

const round2 = (value) => {
  const numero = Number(value || 0)
  if (!Number.isFinite(numero)) return 0
  return Math.round((numero + Number.EPSILON) * 100) / 100
}

const formatBRLNumber = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(round2(value))
}

const parseBRL = (value) => {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const raw = String(value).trim()
  if (!raw) return 0
  const normalized = raw.replace(/\s/g, '').replace(/[^0-9,.-]/g, '')
  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? round2(parsed) : 0
}

const mostrarVoucher = computed(() => {
  const totalVoucher = totalVoucherExibido.value
  if (totalVoucher !== 0) return true
  return Array.isArray(linhasExibidas.value) && linhasExibidas.value.some(item => Number(getVoucherDisplayValue(item) || 0) !== 0)
})

const isLinhaVoucherCartao = (item) => {
  return String(item?.adquirente || '').toUpperCase().includes('VOUCHER')
}

const getLinhaBaseVoucher = (item) => {
  const nome = String(item?.adquirente || '').toUpperCase().trim()
  if (nome === 'VISA VOUCHER') return 'VISA'
  if (nome === 'MASTERCARD VOUCHER') return 'MASTERCARD'
  if (nome === 'ELO VOUCHER') return 'ELO CRÉDITO'
  if (nome === 'AMEX VOUCHER') return 'AMEX'
  if (nome === 'HIPERCARD VOUCHER') return 'HIPERCARD'
  return nome.replace(/\s+VOUCHER$/, '').trim()
}

const getVoucherDisplayValue = (item) => {
  const valorVoucher = Number(item?.voucher || 0)
  if (valorVoucher !== 0) return valorVoucher
  if (isLinhaVoucherCartao(item)) {
    return Number(item?.pgto_banco || 0)
  }
  return 0
}

const clonarLinha = (item) => ({
  ...item,
  _sourceRows: Array.isArray(item?._sourceRows) ? [...item._sourceRows] : [],
  _displayKey: String(item?.adquirente || '')
})

const mergeSourceRows = (destino, origem) => {
  if (!Array.isArray(origem?._sourceRows) || origem._sourceRows.length === 0) return
  if (!Array.isArray(destino._sourceRows)) destino._sourceRows = []
  destino._sourceRows.push(...origem._sourceRows)
}

const mergeLinhaBase = (destino, origem) => {
  destino.debito = Number(destino.debito || 0) + Number(origem?.debito || 0)
  destino.credito = Number(destino.credito || 0) + Number(origem?.credito || 0)
  destino.credito2x = Number(destino.credito2x || 0) + Number(origem?.credito2x || 0)
  destino.credito3x = Number(destino.credito3x || 0) + Number(origem?.credito3x || 0)
  destino.credito4x5x6x = Number(destino.credito4x5x6x || 0) + Number(origem?.credito4x5x6x || 0)
  destino.voucher = Number(destino.voucher || 0) + Number(origem?.voucher || 0)
  destino.valor_bruto_total = Number(destino.valor_bruto_total || 0) + Number(origem?.valor_bruto_total || 0)
  destino.valor_liquido_total = Number(destino.valor_liquido_total || 0) + Number(origem?.valor_liquido_total || 0)
  destino.valor_pago_total = Number(destino.valor_pago_total || 0) + Number(origem?.valor_pago_total || 0)
  destino.despesa_mdr_total = Number(destino.despesa_mdr_total || 0) + Number(origem?.despesa_mdr_total || 0)
  destino.despesa_antecipacao_total = Number(destino.despesa_antecipacao_total || 0) + Number(origem?.despesa_antecipacao_total || 0)
  destino.pgto_banco = Number(destino.pgto_banco || 0) + Number(origem?.pgto_banco || 0)
  if (!destino.observacoes && origem?.observacoes) destino.observacoes = origem.observacoes
  mergeSourceRows(destino, origem)
}

const buildLinhasExibidas = () => {
  const linhas = []
  const mapaLinhas = new Map()

  for (const original of (props.recebimentosData || [])) {
    if (!isLinhaVoucherCartao(original)) {
      const chaveBase = String(original?.adquirente || '').toUpperCase().trim()
      const linhaExistente = mapaLinhas.get(chaveBase)
      if (linhaExistente) {
        mergeLinhaBase(linhaExistente, original)
        continue
      }

      const linha = clonarLinha(original)
      linha._displayKey = chaveBase
      linhas.push(linha)
      mapaLinhas.set(chaveBase, linha)
      continue
    }

    const chaveBase = getLinhaBaseVoucher(original)
    let linhaBase = mapaLinhas.get(chaveBase)

    if (!linhaBase) {
      linhaBase = clonarLinha({
        ...original,
        adquirente: chaveBase,
        debito: 0,
        credito: 0,
        credito2x: 0,
        credito3x: 0,
        credito4x5x6x: 0,
        voucher: 0,
        valor_bruto_total: 0,
        valor_liquido_total: 0,
        valor_pago_total: 0,
        despesa_mdr_total: 0,
        despesa_antecipacao_total: 0,
        pgto_banco: 0,
        observacoes: '',
        _linhaSinteticaPgtoBanco: true
      })
      linhaBase._displayKey = chaveBase
      linhas.push(linhaBase)
      mapaLinhas.set(chaveBase, linhaBase)
    }

    linhaBase.voucher = Number(linhaBase.voucher || 0) + getVoucherDisplayValue(original)
    linhaBase.valor_bruto_total = Number(linhaBase.valor_bruto_total || 0) + Number(original?.valor_bruto_total || 0)
    linhaBase.valor_liquido_total = Number(linhaBase.valor_liquido_total || 0) + Number(original?.valor_liquido_total || 0)
    linhaBase.valor_pago_total = Number(linhaBase.valor_pago_total || 0) + Number(original?.valor_pago_total || 0)
    linhaBase.despesa_mdr_total = Number(linhaBase.despesa_mdr_total || 0) + Number(original?.despesa_mdr_total || 0)
    linhaBase.despesa_antecipacao_total = Number(linhaBase.despesa_antecipacao_total || 0) + Number(original?.despesa_antecipacao_total || 0)
    linhaBase.pgto_banco = Number(linhaBase.pgto_banco || 0) + Number(original?.pgto_banco || 0)

    if (Number(original?.pgto_banco || 0) !== 0) {
      logPgtoBancoDebug({
        runId: 'table-merge',
        hypothesisId: 'C',
        location: 'ControladoriaRecebimentosTableComplete.vue:voucher-merge',
        msg: '[DEBUG] PGTO BANCO line merged in final table',
        data: {
          originalAdquirente: original?.adquirente || '',
          chaveBase,
          originalPgtoBanco: Number(original?.pgto_banco || 0),
          originalVoucher: Number(original?.voucher || 0),
          pgtoBancoBaseAposMerge: Number(linhaBase.pgto_banco || 0),
          voucherBaseAposMerge: Number(linhaBase.voucher || 0),
          linhaSinteticaPgtoBanco: Boolean(linhaBase?._linhaSinteticaPgtoBanco)
        }
      })
    }
    if (Array.isArray(original?._sourceRows) && original._sourceRows.length > 0) {
      linhaBase._sourceRows.push(...original._sourceRows)
    }
  }

  return linhas
}

const linhasExibidas = ref([])

watch(
  () => props.recebimentosData,
  () => {
    linhasExibidas.value = buildLinhasExibidas()
  },
  { immediate: true, deep: true }
)

const totalVoucherExibido = computed(() => {
  return (linhasExibidas.value || []).reduce((acc, item) => {
    return acc + getVoucherDisplayValue(item)
  }, 0)
})

const totalPgtoBanco = computed(() => {
  return (linhasExibidas.value || []).reduce((acc, item) => {
    return acc + Number(item?.pgto_banco || 0)
  }, 0)
})

const totaisExibidos = computed(() => {
  return (linhasExibidas.value || []).reduce((acc, item) => {
    acc.debito += Number(item?.debito || 0)
    acc.credito += Number(item?.credito || 0) + Number(item?.credito2x || 0) + Number(item?.credito3x || 0) + Number(item?.credito4x5x6x || 0)
    acc.voucher += Number(getVoucherDisplayValue(item) || 0)
    acc.vendaBruta += Number(item?.valor_bruto_total || 0)
    acc.despesaMdr += Number(item?.despesa_mdr_total || 0)
    acc.vendaLiquida += Number(item?.valor_liquido_total || 0)
    acc.despesaAntecipacao += Number(item?.despesa_antecipacao_total || 0)
    acc.valorPago += Number(item?.valor_pago_total || 0)
    return acc
  }, {
    debito: 0,
    credito: 0,
    voucher: 0,
    vendaBruta: 0,
    despesaMdr: 0,
    vendaLiquida: 0,
    despesaAntecipacao: 0,
    valorPago: 0
  })
})

const totalColumns = computed(() => (mostrarVoucher.value ? 10 : 9))
const currentObservation = ref('')
const currentAntecipacaoInput = ref('0,00')
const currentAntecipacaoValue = ref(0)
const activeItemKey = ref('')
const salvandoObservacao = ref(false)
const erroObservacao = ref('')
const envioStatus = ref('pending')

const temObservacao = (item) => Boolean(String(item?.observacoes || '').trim())

const openEditor = (item) => {
  erroObservacao.value = ''
  currentObservation.value = item.observacoes || ''
  currentAntecipacaoValue.value = round2(item?.despesa_antecipacao_total || 0)
  currentAntecipacaoInput.value = formatBRLNumber(currentAntecipacaoValue.value)
  activeItemKey.value = item._displayKey || String(item?.adquirente || '')
  envioStatus.value = 'pending'
}

const toggleEditor = (item) => {
  const key = item._displayKey || String(item?.adquirente || '')
  if (activeItemKey.value === key) {
    closeEditor()
    return
  }
  openEditor(item)
}

const closeEditor = () => {
  currentObservation.value = ''
  currentAntecipacaoValue.value = 0
  currentAntecipacaoInput.value = '0,00'
  activeItemKey.value = ''
  erroObservacao.value = ''
  envioStatus.value = 'pending'
}

const saveObservationLocally = (item) => {
  const key = item._displayKey || String(item?.adquirente || '')
  if (!key || activeItemKey.value !== key) {
    return
  }
  item.observacoes = currentObservation.value
  item.despesa_antecipacao_total = round2(currentAntecipacaoValue.value)
  item.valor_pago_total = round2(Number(item?.valor_liquido_total || 0) - item.despesa_antecipacao_total)
  envioStatus.value = 'pending'
}

const onInputAntecipacao = (event) => {
  const value = String(event?.target?.value ?? '')
  currentAntecipacaoInput.value = value
  currentAntecipacaoValue.value = parseBRL(value)
}

const onBlurAntecipacao = () => {
  currentAntecipacaoInput.value = formatBRLNumber(currentAntecipacaoValue.value)
}

const sendObservation = async (item) => {
  const key = item._displayKey || String(item?.adquirente || '')
  if (!key || activeItemKey.value !== key || salvandoObservacao.value) {
    return
  }
  const newObservation = currentObservation.value
  const novaAntecipacao = round2(currentAntecipacaoValue.value)
  item.observacoes = newObservation
  item.despesa_antecipacao_total = novaAntecipacao
  item.valor_pago_total = round2(Number(item?.valor_liquido_total || 0) - novaAntecipacao)

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
    const [firstTable, firstIdsSet] = updates[0]
    const firstIds = Array.from(firstIdsSet)
    const firstId = firstIds.shift()

    const { error: firstError } = await supabase
      .from(firstTable)
      .update({
        observacoes: newObservation,
        despesa_antecipacao: novaAntecipacao
      })
      .eq('id', firstId)

    if (firstError) {
      if (isMissingColumnError(firstError, 'despesa_antecipacao')) {
        throw new Error(`A tabela ${firstTable} não possui a coluna despesa_antecipacao.`)
      }
      throw new Error(firstError.message || `Falha ao salvar edição na tabela ${firstTable}`)
    }

    const pendentes = []
    if (firstIds.length > 0) {
      pendentes.push([firstTable, firstIds])
    }
    for (const [table, idsSet] of updates.slice(1)) {
      pendentes.push([table, Array.from(idsSet)])
    }

    for (const [table, ids] of pendentes) {
      const { error } = await supabase
        .from(table)
        .update({
          observacoes: newObservation,
          despesa_antecipacao: 0
        })
        .in('id', ids)

      if (error) {
        if (isMissingColumnError(error, 'despesa_antecipacao')) {
          throw new Error(`A tabela ${table} não possui a coluna despesa_antecipacao.`)
        }
        throw new Error(error.message || `Falha ao salvar edição na tabela ${table}`)
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

const formatExpenseCurrency = (value) => {
  return formatCurrency(Math.abs(Number(value || 0)))
}

const getAdquirenteColor = (index, item = null) => {
  if (isLinhaAlugueis(item)) return 'bg-gray-900'
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-red-500','bg-indigo-500','bg-pink-500','bg-yellow-500']
  return colors[index % colors.length]
}

const getAdquirenteDisplayName = (item) => {
  const nome = String(item?.adquirente || '').toUpperCase().trim()
  if (nome === 'VISA') return 'VISA CRÉDITO'
  if (nome === 'BRADESCO DÉBITO') return 'VISA ELECTRON'
  return String(item?.adquirente || '')
}

const isLinhaAlugueis = (item) => String(item?.adquirente || '').toUpperCase() === 'ALUGUEIS'

const getAdquirenteTextClass = (item) => {
  if (isLinhaAlugueis(item)) return 'text-gray-900 group-hover:text-gray-900'
  return activeItemKey.value === item._displayKey
    ? 'text-blue-800'
    : (temObservacao(item) ? 'text-blue-700 group-hover:text-blue-800' : 'text-gray-900 group-hover:text-blue-700')
}

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
