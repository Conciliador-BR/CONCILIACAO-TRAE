<template>
  <div class="space-y-6">
    <!-- Navegação das Subpáginas -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6">
        <nav class="flex space-x-8">
          <NuxtLink 
            to="/cadastro/cadastro-taxas" 
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
            :class="$route.path === '/cadastro/cadastro-taxas' || $route.path === '/cadastro' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Cadastro de Taxas
          </NuxtLink>
          <NuxtLink 
            to="/cadastro/cadastro-bancos" 
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
            :class="$route.path === '/cadastro/cadastro-bancos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Cadastro de Bancos
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
  title: 'Cadastro - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de cadastros e configurações' }
  ]
})

// Redirecionar para a aba padrão se estiver na rota raiz
const route = useRoute()
if (route.path === '/cadastro') {
  await navigateTo('/cadastro/cadastro-taxas')
}
</script>