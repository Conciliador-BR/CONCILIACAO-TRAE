<template>
  <div>
    <!-- Gráficos principais -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <DashboardChartCard
        title="Receita vs Meta (Últimos 12 Meses)"
        chart-id="receita"
        :chart-data="dadosReceita"
        chart-type="line"
      />
      
      <DashboardChartCard
        title="Distribuição por Adquirente"
        chart-id="adquirente"
        :chart-data="dadosAdquirente"
        chart-type="doughnut"
      />
    </div>

    <!-- Segunda linha de gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DashboardChartCard
        title="Tendência de Lucro"
        chart-id="lucro"
        :chart-data="dadosLucro"
        chart-type="line"
        :height="48"
      />
      
      <DashboardChartCard
        title="Volume de Vendas"
        chart-id="volume"
        :chart-data="dadosVolume"
        chart-type="bar"
        :height="48"
      />
      
      <DashboardChartCard
        title="Participação por Bandeira"
        chart-id="bandeira"
        :chart-data="dadosBandeira"
        chart-type="doughnut"
        :height="48"
      />
    </div>
  </div>
</template>

<script setup>
import { useDashboardCharts } from './composables/useDashboardCharts.js'

const { 
  dadosReceita, 
  dadosAdquirente, 
  dadosLucro, 
  dadosVolume, 
  dadosBandeira 
} = useDashboardCharts()
</script>