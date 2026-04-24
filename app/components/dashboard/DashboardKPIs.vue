<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <DashboardKPICard
      title="Receita Mensal"
      :value="formatCurrency(kpis.receitaMensal)"
      :change="kpis.crescimentoReceita"
      change-type="positive"
      icon="currency"
      bg-class="bg-[#102a43]"
    />
    
    <DashboardKPICard
      title="Lucro Líquido"
      :value="formatCurrency(kpis.lucroLiquido)"
      :change="kpis.crescimentoLucro"
      change-type="positive"
      icon="trending-up"
      bg-class="bg-[#1E7E34]"
    />
    
    <DashboardKPICard
      title="Taxa Média MDR"
      :value="kpis.taxaMediaMdr + '%'"
      :change="kpis.reducaoTaxa"
      change-type="negative"
      icon="percent"
      bg-class="bg-[#B56A00]"
    />
    
    <DashboardKPICard
      title="Fluxo de Caixa"
      :value="formatCurrency(kpis.fluxoCaixa)"
      :change="kpis.statusFluxo"
      change-type="status"
      icon="banknotes"
      bg-class="bg-[#244b77]"
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
