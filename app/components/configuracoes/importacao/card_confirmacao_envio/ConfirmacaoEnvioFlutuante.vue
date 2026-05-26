<template>
  <div v-if="open" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
    <button
      type="button"
      class="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      aria-label="Fechar confirmação de envio"
      @click="$emit('cancel')"
    />

    <div class="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div class="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{{ etapaLabel }}</p>
            <h3 class="mt-1 text-lg font-bold text-slate-900">{{ titulo }}</h3>
            <p class="mt-1 text-sm text-slate-600">{{ subtitulo }}</p>
          </div>
          <button
            type="button"
            class="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
            @click="$emit('cancel')"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="space-y-4 px-6 py-5">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Empresa</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">{{ empresa || '-' }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">EC</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">{{ ec || '-' }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo Unidade</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">{{ tipoUnidade || '-' }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Adquirente</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">{{ adquirente || '-' }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Registros</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">{{ totalRegistros }}</p>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Tabela de destino</p>
              <p class="mt-1 break-all font-mono text-sm text-slate-900">{{ nomeTabela || '-' }}</p>
            </div>
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              :class="statusTabelaClass"
            >
              {{ statusTabelaLabel }}
            </span>
          </div>
          <p v-if="erroTabela" class="mt-2 text-sm text-red-600">{{ erroTabela }}</p>
        </div>
      </div>

      <div class="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <button
          type="button"
          class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          :disabled="loading"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
        <ConfirmacaoEnvioActionButton
          :loading="loading"
          :disabled="desabilitarEnvio"
          label="Enviar"
          loading-label="Enviando..."
          @click="$emit('confirm')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ConfirmacaoEnvioActionButton from './ConfirmacaoEnvioActionButton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  tipo: { type: String, default: 'vendas' },
  empresa: { type: String, default: '' },
  ec: { type: String, default: '' },
  tipoUnidade: { type: String, default: '' },
  adquirente: { type: String, default: '' },
  totalRegistros: { type: Number, default: 0 },
  nomeTabela: { type: String, default: '' },
  tabelaExiste: { type: Boolean, default: false },
  verificandoTabela: { type: Boolean, default: false },
  erroTabela: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

defineEmits(['cancel', 'confirm'])

const etapaLabel = computed(() => props.tipo === 'recebimentos' ? 'Confirmar Recebimentos' : 'Confirmar Vendas')
const titulo = computed(() => props.tipo === 'recebimentos' ? 'Confirmação final do envio de recebimentos' : 'Confirmação final do envio de vendas')
const subtitulo = computed(() => 'Confira os dados abaixo antes de enviar ao Supabase.')

const statusTabelaLabel = computed(() => {
  if (props.verificandoTabela) return 'Verificando tabela...'
  if (props.tabelaExiste) return 'Tabela encontrada'
  if (props.erroTabela) return 'Falha na verificação'
  return 'Tabela não encontrada'
})

const statusTabelaClass = computed(() => {
  if (props.verificandoTabela) return 'bg-amber-100 text-amber-700'
  if (props.tabelaExiste) return 'bg-emerald-100 text-emerald-700'
  return 'bg-red-100 text-red-700'
})

const desabilitarEnvio = computed(() => {
  return props.verificandoTabela || !props.tabelaExiste
})
</script>
