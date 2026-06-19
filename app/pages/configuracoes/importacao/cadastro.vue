<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border border-gray-200 rounded-2xl">
      <h2 class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Cadastro</h2>
      <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Configuracoes cadastrais organizadas por grupos</p>
    </div>

    <div class="px-2 sm:px-4 lg:px-6 xl:px-8">
      <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
        <NuxtLink
          to="/configuracoes/importacao/cadastro/cadastro_cliente"
          :class="linkClass('/configuracoes/importacao/cadastro/cadastro_cliente')"
        >
          Cadastro Cliente
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/cadastro_credenciais"
          :class="linkClass('/configuracoes/importacao/cadastro/cadastro_credenciais')"
        >
          Cadastro Credenciais
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/servidor"
          :class="linkClass('/configuracoes/importacao/cadastro/servidor')"
        >
          Servidor
        </NuxtLink>
      </nav>
    </div>

    <div>
      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const linkClass = (basePath) => {
  const ativo = route.path === basePath || route.path.startsWith(`${basePath}/`)

  return [
    'py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap',
    ativo
      ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
  ]
}
</script>
