<template>
  <div class="space-y-6">
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
    <div v-else class="space-y-6">
      <DashboardKPIs :kpis="kpis" />
      <DashboardCharts :dados-graficos="dadosGraficos" />
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
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDashboardRealData } from '~/composables/dashboard/useDashboardRealData'

// Usar composables com dados reais
const { 
  kpis, 
  economias, 
  performanceEmpresas, 
  dadosComparativo, 
  dadosGraficos,
  loading
} = useDashboardRealData()

// OBS: carregarDados agora é chamado internamente pelo init() do composable
// apenas se os dados não existirem. E o evento 'filtrar-dashboard'
// cuidará de atualizar quando o usuário clicar em "Aplicar Filtro".
</script>
