<template>
  <div class="space-y-6">
    <!-- Dashboard Content -->
    <div class="p-6">
      <div class="max-w-7xl mx-auto">
        <DashboardContainer :vendas="vendasDashboard" :taxas="taxasDashboard" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import DashboardContainer from '~/components/dashboard/DashboardContainer.vue'

// Configurações da página
useHead({
  title: 'Dashboard - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Dashboard principal do sistema' }
  ]
})

const { escutarEvento } = useGlobalFilters()
const vendasDashboard = ref([])
const taxasDashboard = ref([])

// Dados de exemplo para o dashboard
const dadosExemplo = {
  vendas: [
    {
      id: 1,
      empresa: 'Empresa A',
      valor: 15000,
      data: '2024-01-15',
      operadora: 'Visa'
    },
    {
      id: 2,
      empresa: 'Empresa B', 
      valor: 8500,
      data: '2024-01-16',
      operadora: 'Mastercard'
    }
  ],
  taxas: [
    {
      id: 1,
      operadora: 'Visa',
      taxa: 2.5,
      valor: 375
    },
    {
      id: 2,
      operadora: 'Mastercard',
      taxa: 2.8,
      valor: 238
    }
  ]
}

// Função para filtrar dados específicos do dashboard
const filtrarDashboard = async (filtros) => {
  console.log('Filtrando dashboard com:', filtros)
  
  // TODO: Substituir por chamada real da API
  // Por enquanto, usar dados de exemplo
  vendasDashboard.value = dadosExemplo.vendas
  taxasDashboard.value = dadosExemplo.taxas
}

// Função para lidar com filtros aplicados
const onFiltrosAplicados = (filtros) => {
  console.log('Filtros recebidos no dashboard:', filtros)
  filtrarDashboard(filtros)
}

let removerListener

onMounted(async () => {
  // Carregar dados iniciais
  vendasDashboard.value = dadosExemplo.vendas
  taxasDashboard.value = dadosExemplo.taxas
  
  // Escuta eventos específicos para o dashboard
  removerListener = escutarEvento('filtrar-dashboard', filtrarDashboard)
})

onUnmounted(() => {
  // Remove o listener ao desmontar o componente
  if (removerListener) {
    removerListener()
  }
})
</script>