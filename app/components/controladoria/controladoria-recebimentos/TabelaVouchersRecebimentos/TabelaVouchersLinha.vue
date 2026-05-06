<template>
  <tr class="hover:bg-blue-50 transition-colors duration-200 group">
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
          @input="handlers.onInputBruto(voucher, $event)"
          @focus="handlers.onFocusBruto(voucher, $event)"
          @blur="handlers.onBlurBruto(voucher)"
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
          @input="handlers.onInputMdr(voucher, $event)"
          @focus="handlers.onFocusMdr(voucher, $event)"
          @blur="handlers.onBlurMdr(voucher)"
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
          @input="handlers.onInputLiquido(voucher, $event)"
          @focus="handlers.onFocusLiquido(voucher, $event)"
          @blur="handlers.onBlurLiquido(voucher)"
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
          @input="handlers.onInputAntecipacao(voucher, $event)"
          @focus="handlers.onFocusAntecipacao(voucher, $event)"
          @blur="handlers.onBlurAntecipacao(voucher)"
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
          @input="handlers.onInputPrevisto(voucher, $event)"
          @focus="handlers.onFocusPrevisto(voucher, $event)"
          @blur="handlers.onBlurPrevisto(voucher)"
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
          @input="handlers.onInputDepositado(voucher, $event)"
          @focus="handlers.onFocusDepositado(voucher, $event)"
          @blur="handlers.onBlurDepositado(voucher)"
          :disabled="!empresaSelecionada || voucher.status === 'sending'"
          class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
          :class="Number(voucher.valor_depositado || 0) > 0 ? 'text-green-600 font-medium' : 'text-gray-600'"
          placeholder="0,00"
        />
      </div>
    </td>

    <td class="px-8 py-5 text-center text-sm font-medium">
      <button
        @click="handlers.openModal(voucher, index)"
        class="pdf-observacao-btn inline-flex w-full items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
        :class="voucher.observacoes ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
        :title="voucher.observacoes || 'Adicionar descrição'"
      >
        <span v-if="voucher.observacoes" class="whitespace-normal break-words leading-snug text-left">{{ voucher.observacoes }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </td>

    <td class="col-acoes-pdf px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
      <button
        @click="handlers.enviarRecebimento(voucher)"
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
</template>

<script setup>
defineProps({
  voucher: {
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
  handlers: {
    type: Object,
    required: true
  },
  getAdquirenteColor: {
    type: Function,
    required: true
  },
  temAlteracao: {
    type: Function,
    required: true
  }
})
</script>
