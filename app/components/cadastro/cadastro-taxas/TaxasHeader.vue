<template>
  <div class="border-b border-[#DCE7F3] bg-gradient-to-r from-[#F8FBFE] via-white to-[#F4F8FC] px-4 sm:px-5 lg:px-6 py-5">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div class="flex items-start gap-4">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white shadow-lg shadow-[#102a43]/20">
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 14l3-3 3 2 4-5" />
            <path d="M17 8h3v3" />
          </svg>
        </div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center rounded-full border border-[#CFE0F2] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#486581]">
              Modulo de Taxas
            </span>
            <span class="inline-flex items-center rounded-full bg-[#E8F6EA] px-3 py-1 text-xs font-semibold text-[#1F7A35]">
              {{ totalTaxas }} {{ totalTaxas === 1 ? 'registro' : 'registros' }}
            </span>
          </div>

          <h2 class="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-[#102A43]">Cadastro de Taxas</h2>
          <p class="mt-1 text-sm sm:text-[15px] text-[#486581]">
            Ajuste taxas, adquirentes e modalidades com uma leitura mais limpa e foco na manutencao operacional.
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <div class="rounded-2xl border border-[#DCE7F3] bg-white px-3 py-2 text-sm text-[#334E68] shadow-sm">
              <span class="font-semibold text-[#102A43]">Empresa:</span>
              {{ empresaLabel }}
            </div>
            <div class="rounded-2xl border border-[#DCE7F3] bg-white px-3 py-2 text-sm text-[#334E68] shadow-sm">
              <span class="font-semibold text-[#102A43]">Foco:</span>
              taxas por adquirente, bandeira e parcela
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 xl:justify-end">
        <button
          @click="$emit('adicionar-taxa')"
          class="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D5E3F1] bg-white px-4 py-3 text-sm font-semibold text-[#102A43] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#BFD3E6] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#8bb5de]"
        >
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8F1FB] text-[#1f4f77]">+</span>
          Adicionar Taxa
        </button>
        <div class="flex items-center">
          <BotaoSalvar @click="$emit('salvar')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BotaoSalvar from './BotaoSalvar.vue'
defineProps({
  totalTaxas: {
    type: Number,
    default: 0
  },
  empresaLabel: {
    type: String,
    default: 'Todas as empresas'
  }
})
defineEmits(['adicionar-taxa', 'salvar'])
</script>
