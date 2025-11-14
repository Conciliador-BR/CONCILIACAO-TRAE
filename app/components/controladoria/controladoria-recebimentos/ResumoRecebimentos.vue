<template>
  <div class="mb-8 px-2 sm:px-4 lg:px-6 xl:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-orange-100 text-xs sm:text-sm font-medium">Recebimento Líquido</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.recebimentosLiquidos) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-orange-300 text-xs sm:text-sm">Total final</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
        </div>
      </div>

      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-green-100 text-xs sm:text-sm font-medium">Recebimento Bruto</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.recebimentosBrutos) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-green-300 text-xs sm:text-sm">Antes das taxas</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
      </div>

      <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-red-100 text-xs sm:text-sm font-medium">Despesas MDR</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.taxa) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-red-300 text-xs sm:text-sm">Custo das taxas</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
      </div>

      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-blue-100 text-xs sm:text-sm font-medium">Total Líquido</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumo.totalLiquido) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-blue-300 text-xs sm:text-sm">Após débitos</span>
            </div>
          </div>
          <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
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
</script>