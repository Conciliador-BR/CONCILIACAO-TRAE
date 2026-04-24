<template>
  <div class="mb-8 px-2 sm:px-4 lg:px-6 xl:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
      <div class="bg-[#102a43] text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-white/80 text-xs sm:text-sm font-medium">Recebimento Bruto</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.recebimentosBrutos) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs sm:text-sm">Total Antes das Taxas</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M5 12a7 7 0 0114 0 7 7 0 01-14 0z"></path>
          </svg>
        </div>
      </div>

      <div class="bg-[#244b77] text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-white/80 text-xs sm:text-sm font-medium">Recebimento Líquido</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.recebimentosLiquidos) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs sm:text-sm">Total Após MDR</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
          </svg>
        </div>
      </div>

      <div class="bg-[#1E7E34] text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-white/80 text-xs sm:text-sm font-medium">Total Débitos</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.debitos) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs sm:text-sm">Aluguéis e Ajustes</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-3-3v6m9 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>

      <div class="bg-[#B56A00] text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-white/80 text-xs sm:text-sm font-medium">Despesas MDR</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.taxa) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs sm:text-sm">Custo das Taxas</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2m-2 0v4a2 2 0 002 2h2a2 2 0 002-2v-4m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6z"></path>
          </svg>
        </div>
      </div>

      <div class="bg-[#244b77] text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-white/80 text-xs sm:text-sm font-medium">Taxa Média</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatPercent(resumo.taxaMedia) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs sm:text-sm">Percentual de MDR</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3v18m0 0l-4-4m4 4l4-4m6-7H5"></path>
          </svg>
        </div>
      </div>

      <div class="bg-[#1E7E34] text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-white/80 text-xs sm:text-sm font-medium">Total Líquido</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.totalLiquido) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs sm:text-sm">Resultado Final</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  resumo: {
    type: Object,
    required: true
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const formatPercent = (value) => {
  return `${Number(value || 0).toFixed(2)}%`
}
</script>
