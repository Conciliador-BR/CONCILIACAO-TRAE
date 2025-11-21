<template>
  <div class="rounded-2xl p-6 bg-white/70 backdrop-blur border border-gray-200/60 shadow-xl">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <!-- Receita Bruta -->
      <div class="rounded-xl p-5 border border-green-600 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium">Receita Bruta</p>
            <p class="text-2xl font-bold">{{ formatarMoeda(indicadores.receitaBruta) }}</p>
            <p class="text-xs opacity-90 mt-1">Total de vendas</p>
          </div>
        </div>
      </div>

      <!-- Custo de Taxas -->
      <div class="rounded-xl p-5 border border-red-600 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:shadow-lg transition">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium">Custo de Taxas</p>
            <p class="text-2xl font-bold">{{ formatarMoeda(indicadores.custoTaxa) }}</p>
            <p class="text-xs opacity-90 mt-1">Despesas de cartão</p>
          </div>
        </div>
      </div>

      <!-- Receita Líquida -->
      <div class="rounded-xl p-5 border border-blue-600 bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-md hover:shadow-lg transition">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium">Receita Líquida</p>
            <p class="text-2xl font-bold">{{ formatarMoeda(indicadores.receitaLiquida) }}</p>
            <p class="text-xs opacity-90 mt-1">Após taxas</p>
          </div>
        </div>
      </div>

      <!-- Margem Bruta -->
      <div class="rounded-xl p-5 border border-violet-600 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md hover:shadow-lg transition">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium">Margem Bruta</p>
            <p class="text-2xl font-bold">{{ formatarPercentual(indicadores.margemBruta) }}</p>
            <p class="text-xs opacity-90 mt-1">Rentabilidade</p>
          </div>
        </div>
      </div>

      <!-- Taxa Efetiva -->
      <div class="rounded-xl p-5 border border-amber-600 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md hover:shadow-lg transition">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium">Taxa Efetiva</p>
            <p class="text-2xl font-bold">{{ formatarPercentual(indicadores.taxaEfetiva) }}</p>
            <p class="text-xs opacity-90 mt-1">Custo médio</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Segunda linha de estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <!-- Ticket Médio Bruto -->
      <div class="rounded-xl p-4 border border-gray-200 bg-gray-50 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Ticket Médio Bruto</p>
            <p class="text-xl font-bold text-gray-900">{{ formatarMoeda(indicadores.ticketMedioBruto) }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500">por transação</p>
          </div>
        </div>
      </div>

      <!-- Ticket Médio Líquido -->
      <div class="rounded-xl p-4 border border-gray-200 bg-gray-50 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Ticket Médio Líquido</p>
            <p class="text-xl font-bold text-gray-900">{{ formatarMoeda(indicadores.ticketMedioLiquido) }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500">após taxas</p>
          </div>
        </div>
      </div>

      <!-- Total de Transações -->
      <div class="rounded-xl p-4 border border-gray-200 bg-gray-50 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total de Transações</p>
            <p class="text-xl font-bold text-gray-900">{{ indicadores.totalTransacoes.toLocaleString('pt-BR') }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500">operações</p>
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