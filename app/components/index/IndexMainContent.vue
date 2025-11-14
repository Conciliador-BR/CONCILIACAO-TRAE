<template>
  <div class="p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Dashboard -->
      <div v-if="abaAtiva === 'dashboard'" class="space-y-6">
        <DashboardContainer :vendas="vendas" :taxas="taxas" />
      </div>

      <!-- Vendas -->
      <div v-if="abaAtiva === 'vendas'" class="space-y-6">
        <!-- Resumo Financeiro (Vendas Operadoras) -->
        <ResumoFinanceiro :resumo="resumoCalculado" />

        <!-- Placeholder para novo componente de vendas -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Grade de Vendas</h2>
          <p class="text-gray-500">Novo componente será implementado aqui</p>
        </div>
      </div>

      <!-- Controladoria -->
      <div v-if="abaAtiva === 'controladoria'" class="space-y-6">
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <!-- Header padrão páginas -->
          <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
            <h2 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Controladoria</h2>
            <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Gestão de vendas e recebimentos</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <NuxtLink 
                to="/controladoria/controladoria-vendas" 
                class="py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200"
                :class="$route.path === '/controladoria/controladoria-vendas' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'"
              >
                Vendas
              </NuxtLink>
              <NuxtLink 
                to="/controladoria/controladoria-recebimentos" 
                class="py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200"
                :class="$route.path === '/controladoria/controladoria-recebimentos' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'"
              >
                Recebimentos
              </NuxtLink>
            </div>
          </div>

          <!-- Conteúdo da Controladoria -->
          <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
            <p class="text-gray-600 mb-4">Acesse as seções de Vendas e Recebimentos da Controladoria:</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 border border-gray-200 rounded-lg">
                <h3 class="font-semibold text-gray-800 mb-2">Conciliações de Vendas</h3>
                <p class="text-sm text-gray-600">Visualize e gerencie as conciliações de vendas por adquirente.</p>
              </div>
              <div class="p-4 border border-gray-200 rounded-lg">
                <h3 class="font-semibold text-gray-800 mb-2">Recebimentos</h3>
                <p class="text-sm text-gray-600">Controle de recebimentos e fluxo de caixa.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Taxas -->
      <div v-if="abaAtiva === 'taxas'" class="space-y-6">
        <TaxasContainer 
          :model-value="taxas"
          @update:model-value="$emit('update:taxas', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import DashboardContainer from '~/components/dashboard/DashboardContainer.vue'
import ResumoFinanceiro from '~/components/ResumoFinanceiro.vue'
// REMOVIDO: import GradeVendas from '~/components/vendas-operadoras/GradeVendas.vue'
import TaxasContainer from '~/components/cadastro/cadastro-taxas/TaxasContainer.vue'

defineProps({
  abaAtiva: String,
  vendas: Array,
  taxas: Array,
  resumoCalculado: Object,
  empresaSelecionadaNome: String,
  filtroData: Object
})

defineEmits(['update:vendas', 'update:taxas', 'vendas-changed'])
</script>