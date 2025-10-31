<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Visão geral do sistema de conciliação</p>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
          <DashboardContainer :vendas="vendasDashboard" :taxas="taxasDashboard" />
        </div>
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