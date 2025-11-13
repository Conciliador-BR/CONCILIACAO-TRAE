<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
    <div class="w-full mx-auto space-y-6 sm:space-y-8">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Analytics Financeiro</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Visão consolidada de indicadores financeiros</p>
        </div>
      </div>
      <div class="flex items-center justify-between px-2 sm:px-4 lg:px-6 xl:px-8">
        <ResumoAnalyticsFinanceiro @mostrar-nao-conciliadas="mostrarNaoConciliadas" />
        <EnviarAuditoria />
      </div>

      <AnalyticsFinanceiroContainer :somente-nao-conciliadas="somenteNaoConciliadas" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHead } from '#imports'
import { useVendas } from '~/composables/useVendas'
import AnalyticsFinanceiroContainer from '~/components/importacao/analytics_financeiro/AnalyticsFinanceiroContainer.vue'
import ResumoAnalyticsFinanceiro from '~/components/importacao/analytics_financeiro/ResumoAnalyticsFinanceiro.vue'
import EnviarAuditoria from '~/components/importacao/analytics_financeiro/EnviarAuditoria.vue'

useHead({
  title: 'Analytics Financeiro - MRF CONCILIAÇÃO',
  meta: [{ name: 'description', content: 'Análises financeiras consolidando dados de vendas' }]
})

const { vendas, fetchVendas } = useVendas()

onMounted(async () => {
  await fetchVendas()
})

const somenteNaoConciliadas = ref(false)
const mostrarNaoConciliadas = () => { somenteNaoConciliadas.value = true }
</script>
