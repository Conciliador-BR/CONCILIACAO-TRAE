<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 mt-6 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">PIX (Recebimentos)</h2>
        <p class="text-sm text-gray-600 mt-1">
          Tabela manual de recebimentos PIX
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
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">PIX</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas MDR</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Bruto</th>
            <th class="px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Líquido</th>
            <th class="col-acoes-pdf px-6 py-5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Adicionar Linha</th>
            <th class="col-acoes-pdf px-6 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Ação</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr
            v-for="(linha, index) in linhasExibidas"
            :key="linha._row_key"
            class="hover:bg-blue-50 transition-colors duration-200 group"
          >
            <td class="px-6 py-5 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" :class="getAdquirenteColor(index)"></div>
                <input
                  v-model="linha.nome"
                  :disabled="!empresaSelecionada || linha.status === 'sending'"
                  class="w-48 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                  placeholder="Nome da adquirente"
                />
              </div>
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

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
              {{ formatCurrency(linha.valor_bruto) }}
            </td>

            <td class="px-6 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
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
        </tbody>
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-6 py-5 text-sm font-bold">TOTAL PIX</td>
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
import { usePixRecebimentosManual } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_pix_recebimentos/usePixRecebimentosManual'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
const emit = defineEmits(['totais-change'])

const { filtrosGlobais } = useGlobalFilters()
const filtroAtivo = ref(null)

const {
  pixData,
  loading,
  error,
  successMessage,
  parseBRL,
  recalcularLinha,
  adicionarLinha,
  removerLinha,
  fetchPixRecebimentos,
  enviarLinha
} = usePixRecebimentosManual(filtroAtivo)

const empresaSelecionada = computed(() => Boolean(filtrosGlobais.empresaSelecionada))

const linhasExibidas = computed(() => {
  if (!empresaSelecionada.value) return []
  return pixData.value
})

const totais = computed(() => {
  return linhasExibidas.value.reduce((acc, linha) => {
    acc.debito += Number(linha.debito || 0)
    acc.credito += Number(linha.credito || 0)
    acc.pix += Number(linha.pix || 0)
    acc.despesa_mdr += Number(linha.despesa_mdr || 0)
    acc.valor_bruto += Number(linha.valor_bruto || 0)
    acc.valor_liquido += Number(linha.valor_liquido || 0)
    return acc
  }, {
    debito: 0,
    credito: 0,
    pix: 0,
    despesa_mdr: 0,
    valor_bruto: 0,
    valor_liquido: 0
  })
})

watch(
  totais,
  (novosTotais) => {
    emit('totais-change', {
      valor_bruto: Number(novosTotais?.valor_bruto || 0),
      despesa_mdr: Number(novosTotais?.despesa_mdr || 0),
      valor_liquido: Number(novosTotais?.valor_liquido || 0)
    })
  },
  { immediate: true, deep: true }
)

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
    fetchPixRecebimentos()
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
  return Boolean(nomeAtual) && (mudouNome || mudouBruto || mudouMdr)
}

const enviarLinhaAtual = async (linha) => {
  await enviarLinha(linha)
}

const removerLinhaAtual = async (linha) => {
  await removerLinha(linha)
}

watch(
  () => [filtrosGlobais.empresaSelecionada, filtrosGlobais.dataInicial, filtrosGlobais.dataFinal],
  () => {
    if (empresaSelecionada.value) {
      fetchPixRecebimentos()
    }
  },
  { immediate: true }
)
</script>
