<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
    <div class="w-full mx-auto space-y-6 sm:space-y-8">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Analytics Financeiro</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Visão consolidada de indicadores financeiros</p>
        </div>
      </div>

      <ResumoFinanceiro :resumo="resumoCalculado" />

      <AnalyticsFinanceiroContainer>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div class="text-sm font-medium text-blue-700 mb-1">Vendas Brutas</div>
              <div class="text-2xl font-bold text-blue-900">R$ {{ formatCurrency(resumoCalculado.vendasBrutas) }}</div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-xl p-6">
              <div class="text-sm font-medium text-green-700 mb-1">Vendas Líquidas</div>
              <div class="text-2xl font-bold text-green-900">R$ {{ formatCurrency(resumoCalculado.vendasLiquidas) }}</div>
            </div>
            <div class="bg-red-50 border border-red-200 rounded-xl p-6">
              <div class="text-sm font-medium text-red-700 mb-1">Taxas</div>
              <div class="text-2xl font-bold text-red-900">R$ {{ formatCurrency(resumoCalculado.taxa) }}</div>
            </div>
          </div>
        </div>
      </AnalyticsFinanceiroContainer>
    </div>
  </div>
</template>

<script setup>
import { useVendas } from '~/composables/useVendas'
import { useResumoFinanceiro } from '~/composables/useResumoFinanceiro'
import ResumoFinanceiro from '~/components/ResumoFinanceiro.vue'
import AnalyticsFinanceiroContainer from '~/components/importacao/analytics_financeiro/AnalyticsFinanceiroContainer.vue'

useHead({
  title: 'Analytics Financeiro - MRF CONCILIAÇÃO',
  meta: [{ name: 'description', content: 'Análises financeiras consolidando dados de vendas' }]
})

const { vendas, fetchVendas } = useVendas()
await fetchVendas()

const { resumoCalculado } = useResumoFinanceiro(vendas)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0)
}
</script>
