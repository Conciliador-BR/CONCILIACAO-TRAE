<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div class="max-w-8xl mx-auto space-y-8">
      
      <!-- Header da página -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h1 class="text-3xl font-bold text-gray-900">Pagamentos</h1>
          <p class="text-sm text-gray-600 mt-1">Gestão de recebimentos e previsão de recebimentos</p>
        </div>
      </div>

      <!-- Navegação das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <nav class="flex space-x-8">
            <NuxtLink 
              to="/Pagamentos/Recebimentos" 
              :prefetch="false"
              class="py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 rounded-t-lg"
              :class="$route.path === '/Pagamentos/Recebimentos' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
            >
              Recebimentos
            </NuxtLink>
            <NuxtLink 
              to="/Pagamentos/Previsao-de-Pagamentos" 
              :prefetch="false"
              class="py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 rounded-t-lg"
              :class="$route.path === '/Pagamentos/Previsao-de-Pagamentos' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
            >
              Previsão de Recebimentos
            </NuxtLink>
          </nav>
        </div>
      </div>

      <!-- Conteúdo das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-8">
          <NuxtPage />
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
// Configurações da página
useHead({
  title: 'Pagamentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de recebimentos e previsão de recebimentos' }
  ]
})
</script>