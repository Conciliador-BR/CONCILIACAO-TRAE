<template>
  <div class="space-y-6">
    <!-- Navegação das Subpáginas -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6">
        <nav class="flex space-x-8">
          <NuxtLink 
            to="/Pagamentos/Recebimentos" 
            :prefetch="false"
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
            :class="$route.path === '/Pagamentos/Recebimentos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Recebimentos
          </NuxtLink>
          <NuxtLink 
            to="/Pagamentos/Previsao-de-Pagamentos" 
            :prefetch="false"
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
            :class="$route.path === '/Pagamentos/Previsao-de-Pagamentos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Previsão de Recebimentos
          </NuxtLink>
        </nav>
      </div>
    </div>

    <!-- Conteúdo das Subpáginas -->
    <div class="max-w-7xl mx-auto p-6">
      <NuxtPage />
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