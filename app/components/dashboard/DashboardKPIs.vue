<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <DashboardKPICard
      title="Receita Mensal"
      :value="formatCurrency(kpis.receitaMensal)"
      :change="kpis.crescimentoReceita"
      change-type="positive"
      icon="currency"
      gradient="from-blue-500 to-blue-600"
    />
    
    <DashboardKPICard
      title="Lucro Líquido"
      :value="formatCurrency(kpis.lucroLiquido)"
      :change="kpis.crescimentoLucro"
      change-type="positive"
      icon="trending-up"
      gradient="from-green-500 to-green-600"
    />
    
    <DashboardKPICard
      title="Taxa Média MDR"
      :value="kpis.taxaMediaMdr + '%'"
      :change="kpis.reducaoTaxa"
      change-type="negative"
      icon="percent"
      gradient="from-purple-500 to-purple-600"
    />
    
    <DashboardKPICard
      title="Fluxo de Caixa"
      :value="formatCurrency(kpis.fluxoCaixa)"
      :change="kpis.statusFluxo"
      change-type="status"
      icon="banknotes"
      gradient="from-orange-500 to-orange-600"
    />
  </div>
</template>

<script setup>
defineProps({
  kpis: {
    type: Object,
    required: true
  }
})

const formatCurrency = (value) => {
  if (!value) return '0,00'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

// Faltando estas importações:
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  PercentBadgeIcon, 
  BanknotesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'
</script>