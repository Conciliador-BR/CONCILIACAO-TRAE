<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="max-w-8xl mx-auto p-6 space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
          <h1 class="text-3xl font-bold text-gray-900">Controladoria</h1>
          <p class="text-sm text-gray-600 mt-1">Gestão de vendas e recebimentos</p>
        </div>
      </div>

      <!-- Navegação das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-8 py-6">
          <nav class="flex space-x-8">
            <NuxtLink 
              to="/controladoria/controladoria-vendas" 
              class="py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-200"
              :class="$route.path === '/controladoria/controladoria-vendas' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              Vendas
            </NuxtLink>
            <NuxtLink 
              to="/controladoria/controladoria-recebimentos" 
              class="py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-200"
              :class="$route.path === '/controladoria/controladoria-recebimentos' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              Recebimentos
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
  title: 'Controladoria - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de vendas e recebimentos' }
  ]
})
</script>