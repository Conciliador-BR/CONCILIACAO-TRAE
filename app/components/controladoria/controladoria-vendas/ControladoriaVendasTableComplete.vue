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
                  :title="temObservacao(item) ? 'Ver observacao e antecipacao' : 'Adicionar observacao e antecipacao'"
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
                      Observacao e despesa com antecipacao de {{ getAdquirenteLabel(item.adquirente) }}
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
                        @click="saveObservationLocally(item, index)"
                        type="button"
                        class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
                      >
                        Salvar
                      </button>
                      <button
                        @click="sendObservation(item, index)"
                        type="button"
                        :disabled="salvandoEdicao"
                        class="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        :class="{
                          'bg-indigo-600 hover:bg-indigo-500': envioStatus !== 'success' && envioStatus !== 'error',
                          'bg-green-600 hover:bg-green-500': envioStatus === 'success',
                          'bg-red-600 hover:bg-red-500': envioStatus === 'error'
                        }"
                      >
                        <span v-if="salvandoEdicao">Enviando...</span>
                        <span v-else-if="envioStatus === 'success'">OK</span>
                        <span v-else-if="envioStatus === 'error'">Erro</span>
                        <span v-else>Enviar</span>
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
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.debito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.credito) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.credito2x) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.credito3x) }}</td>
            <td v-if="mostrarCredito4x6" class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.credito4x5x6x) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.voucher) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.despesaMdr) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totaisExibidos.despesaAntecipacao) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totaisExibidos.vendaBruta) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totaisExibidos.vendaLiquida) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div v-if="erroEdicao" class="border-t border-red-100 bg-red-50 px-8 py-3 text-sm text-red-600">
      {{ erroEdicao }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { isMissingColumnError } from '~/composables/PageControladoria/controladoria-vendas/tabela_voucher_manual/supabaseUtils'

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
const currentAntecipacaoInput = ref('0,00')
const currentAntecipacaoValue = ref(0)
const activeItemIndex = ref(-1)
const salvandoEdicao = ref(false)
const erroEdicao = ref('')
const envioStatus = ref('pending')

const round2 = (value) => {
  const numero = Number(value || 0)
  if (!Number.isFinite(numero)) return 0
  return Math.round((numero + Number.EPSILON) * 100) / 100
}

const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
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

const mostrarCredito4x6 = computed(() => {
  if (!Array.isArray(props.vendasData) || props.vendasData.length === 0) return false
  return props.vendasData.some(item => Number(item?.credito4x5x6x || 0) !== 0)
})

const totaisExibidos = computed(() => {
  return (props.vendasData || []).reduce((acc, item) => {
    acc.debito += Number(item?.debito || 0)
    acc.credito += Number(item?.credito || 0)
    acc.credito2x += Number(item?.credito2x || 0)
    acc.credito3x += Number(item?.credito3x || 0)
    acc.credito4x5x6x += Number(item?.credito4x5x6x || 0)
    acc.voucher += Number(item?.voucher || 0)
    acc.despesaMdr += Number(item?.despesa_mdr_total || 0)
    acc.despesaAntecipacao += Number(item?.despesa_antecipacao_total || 0)
    acc.vendaBruta += Number(item?.valor_bruto_total || 0)
    acc.vendaLiquida += Number(item?.valor_liquido_total || 0)
    return acc
  }, {
    debito: 0,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    despesaMdr: 0,
    despesaAntecipacao: 0,
    vendaBruta: 0,
    vendaLiquida: 0
  })
})

const totalColumns = computed(() => (mostrarCredito4x6.value ? 11 : 10))

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
  const valor = Number(item?.despesa_antecipacao_total || 0)
  if (valor === 0 && isLinhaSemAntecipacao(item)) return '-'
  return formatCurrency(valor)
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

const aplicarEdicaoLocal = (item) => {
  if (!item) return
  const antecipacao = round2(currentAntecipacaoValue.value)
  item.observacoes = currentObservation.value
  item.despesa_antecipacao_total = antecipacao
  item.valor_liquido_total = round2(
    Number(item?.valor_bruto_total || 0) -
    Number(item?.despesa_mdr_total || 0) -
    antecipacao
  )
}

const toggleEditor = (item, index) => {
  if (activeItemIndex.value === index) {
    closeEditor()
    return
  }
  erroEdicao.value = ''
  envioStatus.value = 'pending'
  currentObservation.value = item?.observacoes || ''
  currentAntecipacaoValue.value = round2(item?.despesa_antecipacao_total || 0)
  currentAntecipacaoInput.value = formatBRLNumber(currentAntecipacaoValue.value)
  activeItemIndex.value = index
}

const closeEditor = () => {
  currentObservation.value = ''
  currentAntecipacaoInput.value = '0,00'
  currentAntecipacaoValue.value = 0
  activeItemIndex.value = -1
  erroEdicao.value = ''
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

const saveObservationLocally = (item, index) => {
  if (activeItemIndex.value !== index || !item) return
  aplicarEdicaoLocal(item)
  envioStatus.value = 'pending'
}

const agruparSourceRows = (item) => {
  const sourceRows = Array.isArray(item?._sourceRows) ? item._sourceRows : []
  const uniqueRows = []
  const seen = new Set()

  for (const row of sourceRows) {
    const table = String(row?.table || '').trim()
    const id = row?.id
    if (!table || id === null || id === undefined) continue
    const key = `${table}:${id}`
    if (seen.has(key)) continue
    seen.add(key)
    uniqueRows.push({ table, id })
  }

  return uniqueRows
}

const atualizarLinhaSupabase = async (table, id, payload) => {
  const { error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id)

  if (error) {
    if (isMissingColumnError(error, 'despesa_antecipacao')) {
      throw new Error(`A tabela ${table} não possui a coluna despesa_antecipacao.`)
    }
    throw new Error(error.message || `Falha ao salvar edição na tabela ${table}`)
  }
}

const sendObservation = async (item, index) => {
  if (activeItemIndex.value !== index || !item || salvandoEdicao.value) {
    return
  }

  aplicarEdicaoLocal(item)
  const uniqueRows = agruparSourceRows(item)
  if (uniqueRows.length === 0) {
    envioStatus.value = 'success'
    closeEditor()
    return
  }

  const observacao = currentObservation.value
  const antecipacao = round2(currentAntecipacaoValue.value)
  const [primeiraLinha, ...demaisLinhas] = uniqueRows

  salvandoEdicao.value = true
  erroEdicao.value = ''
  envioStatus.value = 'pending'

  try {
    await atualizarLinhaSupabase(primeiraLinha.table, primeiraLinha.id, {
      observacoes: observacao,
      despesa_antecipacao: antecipacao
    })

    for (const row of demaisLinhas) {
      await atualizarLinhaSupabase(row.table, row.id, {
        observacoes: observacao,
        despesa_antecipacao: 0
      })
    }

    envioStatus.value = 'success'
    closeEditor()
  } catch (error) {
    envioStatus.value = 'error'
    erroEdicao.value = error?.message || 'Erro ao salvar edição no Supabase'
  } finally {
    salvandoEdicao.value = false
  }
}
</script>
