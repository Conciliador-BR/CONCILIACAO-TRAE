<template>
  <div class="analise-recebimentos-print-header relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 shadow-xl">
    <div class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-blue-200/30 blur-3xl"></div>

    <div class="relative flex flex-col gap-6">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-sm font-bold text-white shadow-sm">AR</span>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Analise de Recebimentos</h1>
              <p class="mt-1 text-sm text-gray-600">Visao gerencial por adquirente, bandeira, modalidade, deposito e periodo</p>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
              Periodo: {{ periodo }}
            </span>
            <span class="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
              Melhor adquirente: {{ melhorAdquirente?.nome || 'N/A' }}
            </span>
          </div>
        </div>

        <div class="flex flex-col items-stretch gap-4 xl:items-end">
          <div class="flex justify-start xl:justify-end">
            <AnaliseDeRecebimentosExportPdf />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-green-600 bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-4 text-white shadow-md">
            <p class="text-xs uppercase tracking-wide text-white/80">Liquido</p>
            <p class="mt-2 text-lg font-bold">{{ formatCurrency(resumo.valorLiquido) }}</p>
            <p class="mt-1 text-xs text-white/80">Recebido no periodo</p>
          </div>
          <div class="rounded-xl border border-blue-600 bg-gradient-to-br from-blue-500 to-sky-600 px-4 py-4 text-white shadow-md">
            <p class="text-xs uppercase tracking-wide text-white/80">Previsto</p>
            <p class="mt-2 text-lg font-bold">{{ formatCurrency(resumo.valorPrevisto) }}</p>
            <p class="mt-1 text-xs text-white/80">Total esperado no periodo</p>
          </div>
          <div class="rounded-xl border border-amber-600 bg-gradient-to-br from-amber-500 to-orange-600 px-4 py-4 text-white shadow-md">
            <p class="text-xs uppercase tracking-wide text-white/80">Despesas</p>
            <p class="mt-2 text-lg font-bold">{{ formatCurrency(resumo.despesaTotal) }}</p>
            <p class="mt-1 text-xs text-white/80">Custo consolidado do periodo</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AnaliseDeRecebimentosExportPdf from '~/components/controladoria/exportacao_pdf/analise_de_recebimentos/AnaliseDeRecebimentosExportPdf.vue'

const props = defineProps({
  periodo: {
    type: String,
    default: 'Sem periodo selecionado'
  },
  melhorAdquirente: {
    type: Object,
    default: null
  },
  resumo: {
    type: Object,
    default: () => ({
      valorLiquido: 0,
      valorPrevisto: 0,
      despesaTotal: 0
    })
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}
</script>
