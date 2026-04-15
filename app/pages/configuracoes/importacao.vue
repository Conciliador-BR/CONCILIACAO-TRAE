<template>
  <div class="space-y-6">
    <div v-if="mostrarSubpagesImportacao" class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border border-gray-200 rounded-2xl">
      <h2 class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Importação</h2>
      <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Importação de vendas, bancos e recebimentos</p>
    </div>

    <div v-if="mostrarSubpagesImportacao" class="px-2 sm:px-4 lg:px-6 xl:px-8">
      <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
        <NuxtLink
          to="/configuracoes/importacao/vendas"
          :class="linkClass('/configuracoes/importacao/vendas')"
        >
          Importação de Vendas
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/bancos"
          :class="linkClass('/configuracoes/importacao/bancos')"
        >
          Importação de Bancos
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/recebimentos"
          :class="linkClass('/configuracoes/importacao/recebimentos')"
        >
          Importação de Recebimentos
        </NuxtLink>
      </nav>
    </div>

    <div>
      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

if (route.path === '/configuracoes/importacao') {
  await navigateTo('/configuracoes/importacao/vendas')
}

const rotasComSubpagesImportacao = [
  '/configuracoes/importacao',
  '/configuracoes/importacao/vendas',
  '/configuracoes/importacao/bancos',
  '/configuracoes/importacao/recebimentos'
]

const mostrarSubpagesImportacao = computed(() => {
  return rotasComSubpagesImportacao.includes(route.path)
})

const linkClass = (exactPath) => {
  const ativo = route.path === exactPath
  return [
    'py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap',
    ativo
      ? 'bg-blue-50 text-blue-600 border border-blue-200'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
  ]
}
</script>
