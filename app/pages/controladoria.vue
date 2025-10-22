<template>
  <div class="space-y-20">
    <!-- Navegação das Subpáginas -->
    <div class="bg-white border-b border-gray-200">
      <div class="w-full mx-auto px-10">
        <nav class="flex space-x-10">
          <NuxtLink 
            to="/controladoria/controladoria-vendas" 
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
            :class="$route.path === '/controladoria/controladoria-vendas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Vendas
          </NuxtLink>
          <NuxtLink 
            to="/controladoria/controladoria-recebimentos" 
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
            :class="$route.path === '/controladoria/controladoria-recebimentos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Recebimentos
          </NuxtLink>
        </nav>
      </div>
    </div>

    <!-- Conteúdo das Subpáginas -->
    <div class="w-full mx-auto p-6">
      <NuxtPage />
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