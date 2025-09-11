<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Cabeçalho -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Previsão de Pagamentos</h1>
        <p class="text-gray-600">Previsão e controle de pagamentos futuros</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto p-6">
      <!-- Container de Previsão de Pagamentos -->
      <PrevisaoPagamentosContainer :vendas="vendas" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import PrevisaoPagamentosContainer from '~/components/pagamentos-operadoras/previsao-de-pagamentos/PrevisaoPagamentosContainer.vue'

// Configurações da página
useHead({
  title: 'Previsão de Pagamentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Previsão de pagamentos futuros' }
  ]
})

// Usar dados de vendas para previsão
const { vendas, loading, error, fetchVendas } = useVendas()

// Carregar dados ao montar
onMounted(async () => {
  await fetchVendas()
})
</script>