<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border border-gray-200 rounded-2xl">
      <h2 class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Analytics Financeiro</h2>
      <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Visão consolidada de indicadores financeiros</p>
    </div>

    <div class="flex items-center justify-between">
      <ResumoAnalyticsFinanceiro @mostrar-nao-conciliadas="mostrarNaoConciliadas" />
      <div class="flex items-center gap-3">
        <RefazerAuditoria />
        <EnviarAuditoria />
      </div>
    </div>

    <AnalyticsFinanceiroContainer :somente-nao-conciliadas="somenteNaoConciliadas" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHead } from '#imports'
import { useVendas } from '~/composables/useVendas'
import AnalyticsFinanceiroContainer from '~/components/configuracoes/auditoria/analytics_financeiro/AnalyticsFinanceiroContainer.vue'
import ResumoAnalyticsFinanceiro from '~/components/configuracoes/auditoria/analytics_financeiro/ResumoAnalyticsFinanceiro.vue'
import EnviarAuditoria from '~/components/configuracoes/auditoria/analytics_financeiro/EnviarAuditoria.vue'
import RefazerAuditoria from '~/components/configuracoes/auditoria/analytics_financeiro/RefazerAuditoria.vue'

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
