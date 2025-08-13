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