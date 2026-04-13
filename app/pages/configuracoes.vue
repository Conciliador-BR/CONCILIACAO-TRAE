<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Configurações</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Gerencie importação, auditoria e cadastros auxiliares</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink
              to="/configuracoes/importacao"
              :class="linkClass('/configuracoes/importacao')"
            >
              Importação
            </NuxtLink>
            <NuxtLink
              to="/configuracoes/importacao/auditoria"
              :class="linkClass('/configuracoes/importacao/auditoria')"
            >
              Auditoria
            </NuxtLink>
            <NuxtLink
              to="/configuracoes/importacao/cadastro"
              :class="linkClass('/configuracoes/importacao/cadastro')"
            >
              Cadastro
            </NuxtLink>
          </nav>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
          <NuxtPage />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

if (route.path === '/configuracoes') {
  await navigateTo('/configuracoes/importacao')
}

const linkClass = (basePath) => {
  const ativo = route.path === basePath || route.path.startsWith(basePath + '/')
  return [
    'py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap',
    ativo
      ? 'bg-blue-50 text-blue-600 border border-blue-200'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
  ]
}
</script>
