<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
    <div class="w-full mx-auto space-y-6 sm:space-y-8">
      
      <!-- Header da página -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Pagamentos</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Gestão de recebimentos e previsão de recebimentos</p>
        </div>
      </div>

      <!-- Navegação das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink 
              to="/Pagamentos/Recebimentos" 
              :prefetch="false"
              class="py-3 px-4 sm:px-5 lg:px-6 border-b-2 font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 rounded-t-lg whitespace-nowrap"
              :class="$route.path === '/Pagamentos/Recebimentos' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
            >
              Recebimentos
            </NuxtLink>
            <NuxtLink 
              to="/Pagamentos/Previsao-de-Pagamentos" 
              :prefetch="false"
              class="py-3 px-4 sm:px-5 lg:px-6 border-b-2 font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 rounded-t-lg whitespace-nowrap"
              :class="$route.path === '/Pagamentos/Previsao-de-Pagamentos' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
            >
              Previsão de Recebimentos
            </NuxtLink>
          </nav>
        </div>
      </div>

      <!-- Conteúdo das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
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