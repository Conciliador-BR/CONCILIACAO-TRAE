<template>
  <tr class="group transition hover:bg-blue-50">
    <td class="px-6 py-4 text-sm font-semibold text-gray-900">
      <div class="flex items-center gap-3">
        <span class="h-3 w-3 rounded-full" :class="dotColor"></span>
        <span>{{ linha.bandeira }}</span>
      </div>
    </td>

    <td
      v-for="coluna in colunasEditaveis"
      :key="coluna.chave"
      class="px-4 py-4 text-right text-sm"
    >
      <div class="relative inline-block">
        <span
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs"
          :class="coluna.chave === 'despesa_mdr' && Number(linha[coluna.chave] || 0) !== 0 ? 'text-red-600' : 'text-gray-500'"
        >
          R$
        </span>
        <input
          :value="linha[`_${coluna.chave}_input`]"
          :disabled="!empresaSelecionada || loading || campoBloqueado(coluna.chave)"
          inputmode="decimal"
          class="w-36 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          :class="[
            coluna.chave === 'despesa_mdr' && Number(linha[coluna.chave] || 0) !== 0 ? 'font-medium text-red-600' : 'text-gray-700',
            campoBloqueado(coluna.chave) ? 'cursor-not-allowed border-gray-100' : ''
          ]"
          placeholder="0,00"
          @input="atualizarInput(linha, coluna.chave, $event)"
          @focus="focarInput(linha, $event)"
          @blur="blurInput(linha, coluna.chave)"
        />
      </div>
    </td>

    <td class="px-4 py-4 text-right text-sm font-semibold text-gray-900">
      {{ formatCurrency(linha.valor_bruto) }}
    </td>
    <td class="px-4 py-4 text-right text-sm font-semibold text-gray-900">
      {{ formatCurrency(linha.valor_liquido) }}
    </td>
    <td class="px-6 py-4 text-right text-sm">
      <button
        type="button"
        class="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        :class="{
          'bg-indigo-600 hover:bg-indigo-500': linha.status !== 'success' && linha.status !== 'error',
          'bg-green-600 hover:bg-green-500': linha.status === 'success',
          'bg-red-600 hover:bg-red-500': linha.status === 'error'
        }"
        :disabled="!empresaSelecionada || loading || !temAlteracao(linha)"
        @click="$emit('send', linha)"
      >
        <span v-if="linha.status === 'sending'">Enviando...</span>
        <span v-else-if="linha.status === 'success'">OK</span>
        <span v-else-if="linha.status === 'error'">Erro</span>
        <span v-else>Enviar</span>
      </button>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import {
  AUTORIZADA_MANUAL_COLUNAS_EDITAVEIS as colunasEditaveis,
  bandeiraAceitaCampoAutorizada
} from '~/composables/PageControladoria/controladoria-vendas/adquirente_manual_vendas/constants'

const props = defineProps({
  linha: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  empresaSelecionada: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
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

defineEmits(['send'])

const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500']

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(Number(value || 0))

const dotColor = computed(() => colors[Number(props.index) % colors.length])
const campoBloqueado = (campo) => !bandeiraAceitaCampoAutorizada(props.linha?.bandeira, campo)
</script>
