<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">{{ tituloExibicao }}</h2>
          <p class="mt-1 text-sm text-gray-600">
            {{ subtitle }}
            <span v-if="!empresaSelecionada" class="ml-2 text-xs font-medium text-amber-600">
              (Selecione uma empresa)
            </span>
          </p>
        </div>

        <div class="flex flex-col gap-3 md:flex-row md:items-end">
          <div class="min-w-[260px]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Nome da adquirente
            </label>
            <input
              :value="nomeAdquirente"
              :disabled="loading"
              class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
              placeholder="Ex: REDE"
              @input="$emit('update:nome-adquirente', $event?.target?.value ?? '')"
            />
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!empresaSelecionada || loading"
            @click="$emit('reload')"
          >
            {{ loading ? 'Carregando...' : 'Atualizar' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
      {{ error }}
    </div>
    <div v-if="successMessage" class="border-b border-green-100 bg-green-50 px-6 py-3 text-sm text-green-700">
      {{ successMessage }}
    </div>

    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Bandeira</th>
            <th
              v-for="coluna in colunasEditaveis"
              :key="coluna.chave"
              class="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700"
            >
              {{ coluna.label }}
            </th>
            <th class="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">Valor Bruto</th>
            <th class="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">Valor Liquido</th>
            <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">Acao</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
          <ManualAutorizadaLinha
            v-for="(linha, index) in linhas"
            :key="linha.bandeira"
            :linha="linha"
            :index="index"
            :empresa-selecionada="empresaSelecionada"
            :loading="loading"
            :atualizar-input="atualizarInput"
            :focar-input="focarInput"
            :blur-input="blurInput"
            :tem-alteracao="temAlteracao"
            @send="$emit('send-row', linha)"
          />
        </tbody>
        <tfoot class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr class="font-bold">
            <td class="px-6 py-4 text-sm">TOTAL Autorizada</td>
            <td class="px-4 py-4 text-right text-sm">{{ formatCurrency(totais.debito) }}</td>
            <td class="px-4 py-4 text-right text-sm">{{ formatCurrency(totais.credito) }}</td>
            <td class="px-4 py-4 text-right text-sm">{{ formatCurrency(totais.credito2x) }}</td>
            <td class="px-4 py-4 text-right text-sm">{{ formatCurrency(totais.credito3x) }}</td>
            <td class="px-4 py-4 text-right text-sm">{{ formatCurrency(totais.voucher) }}</td>
            <td class="px-4 py-4 text-right text-sm">{{ formatCurrency(totais.despesa_mdr) }}</td>
            <td class="px-4 py-4 text-right text-sm bg-white/20">{{ formatCurrency(totais.valor_bruto) }}</td>
            <td class="px-4 py-4 text-right text-sm bg-white/20">{{ formatCurrency(totais.valor_liquido) }}</td>
            <td class="px-6 py-4"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ManualAutorizadaLinha from './ManualAutorizadaLinha.vue'
import { AUTORIZADA_MANUAL_COLUNAS_EDITAVEIS as colunasEditaveis } from '~/composables/PageControladoria/controladoria-recebimentos/adquirente_manual_recebimentos/constants'

const props = defineProps({
  title: {
    type: String,
    default: 'Autorizada Manual'
  },
  subtitle: {
    type: String,
    default: 'Lancamentos manuais por bandeira'
  },
  nomeAdquirente: {
    type: String,
    default: ''
  },
  empresaSelecionada: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  successMessage: {
    type: String,
    default: ''
  },
  linhas: {
    type: Array,
    default: () => []
  },
  totais: {
    type: Object,
    default: () => ({})
  },
  atualizarInput: {
    type: Function,
    required: true
  },
  focarInput: {
    type: Function,
    required: true
  },
  blurInput: {
    type: Function,
    required: true
  },
  temAlteracao: {
    type: Function,
    required: true
  }
})

defineEmits(['update:nome-adquirente', 'reload', 'send-row'])

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(Number(value || 0))

const tituloExibicao = computed(() => String(props.nomeAdquirente || '').trim() || props.title)
</script>
