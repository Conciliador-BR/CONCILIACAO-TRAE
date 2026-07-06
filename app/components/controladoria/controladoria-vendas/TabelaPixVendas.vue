<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 mt-6 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">PIX</h2>
        <p class="text-sm text-gray-600 mt-1">
          Tabela manual de vendas PIX
          <span v-if="!empresaSelecionada" class="text-amber-600 font-medium ml-2 text-xs">
            (Selecione uma empresa)
          </span>
        </p>
      </div>
      <button
        @click="carregarLinhas"
        class="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
        :disabled="!empresaSelecionada || loading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Atualizar Linhas
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
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th class="px-6 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Adquirente</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Débito</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito 3x</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Crédito 4x-6x</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">PIX</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas MDR</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Bruto</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Líquido</th>
            <th class="col-acoes-pdf px-6 py-5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Adicionar Linha</th>
            <th class="col-acoes-pdf px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Ação</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <template v-for="(linha, index) in linhasExibidas" :key="linha._row_key">
          <tr
            class="hover:bg-blue-50 transition-colors duration-200 group"
          >
            <td class="px-6 py-5 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full shrink-0" :class="getAdquirenteColor(index)"></div>
                <input
                  v-model="linha.nome"
                  :disabled="!empresaSelecionada || linha.status === 'sending'"
                  class="w-40 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  placeholder="Nome da adquirente"
                />
                <button
                  @click="toggleEditor(linha, index)"
                  type="button"
                  class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                  :class="activeObservationIndex === index || temObservacao(linha) ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
                  :title="temObservacao(linha) ? 'Ver observacao' : 'Adicionar observacao'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <span
                  v-if="temObservacao(linha)"
                  class="ml-2 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"
                  title="Linha com observacao"
                >
                </span>
              </div>
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
              <span class="text-gray-400">{{ formatCurrency(0) }}</span>
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-gray-500">R$</span>
                <input
                  :value="linha._pix_input"
                  @input="onInputPix(linha, $event)"
                  @focus="onFocusPix(linha, $event)"
                  @blur="onBlurPix(linha)"
                  :disabled="!empresaSelecionada || linha.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm text-indigo-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  placeholder="0,00"
                />
              </div>
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
              <div class="relative inline-block">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs" :class="Number(linha.despesa_mdr || 0) > 0 ? 'text-red-600' : 'text-gray-500'">R$</span>
                <input
                  :value="linha._mdr_input"
                  @input="onInputMdr(linha, $event)"
                  @focus="onFocusMdr(linha, $event)"
                  @blur="onBlurMdr(linha)"
                  :disabled="!empresaSelecionada || linha.status === 'sending'"
                  class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  :class="Number(linha.despesa_mdr || 0) > 0 ? 'text-red-600 font-medium' : 'text-gray-600'"
                  placeholder="0,00"
                />
              </div>
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50/50 rounded-lg">
              {{ formatCurrency(linha.valor_bruto) }}
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50/50 rounded-lg">
              {{ formatCurrency(linha.valor_liquido) }}
            </td>

            <td class="col-acoes-pdf px-6 py-5 whitespace-nowrap text-center">
              <div class="inline-flex items-center gap-2">
                <button
                  @click="adicionarLinha(index)"
                  :disabled="!empresaSelecionada || loading"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <button
                  @click="removerLinhaAtual(linha)"
                  :disabled="!empresaSelecionada || loading"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
              </div>
            </td>

            <td class="col-acoes-pdf px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="enviarLinhaAtual(linha)"
                :disabled="!empresaSelecionada || !linhaTemAlteracoes(linha) || linha.status === 'sending'"
                class="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                :class="{
                  'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600': linha.status !== 'success' && linha.status !== 'error',
                  'bg-green-600 hover:bg-green-500': linha.status === 'success',
                  'bg-red-600 hover:bg-red-500': linha.status === 'error'
                }"
              >
                <svg v-if="linha.status === 'sending'" class="animate-spin -ml-0.5 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span v-if="linha.status === 'pending' || linha.status === 'sending'">Enviar</span>
                <span v-else-if="linha.status === 'success'">OK</span>
                <span v-else>Erro</span>
              </button>
            </td>
          </tr>
          <tr v-if="activeObservationIndex === index || temObservacao(linha)" class="bg-slate-50/80">
            <td :colspan="11" class="px-6 pb-5 pt-0">
              <div v-if="activeObservationIndex === index" class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Observacao de {{ linha.nome || 'PIX' }}
                  </p>
                  <textarea
                    :value="currentObservation"
                    @input="setCurrentObservation($event?.target?.value ?? '')"
                    rows="3"
                    class="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Digite a observacao para esta linha..."
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
                      @click="saveObservationLocally(linha, index)"
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
                      {{ linha.observacoes }}
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
            <td class="px-6 py-5 text-sm font-bold">TOTAL PIX</td>
            <td class="px-6 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-6 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-6 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-6 py-5 text-right text-sm font-bold">{{ formatCurrency(0) }}</td>
            <td class="px-6 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.pix) }}</td>
            <td class="px-6 py-5 text-right text-sm font-bold">{{ formatCurrency(totais.despesa_mdr) }}</td>
            <td class="px-6 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_bruto) }}</td>
            <td class="px-6 py-5 text-right text-sm font-bold bg-white/20 rounded-lg">{{ formatCurrency(totais.valor_liquido) }}</td>
            <td class="col-acoes-pdf px-6 py-5"></td>
            <td class="col-acoes-pdf px-6 py-5"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { usePixVendasManual } from '~/composables/PageControladoria/controladoria-vendas/tabela_pix_vendas/usePixVendasManual'
import { useVendas } from '~/composables/useVendas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

const { filtroAtivo } = useVendas()
const { filtrosGlobais } = useGlobalFilters()
const { pixData, loading, error, successMessage, parseBRL, recalcularLinha, adicionarLinha, removerLinha, fetchPixVendas, enviarLinha } = usePixVendasManual(filtroAtivo)

const empresaSelecionada = computed(() => Boolean(filtroAtivo.value?.empresa) || Boolean(filtrosGlobais.empresaSelecionada))

const linhasExibidas = computed(() => {
  if (!empresaSelecionada.value) return []
  return pixData.value
})

const totais = computed(() => {
  return linhasExibidas.value.reduce((acc, linha) => {
    acc.debito += Number(linha.debito || 0)
    acc.credito += Number(linha.credito || 0)
    acc.credito3x += Number(linha.credito3x || 0)
    acc.credito4x6x += Number(linha.credito4x6x || 0)
    acc.pix += Number(linha.pix || 0)
    acc.despesa_mdr += Number(linha.despesa_mdr || 0)
    acc.valor_bruto += Number(linha.valor_bruto || 0)
    acc.valor_liquido += Number(linha.valor_liquido || 0)
    return acc
  }, {
    debito: 0,
    credito: 0,
    credito3x: 0,
    credito4x6x: 0,
    pix: 0,
    despesa_mdr: 0,
    valor_bruto: 0,
    valor_liquido: 0
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

const carregarLinhas = () => {
  if (empresaSelecionada.value) {
    fetchPixVendas()
  }
}

const onInputPix = (linha, event) => {
  const raw = String(event?.target?.value ?? '')
  linha._pix_input = raw
  linha.pix = parseBRL(raw)
  recalcularLinha(linha)
}

const onFocusPix = (linha, event) => {
  linha._editing_pix = true
  event?.target?.select?.()
}

const onBlurPix = (linha) => {
  linha._editing_pix = false
  recalcularLinha(linha)
}

const onInputMdr = (linha, event) => {
  const raw = String(event?.target?.value ?? '')
  linha._mdr_input = raw
  linha.despesa_mdr = parseBRL(raw)
  recalcularLinha(linha)
}

const onFocusMdr = (linha, event) => {
  linha._editing_mdr = true
  event?.target?.select?.()
}

const onBlurMdr = (linha) => {
  linha._editing_mdr = false
  recalcularLinha(linha)
}

const linhaTemAlteracoes = (linha) => {
  const nomeAtual = String(linha.nome || '').trim()
  const nomeOriginal = String(linha._nome_db || '').trim()
  const mudouNome = nomeAtual !== nomeOriginal
  const mudouBruto = Number(linha._delta_bruto || 0) !== 0
  const mudouMdr = Number(linha._delta_mdr || 0) !== 0
  const observacaoAtual = String(linha.observacoes || '').trim()
  const observacaoOriginal = String(linha._observacoes_db || '').trim()
  const mudouObservacao = observacaoAtual !== observacaoOriginal
  return Boolean(nomeAtual) && (mudouNome || mudouBruto || mudouMdr || mudouObservacao)
}

const enviarLinhaAtual = async (linha) => {
  await enviarLinha(linha)
}

const removerLinhaAtual = async (linha) => {
  await removerLinha(linha)
}

const activeObservationIndex = ref(-1)
const currentObservation = ref('')

const toggleEditor = (linha, index) => {
  if (activeObservationIndex.value === index) {
    closeEditor()
    return
  }
  currentObservation.value = linha?.observacoes || ''
  activeObservationIndex.value = index
}

const closeModal = () => {
  activeObservationIndex.value = -1
  currentObservation.value = ''
}

const closeEditor = () => {
  closeModal()
}

const saveObservationLocally = (linha, index) => {
  if (activeObservationIndex.value !== index || !linha) return
  linha.observacoes = currentObservation.value
  closeEditor()
}

const setCurrentObservation = (value) => {
  currentObservation.value = String(value || '')
}

const temObservacao = (linha) => {
  return Boolean(String(linha?.observacoes || '').trim())
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
      fetchPixVendas()
    }
  },
  { immediate: true }
)
</script>
