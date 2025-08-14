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

        <!-- Grade de Vendas -->
        <GradeVendas 
          :model-value="vendas"
          @update:model-value="$emit('update:vendas', $event)"
          :empresa-selecionada="empresaSelecionadaNome"
          :filtro-data="filtroData"
          @vendas-changed="$emit('vendas-changed')"
        />
      </div>

      <!-- Controladoria -->
      <div v-if="abaAtiva === 'controladoria'" class="space-y-6">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200">
          <!-- Navegação interna da Controladoria -->
          <div class="border-b border-gray-200 px-6 py-4">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Controladoria</h2>
            <div class="flex space-x-4">
              <NuxtLink 
                to="/controladoria/controladoria-vendas" 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Vendas
              </NuxtLink>
              <NuxtLink 
                to="/controladoria/controladoria-recebimentos" 
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Recebimentos
              </NuxtLink>
            </div>
          </div>
          
          <!-- Conteúdo da Controladoria -->
          <div class="p-6">
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
      <div v-if="abaAtiva === 'taxas'">
        <TaxasContainer 
          :model-value="taxas"
          @update:model-value="$emit('update:taxas', $event)"
          :empresa-selecionada="empresaSelecionadaNome"
        />
      </div>

      <!-- Pagamentos -->
      <div v-if="abaAtiva === 'pagamentos'" class="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div class="text-center">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Módulo de Pagamentos</h3>
          <p class="text-gray-600">Em desenvolvimento...</p>
        </div>
      </div>

      <!-- Banco -->
      <div v-if="abaAtiva === 'banco'" class="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div class="text-center">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Módulo Bancário</h3>
          <p class="text-gray-600">Em desenvolvimento...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import DashboardContainer from '~/components/dashboard/DashboardContainer.vue'
import ResumoFinanceiro from '~/components/ResumoFinanceiro.vue'
import GradeVendas from '~/components/vendas-operadoras/GradeVendas.vue'
import TaxasContainer from '~/components/taxas/TaxasContainer.vue'

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