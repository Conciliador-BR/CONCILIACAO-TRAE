<template>
  <div class="space-y-6">
    <div class="px-2 sm:px-4 lg:px-6 xl:px-8 space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Cadastro Credenciais</h3>
      </div>

      <nav class="flex flex-wrap gap-3 sm:gap-4 lg:gap-6">
        <NuxtLink
          to="/configuracoes/importacao/cadastro/cadastro_credenciais/cadastro-api"
          :class="linkClass('/configuracoes/importacao/cadastro/cadastro_credenciais/cadastro-api')"
        >
          Cadastro de API
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/cadastro_credenciais/teste-autenticacao"
          :class="linkClass('/configuracoes/importacao/cadastro/cadastro_credenciais/teste-autenticacao')"
        >
          Teste de Autenticacao
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/cadastro_credenciais/solicitacao/optin"
          :class="linkClass('/configuracoes/importacao/cadastro/cadastro_credenciais/solicitacao/optin')"
        >
          Solicitacao de Opt-In
        </NuxtLink>
      </nav>
    </div>

    <NuxtPage />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const linkClass = (exactPath) => {
  const ativo = route.path === exactPath

  return [
    'py-3 px-4 sm:px-5 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap',
    ativo
      ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
  ]
}
</script>
