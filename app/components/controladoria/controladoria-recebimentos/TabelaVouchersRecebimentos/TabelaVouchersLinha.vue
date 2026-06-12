<template>
  <tbody class="bg-white divide-y divide-gray-100">
    <tr class="hover:bg-blue-50 transition-colors duration-200 group">
    <td class="px-8 py-5">
      <div class="flex items-center">
        <button
          @click="handlers.toggleEditor(voucher, index)"
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

    <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
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

    <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
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

    <td class="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
      <div class="relative inline-block">
        <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-gray-500">R$</span>
        <input
          :value="voucher._pgto_banco_input"
          @input="handlers.onInputPgtoBanco(voucher, $event)"
          @focus="handlers.onFocusPgtoBanco(voucher, $event)"
          @blur="handlers.onBlurPgtoBanco(voucher)"
          :disabled="!empresaSelecionada || voucher.status === 'sending'"
          class="w-32 rounded-md border border-gray-200 bg-white pl-8 pr-2 py-1 text-right text-sm font-bold shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
          :class="Number(voucher.pgto_banco || 0) < 0 ? 'text-red-600' : 'text-emerald-700'"
          placeholder="0,00"
        />
      </div>
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

    <tr v-if="activeObservationIndex === index || temObservacao(voucher)" class="bg-slate-50/80">
      <td :colspan="8" class="px-8 pb-5 pt-0">
        <div v-if="activeObservationIndex === index" class="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Observacao de {{ voucher.nome }}
            </p>
            <textarea
              :value="currentObservation"
              @input="handlers.setCurrentObservation($event?.target?.value ?? '')"
              rows="3"
              class="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Digite a observacao para este voucher..."
            ></textarea>
            <div class="mt-3 flex items-center justify-end gap-2">
              <button
                @click="handlers.closeEditor"
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                @click="handlers.saveObservationLocally(voucher, index)"
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
  },
  activeObservationIndex: {
    type: Number,
    default: -1
  },
  currentObservation: {
    type: String,
    default: ''
  }
})

const temObservacao = (voucher) => Boolean(String(voucher?.observacoes || '').trim())
</script>
