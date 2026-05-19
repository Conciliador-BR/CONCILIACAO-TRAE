<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border border-gray-200 rounded-2xl">
      <h2 class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Cadastro</h2>
      <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Configurações cadastrais e criação de tabelas</p>
    </div>

    <div class="px-2 sm:px-4 lg:px-6 xl:px-8">
      <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
        <NuxtLink
          to="/configuracoes/importacao/cadastro/criar-tabelas"
          :class="linkClass('/configuracoes/importacao/cadastro/criar-tabelas')"
        >
          Criar Tabelas Supabase
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/cadastro-cliente"
          :class="linkClass('/configuracoes/importacao/cadastro/cadastro-cliente')"
        >
          Cadastro do Cliente
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/cadastro-api"
          :class="linkClass('/configuracoes/importacao/cadastro/cadastro-api')"
        >
          Cadastro de API
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/teste-autenticacao"
          :class="linkClass('/configuracoes/importacao/cadastro/teste-autenticacao')"
        >
          Teste de Autenticacao
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/solicitacao/optin"
          :class="linkClass('/configuracoes/importacao/cadastro/solicitacao/optin')"
        >
          Solicitacao de Opt-In
        </NuxtLink>
        <NuxtLink
          to="/configuracoes/importacao/cadastro/retificar-tabelas-supabase"
          :class="linkClass('/configuracoes/importacao/cadastro/retificar-tabelas-supabase')"
        >
          Retificar Tabelas
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
