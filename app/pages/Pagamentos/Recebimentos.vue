<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Cabeçalho -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Recebimentos</h1>
        <p class="text-gray-600">Controle de recebimentos</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto p-6">
      <!-- Container de Recebimentos -->
      <RecebimentosContainer :vendas="vendas" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import RecebimentosContainer from '~/components/pagamentos-operadoras/recebimentos/RecebimentosContainer.vue'

// Configurações da página
useHead({
  title: 'Recebimentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Controle de recebimentos' }
  ]
})

// Usar dados de vendas para recebimentos
const { vendas, loading, error, fetchVendas } = useVendas()

// Carregar dados ao montar
onMounted(async () => {
  await fetchVendas()
})
</script>