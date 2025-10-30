<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="max-w-8xl mx-auto p-6 space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
          <h1 class="text-3xl font-bold text-gray-900">Previsão de Pagamentos</h1>
          <p class="text-sm text-gray-600 mt-1">Previsão e controle de pagamentos futuros</p>
        </div>
      </div>

      <!-- Container de Previsão -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <PrevisaoPagamentosContainer />
      </div>
    </div>
  </div>
</template>

<script setup>
import PrevisaoPagamentosContainer from '~/components/pagamentos-operadoras/previsao-de-pagamentos/PrevisaoPagamentosContainer.vue'

// Configurações da página
useHead({
  title: 'Previsão de Pagamentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Previsão de pagamentos futuros' }
  ]
})

// Não precisamos mais do useVendas aqui
// A previsão agora é completamente independente
</script>