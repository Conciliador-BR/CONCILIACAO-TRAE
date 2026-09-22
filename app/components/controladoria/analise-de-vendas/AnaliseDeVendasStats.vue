<template>
  <div class="analise-stats-root rounded-2xl border border-gray-200/60 bg-white/70 p-4 shadow-xl backdrop-blur sm:p-6">
    <div class="analise-stats-grid-primary grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5 lg:gap-6">
      <!-- Receita Bruta -->
      <div class="analise-stats-card rounded-xl border border-[#244b77] bg-[#102a43] p-3.5 text-white shadow-md transition hover:shadow-lg sm:p-5">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-white sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium sm:text-sm">Receita Bruta</p>
            <p class="text-lg font-bold leading-tight sm:text-2xl">{{ formatarMoeda(indicadores.receitaBruta) }}</p>
            <p class="text-xs opacity-90 mt-1">Total de vendas</p>
          </div>
        </div>
      </div>

      <!-- Custo de Taxas -->
      <div class="analise-stats-card rounded-xl border border-[#D17A00] bg-[#B56A00] p-3.5 text-white shadow-md transition hover:shadow-lg sm:p-5">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-white sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium sm:text-sm">Custo de Taxas</p>
            <p class="text-lg font-bold leading-tight sm:text-2xl">{{ formatarMoeda(indicadores.custoTaxa) }}</p>
            <p class="text-xs opacity-90 mt-1">Despesas de cartão</p>
          </div>
        </div>
      </div>

      <!-- Receita Líquida -->
      <div class="analise-stats-card rounded-xl border border-[#5e92cb] bg-[#244b77] p-3.5 text-white shadow-md transition hover:shadow-lg sm:p-5">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-white sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium sm:text-sm">Receita Líquida</p>
            <p class="text-lg font-bold leading-tight sm:text-2xl">{{ formatarMoeda(indicadores.receitaLiquida) }}</p>
            <p class="text-xs opacity-90 mt-1">Após taxas</p>
          </div>
        </div>
      </div>

      <!-- Margem Bruta -->
      <div class="analise-stats-card rounded-xl border border-[#2F9E44] bg-[#1E7E34] p-3.5 text-white shadow-md transition hover:shadow-lg sm:p-5">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-white sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium sm:text-sm">Margem Bruta</p>
            <p class="text-lg font-bold leading-tight sm:text-2xl">{{ formatarPercentual(indicadores.margemBruta) }}</p>
            <p class="text-xs opacity-90 mt-1">Rentabilidade</p>
          </div>
        </div>
      </div>

      <!-- Taxa Efetiva -->
      <div class="analise-stats-card rounded-xl border border-[#8bb5de] bg-[#244b77] p-3.5 text-white shadow-md transition hover:shadow-lg sm:p-5">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-white sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium sm:text-sm">Taxa Efetiva</p>
            <p class="text-lg font-bold leading-tight sm:text-2xl">{{ formatarPercentual(indicadores.taxaEfetiva) }}</p>
            <p class="text-xs opacity-90 mt-1">Custo médio</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Segunda linha de estatísticas -->
    <div class="analise-stats-grid-secondary mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 xl:gap-6">
      <!-- Ticket Médio Bruto -->
      <div class="analise-stats-card rounded-xl border border-[#DCE7F3] bg-[#F7FAFC] p-3.5 shadow-sm sm:p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-[#486581]">Ticket Médio Bruto</p>
            <p class="text-xl font-bold text-[#102A43]">{{ formatarMoeda(indicadores.ticketMedioBruto) }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-[#627D98]">por transação</p>
          </div>
        </div>
      </div>

      <!-- Ticket Médio Líquido -->
      <div class="analise-stats-card rounded-xl border border-[#DCE7F3] bg-[#F7FAFC] p-3.5 shadow-sm sm:p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-[#486581]">Ticket Médio Líquido</p>
            <p class="text-xl font-bold text-[#102A43]">{{ formatarMoeda(indicadores.ticketMedioLiquido) }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-[#627D98]">após taxas</p>
          </div>
        </div>
      </div>

      <!-- Total de Transações -->
      <div class="analise-stats-card rounded-xl border border-[#DCE7F3] bg-[#F7FAFC] p-3.5 shadow-sm sm:p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-[#486581]">Total de Transações</p>
            <p class="text-xl font-bold text-[#102A43]">{{ indicadores.totalTransacoes.toLocaleString('pt-BR') }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-[#627D98]">operações</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({
  indicadores: {
    type: Object,
    required: true,
    default: () => ({
      receitaBruta: 0,
      receitaLiquida: 0,
      margemBruta: 0,
      taxaEfetiva: 0,
      ticketMedioBruto: 0,
      ticketMedioLiquido: 0,
      totalTransacoes: 0
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor || 0)
}

const formatarPercentual = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((valor || 0) / 100)
}
</script>
