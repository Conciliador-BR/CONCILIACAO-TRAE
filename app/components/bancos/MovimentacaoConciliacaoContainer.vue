<template>
  <div v-if="movimentacao" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" @click="$emit('close')"></div>
    <div class="relative w-full max-w-6xl rounded-[28px] border border-[#DCE7F3] bg-white p-5 text-slate-900 shadow-2xl">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="text-sm font-bold text-[#102A43] uppercase tracking-wide">
          Conciliação da Movimentação
        </h3>
        <p class="mt-1 text-sm text-slate-500">
          {{ movimentacao.data }} | {{ movimentacao.adquirente }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="statusClass(movimentacao.status)">
          {{ formatarStatus(movimentacao.status) }}
        </span>
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          @click="$emit('close')"
        >
          Fechar
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
        <p class="text-xs uppercase text-slate-500">Previsto</p>
        <p class="text-lg font-bold text-emerald-700">{{ formatarMoeda(movimentacao.previsto) }}</p>
      </div>
      <div class="rounded-xl border border-rose-100 bg-rose-50 p-3">
        <p class="text-xs uppercase text-slate-500">Débitos c/ Antecipação</p>
        <p class="text-lg font-bold text-rose-700">{{ formatarMoeda(movimentacao.debitosAntecipacao) }}</p>
      </div>
      <div class="rounded-xl border border-rose-100 bg-rose-50 p-3">
        <p class="text-xs uppercase text-slate-500">Débitos</p>
        <p class="text-lg font-bold text-rose-700">{{ formatarMoeda(movimentacao.debitos) }}</p>
      </div>
      <div class="rounded-xl border border-sky-100 bg-sky-50 p-3">
        <p class="text-xs uppercase text-slate-500">Valores Encontrados no Banco</p>
        <p class="text-lg font-bold text-sky-700">{{ formatarMoeda(movimentacao.deposito) }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p class="text-xs uppercase text-slate-500">Saldo</p>
        <p class="text-lg font-bold" :class="Number(movimentacao.saldoConciliacao || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'">
          {{ formatarMoeda(movimentacao.saldoConciliacao) }}
        </p>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div class="rounded-xl border border-[#DCE7F3] bg-white p-3">
        <h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Previsto por Bandeira
        </h4>
        <div v-if="previstosPorBandeira.length > 0" class="space-y-1">
          <div
            v-for="item in previstosPorBandeira"
            :key="item.bandeira"
            class="flex items-center justify-between border-b border-slate-100 pb-1 text-sm"
          >
            <span class="truncate pr-2 text-slate-700">{{ item.bandeira }}</span>
            <span class="font-semibold text-emerald-700">{{ formatarMoeda(item.valor) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-amber-300">
          Nenhum previsto por bandeira encontrado.
        </p>
      </div>

      <div class="rounded-xl border border-[#DCE7F3] bg-white p-3">
        <h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Lançamentos Encontrados no Banco
        </h4>
        <div v-if="lancamentosFormatados.length > 0" class="max-h-[58vh] overflow-auto space-y-2">
          <div
            v-for="(l, idx) in lancamentosFormatados"
            :key="`${idx}-${l.descricao}`"
            class="rounded-lg border border-slate-100 bg-slate-50 p-2"
          >
            <p class="text-xs text-slate-500">{{ l.data }}</p>
            <p class="truncate text-sm text-slate-700" :title="l.descricao">{{ l.descricao }}</p>
            <p class="mt-1 text-sm font-semibold" :class="l.valor >= 0 ? 'text-sky-700' : 'text-rose-700'">
              {{ formatarMoeda(l.valor) }}
            </p>
          </div>
        </div>
        <p v-else class="text-sm text-amber-300">
          Nenhum lançamento bancário encontrado para esta linha.
        </p>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineEmits(['close'])

const props = defineProps({
  movimentacao: {
    type: Object,
    default: null
  }
})

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor) || 0)
}

const formatarStatus = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'consistente' || s === 'conciliado') return 'Conciliado'
  if (s === 'inconsistente' || s === 'divergente') return 'Divergente'
  return 'Pendente'
}

const statusClass = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'consistente' || s === 'conciliado') return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
  if (s === 'inconsistente' || s === 'divergente') return 'border border-rose-200 bg-rose-50 text-rose-700'
  return 'border border-amber-200 bg-amber-50 text-amber-700'
}

const previstosPorBandeira = computed(() => {
  const mapa = props.movimentacao?.previstoPorBandeira || {}
  return Object.entries(mapa)
    .map(([bandeira, valor]) => ({ bandeira, valor: Number(valor) || 0 }))
    .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
})

const formatarData = (valor) => {
  if (!valor) return '-'
  const str = String(valor)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y}`
  }
  return str
}

const lancamentosFormatados = computed(() => {
  const lista = props.movimentacao?.lancamentosBanco || []
  return lista.map((l) => ({
    data: formatarData(l?.data_formatada || l?.data),
    descricao: String(l?.descricao || 'Sem descrição'),
    valor: Number(l?.valorNumerico ?? l?.valor ?? 0) || 0
  }))
})
</script>
