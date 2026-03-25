<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 mt-6 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Vouchers (Recebimentos)</h2>
        <p class="text-sm text-gray-600 mt-1">
          Adquirente de Cartões
          <span v-if="!empresaSelecionada" class="text-amber-600 font-medium ml-2 text-xs">
            (Selecione uma empresa)
          </span>
        </p>
      </div>
      <button
        @click="carregarTudo"
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
      <button @click="successMessage = null" class="text-green-800 hover:text-green-900">&times;</button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-2xl">
          <tr class="border-b border-blue-700/50">
            <th class="px-8 py-5 text-left text-sm font-bold text-white uppercase tracking-wider">Adquirente</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Bruto</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Despesas MDR</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Líquido</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Despesas C/ antecipação</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Previsto</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Valor Depositado</th>
            <th class="px-8 py-5 text-center text-sm font-bold text-white uppercase tracking-wider">Observações</th>
            <th class="px-8 py-5 text-right text-sm font-bold text-white uppercase tracking-wider">Ação</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr
            v-for="(voucher, index) in linhasExibidas"
            :key="voucher.nome"
            class="hover:bg-blue-50 transition-colors duration-200 group"
          >
            <td class="px-8 py-5 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" :class="getAdquirenteColor(index)"></div>
                <span class="text-sm font-medium text-gray-900 group-hover:text-blue-700">{{ voucher.nome }}</span>
              </div>
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-gray-500">R$</span>
                <input
                  :value="voucher._bruto_input"
                  @input="onInputBruto(voucher, $event)"
                  @focus="onFocusBruto(voucher, $event)"
                  @blur="onBlurBruto(voucher)"
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
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-gray-500">R$</span>
                <input
                  :value="voucher._liquido_input"
                  @input="onInputLiquido(voucher, $event)"
                  @focus="onFocusLiquido(voucher, $event)"
                  @blur="onBlurLiquido(voucher)"
                  :disabled="!empresaSelecionada || voucher.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm font-bold text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  placeholder="0,00"
                />
              </div>
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs" :class="Number(voucher.despesa_antecipacao || 0) > 0 ? 'text-red-600' : 'text-gray-500'">R$</span>
                <input
                  :value="voucher._antecipacao_input"
                  @input="onInputAntecipacao(voucher, $event)"
                  @focus="onFocusAntecipacao(voucher, $event)"
                  @blur="onBlurAntecipacao(voucher)"
                  :disabled="!empresaSelecionada || voucher.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  :class="Number(voucher.despesa_antecipacao || 0) > 0 ? 'text-red-600 font-medium' : 'text-gray-600'"
                  placeholder="0,00"
                />
              </div>
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50/50 rounded-lg">
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-gray-500">R$</span>
                <input
                  :value="voucher._previsto_input"
                  @input="onInputPrevisto(voucher, $event)"
                  @focus="onFocusPrevisto(voucher, $event)"
                  @blur="onBlurPrevisto(voucher)"
                  :disabled="!empresaSelecionada || voucher.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm font-bold text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  placeholder="0,00"
                />
              </div>
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs" :class="Number(voucher.valor_depositado || 0) > 0 ? 'text-green-600' : 'text-gray-500'">R$</span>
                <input
                  :value="voucher._depositado_input"
                  @input="onInputDepositado(voucher, $event)"
                  @focus="onFocusDepositado(voucher, $event)"
                  @blur="onBlurDepositado(voucher)"
                  :disabled="!empresaSelecionada || voucher.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  :class="Number(voucher.valor_depositado || 0) > 0 ? 'text-green-600 font-medium' : 'text-gray-600'"
                  placeholder="0,00"
                />
              </div>
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-center text-sm font-medium">
              <button
                @click="openModal(voucher, index)"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                :class="voucher.observacoes ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
              >
                <span v-if="voucher.observacoes" class="truncate max-w-[150px]">{{ voucher.observacoes }}</span>
                <span v-else>Adicionar</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </td>

            <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="enviarRecebimento(voucher)"
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
        </tbody>
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-8 py-5 text-sm font-bold">TOTAL Vouchers</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_bruto) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesa_mdr) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_liquido) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesa_antecipacao) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_previsto) }}</td>
            <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.valor_depositado) }}</td>
            <td class="px-8 py-5 text-left text-sm font-bold"></td>
            <td class="px-8 py-5 text-left text-sm font-bold"></td>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRecebimentosVouchersManual } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'
import ObservacoesModal from './ObservacoesModal.vue'

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
  const normalized = raw.replace(/\s/g, '').replace(/[^0-9,.-]/g, '')
  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return 0
  return round2(parsed)
}

const { filtrosGlobais } = useGlobalFilters()
const filtroAtivo = ref(null)

const { vouchersData, loading, error, successMessage, carregar, calcularValores, enviarRecebimento } = useRecebimentosVouchersManual(filtroAtivo)
const { transacoes, buscarTransacoesBancarias } = useExtratoDetalhado()
const { detectarAdquirente } = useAdquirenteDetector()

const empresaSelecionada = computed(() => Boolean(filtrosGlobais.empresaSelecionada))

const normalizarChaveAdquirente = (texto) => {
  if (!texto) return ''
  return String(texto)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const mapearAdquirenteParaVoucher = (base) => {
  const chave = normalizarChaveAdquirente(base)
  const mapa = {
    'ALELO INSTITUICAO DE PAGAMENTO': 'ALELO',
    'RECEBIMENTO ALELO': 'ALELO',
    'TICKET SERVICOS SA': 'TICKET',
    'TICKET SERVICOS': 'TICKET',
    'VR BENEFICIOS': 'VR',
    'VR BENEF': 'VR',
    'PLUXEE': 'PLUXE',
    'PLUXEE BENEFICIOS BR': 'PLUXE',
    'PLUXE BENEFICIOS BR': 'PLUXE',
    'LE CARD ADMINISTRADORA': 'LE CARD',
    'LECARD': 'LE CARD',
    'UP BRASIL ADMINISTRACAO': 'UP BRASIL',
    'CABAL PRE': 'CABAL'
  }
  return mapa[chave] || String(base || '')
}

const parseValorExtrato = (transacao) => {
  const raw = transacao?.valorNumerico ?? transacao?.valor ?? 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  const input = String(raw).trim()
  if (!input) return 0

  const normalized = input.replace(/\s/g, '').replace(/[^0-9,.-]/g, '')
  if (!normalized) return 0

  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)

  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

const depositosVouchersMap = computed(() => {
  const map = {}
  ;(transacoes.value || []).forEach(t => {
    const valor = parseValorExtrato(t)
    if (!valor || valor <= 0) return

    const baseDetectado = t?.adquirente_detectado ? String(t.adquirente_detectado) : ''
    const det = (!baseDetectado) ? detectarAdquirente(t.descricao, t.banco) : null
    const base = baseDetectado || det?.base
    if (!base) return

    const nomeVoucher = mapearAdquirenteParaVoucher(base)
    const key = normalizarChaveAdquirente(nomeVoucher)
    if (!key) return

    map[key] = (map[key] || 0) + valor
  })
  return map
})

const aplicarDepositosNosVouchers = () => {
  const map = depositosVouchersMap.value || {}
  vouchersData.value.forEach(voucher => {
    if (!voucher) return
    if (voucher._editing_depositado) return
    const key = normalizarChaveAdquirente(voucher.nome)
    const valorExtrato = round2(map[key] || 0)
    if (valorExtrato <= 0) return

    const depositadoDb = round2(voucher._depositado_db || 0)
    if (depositadoDb > 0) return

    voucher.valor_depositado = valorExtrato
    voucher._depositado_input = formatBRLNumber(valorExtrato)
    voucher._depositado_db = valorExtrato
    calcularValores(voucher)
  })
}

const carregarTudo = async () => {
  await carregar()
  await buscarTransacoesBancarias({
    bancoSelecionado: 'TODOS',
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  })
  aplicarDepositosNosVouchers()
}

const linhasExibidas = computed(() => {
  if (!empresaSelecionada.value) return []
  return vouchersData.value.filter(v => v?._table_exists === true && Boolean(v?._table_name))
})

const totais = computed(() => {
  return linhasExibidas.value.reduce((acc, v) => {
    acc.valor_bruto += Number(v.valor_bruto || 0)
    acc.despesa_mdr += Number(v.despesa_mdr || 0)
    acc.valor_liquido += Number(v.valor_liquido || 0)
    acc.despesa_antecipacao += Number(v.despesa_antecipacao || 0)
    acc.valor_previsto += Number(v.valor_previsto || 0)
    acc.valor_depositado += Number(v.valor_depositado || 0)
    return acc
  }, { valor_bruto: 0, despesa_mdr: 0, valor_liquido: 0, despesa_antecipacao: 0, valor_previsto: 0, valor_depositado: 0 })
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const getAdquirenteColor = (index) => {
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-red-500','bg-indigo-500','bg-pink-500','bg-yellow-500']
  return colors[index % colors.length]
}

const onFocusBruto = (voucher, ev) => {
  voucher._editing_bruto = true
  ev?.target?.select?.()
}

const onInputBruto = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._bruto_input = v
  voucher.valor_bruto = parseBRL(v)
  calcularValores(voucher)
}

const onBlurBruto = (voucher) => {
  voucher._editing_bruto = false
  voucher._bruto_input = formatBRLNumber(voucher.valor_bruto)
  calcularValores(voucher)
}

const onFocusMdr = (voucher, ev) => {
  voucher._editing_mdr = true
  ev?.target?.select?.()
}

const onInputMdr = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._mdr_input = v
  voucher.despesa_mdr = parseBRL(v)
  calcularValores(voucher)
}

const onBlurMdr = (voucher) => {
  voucher._editing_mdr = false
  voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
  calcularValores(voucher)
}

const onFocusLiquido = (voucher, ev) => {
  voucher._editing_liquido = true
  ev?.target?.select?.()
}

const onInputLiquido = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._liquido_input = v
  voucher.valor_liquido = parseBRL(v)
  calcularValores(voucher)
}

const onBlurLiquido = (voucher) => {
  voucher._editing_liquido = false
  voucher._liquido_input = formatBRLNumber(voucher.valor_liquido)
  calcularValores(voucher)
}

const onFocusAntecipacao = (voucher, ev) => {
  voucher._editing_antecipacao = true
  ev?.target?.select?.()
}

const onInputAntecipacao = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._antecipacao_input = v
  voucher.despesa_antecipacao = parseBRL(v)
  calcularValores(voucher)
}

const onBlurAntecipacao = (voucher) => {
  voucher._editing_antecipacao = false
  voucher._antecipacao_input = formatBRLNumber(voucher.despesa_antecipacao)
  calcularValores(voucher)
}

const onFocusPrevisto = (voucher, ev) => {
  voucher._editing_previsto = true
  ev?.target?.select?.()
}

const onInputPrevisto = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._previsto_input = v
  voucher.valor_previsto = parseBRL(v)
  calcularValores(voucher)
}

const onBlurPrevisto = (voucher) => {
  voucher._editing_previsto = false
  voucher._previsto_input = formatBRLNumber(voucher.valor_previsto)
  calcularValores(voucher)
}

const onFocusDepositado = (voucher, ev) => {
  voucher._editing_depositado = true
  ev?.target?.select?.()
}

const onInputDepositado = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._depositado_input = v
  voucher.valor_depositado = parseBRL(v)
  calcularValores(voucher)
}

const onBlurDepositado = (voucher) => {
  voucher._editing_depositado = false
  voucher._depositado_input = formatBRLNumber(voucher.valor_depositado)
  calcularValores(voucher)
}

const temAlteracao = (voucher) => {
  return [
    voucher._delta_bruto,
    voucher._delta_mdr,
    voucher._delta_liquido,
    voucher._delta_antecipacao,
    voucher._delta_previsto,
    voucher._delta_depositado
  ].some(v => Number(v || 0) !== 0)
}

const isModalOpen = ref(false)
const currentObservation = ref('')
const activeVoucher = ref(null)

const openModal = (voucher, index) => {
  currentObservation.value = voucher.observacoes || ''
  activeVoucher.value = voucher
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  currentObservation.value = ''
  activeVoucher.value = null
}

const saveObservation = (newObservation) => {
  if (activeVoucher.value) {
    activeVoucher.value.observacoes = newObservation
  }
  closeModal()
}

onMounted(async () => {
  if (empresaSelecionada.value) {
    await carregarTudo()
  }
})

watch(
  () => [filtrosGlobais.empresaSelecionada, filtrosGlobais.dataInicial, filtrosGlobais.dataFinal],
  async () => {
    if (empresaSelecionada.value) {
      await carregarTudo()
    }
  }
)
</script>
