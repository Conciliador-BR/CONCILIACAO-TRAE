<template>
  <div class="space-y-6">
    <DashboardKPIs :kpis="kpis" />
    <DashboardCharts />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardChartCard
        title="Comparativo Anual - Receita e Custos"
        chart-id="comparativo"
        :chart-data="dadosComparativo"
        chart-type="bar"
      />
      <DashboardEconomias :economias="economias" />
    </div>
    <DashboardPerformanceTable :empresas="performanceEmpresas" />
  </div>
</template>

<script setup>
import { useDashboardData } from './composables/useDashboardData.js'

const props = defineProps({
  vendas: {
    type: Array,
    default: () => []
  },
  taxas: {
    type: Array,
    default: () => []
  }
})

// Usar composables
const { kpis, economias, performanceEmpresas, dadosComparativo } = useDashboardData(props.vendas, props.taxas)
</script>