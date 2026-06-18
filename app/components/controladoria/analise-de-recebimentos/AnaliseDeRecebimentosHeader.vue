<template>
  <div class="analise-recebimentos-print-header relative overflow-hidden rounded-2xl border border-[#8bb5de]/35 bg-gradient-to-br from-[#102a43]/8 via-[#163a5a]/4 to-[#1f4f77]/8 p-6 shadow-xl">
    <div class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#8bb5de]/20 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-[#5e92cb]/12 blur-3xl"></div>

    <div class="relative flex flex-col gap-6">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-sm font-bold text-white shadow-sm">AR</span>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Analise de Recebimentos</h1>
              <p class="mt-1 text-sm text-gray-600">Visao gerencial por adquirente, bandeira, modalidade, deposito e periodo</p>
            </div>
          </div>

          <div class="mt-4">
            <div class="inline-flex max-w-full items-center gap-3 rounded-2xl border border-[#73c77d]/30 bg-white/95 px-4 py-3 shadow-sm ring-1 ring-[#73c77d]/15">
              <span class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#73c77d] to-[#5cb868] text-sm font-bold text-white shadow-sm">
                {{ (melhorAdquirente?.nome || 'N').slice(0, 2).toUpperCase() }}
              </span>
              <div class="min-w-0">
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f7d32]">Melhor adquirente</p>
                <p class="truncate text-sm font-bold text-slate-800">
                  {{ melhorAdquirente?.nome || 'N/A' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-start xl:justify-end">
          <div class="flex items-center gap-3">
            <ControladoriaExcelExportButton
              root-id="analise-de-recebimentos-root"
              file-name="analise-de-recebimentos"
            />
            <AnaliseDeRecebimentosExportPdf />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article
          v-for="(item, index) in insights"
          :key="item.titulo || index"
          class="group rounded-xl border p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          :class="cardsInsights[index % cardsInsights.length]"
        >
          <div class="flex items-start gap-4">
            <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-bold text-white shadow-sm ring-1 ring-white/25">
              {{ index + 1 }}
            </span>
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">Insight</p>
              <p class="mt-1 text-lg font-bold leading-tight text-white sm:text-xl">{{ item.titulo }}</p>
            </div>
          </div>
          <p class="mt-4 text-base font-medium leading-7 text-white/95 sm:text-lg">{{ item.descricao }}</p>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import AnaliseDeRecebimentosExportPdf from '~/components/controladoria/exportacao_pdf/analise_de_recebimentos/AnaliseDeRecebimentosExportPdf.vue'
import ControladoriaExcelExportButton from '~/components/controladoria/exportacao_excel/ControladoriaExcelExportButton.vue'

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
  },
  insights: {
    type: Array,
    default: () => []
  }
})

const cardsInsights = [
  'border-green-600 bg-gradient-to-br from-green-500 to-emerald-600',
  'border-blue-600 bg-gradient-to-br from-blue-500 to-sky-600',
  'border-amber-600 bg-gradient-to-br from-amber-500 to-orange-600'
]
</script>
