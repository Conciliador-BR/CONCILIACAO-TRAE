<template>
  <div class="space-y-6">
    <div v-if="mostrarSubpagesImportacao" class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border border-gray-200 rounded-2xl">
      <h2 class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Importação</h2>
      <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Importação de vendas, bancos e recebimentos</p>
    </div>

    <div v-if="mostrarSubpagesImportacao" class="px-2 sm:px-4 lg:px-6 xl:px-8">
      <div class="rounded-[28px] border border-[#DCE7F3] bg-[linear-gradient(180deg,#ffffff,rgba(248,251,255,0.96))] p-4 sm:p-5 shadow-[0_22px_50px_rgba(15,23,42,0.08)]">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#486581]">Página atual</p>
            <h3 class="mt-2 text-lg font-bold text-[#102a43] sm:text-xl lg:text-2xl">
              {{ paginaImportacaoAtual }}
            </h3>
          </div>
        </div>

        <nav class="inline-flex flex-wrap gap-3 rounded-[24px] border border-[#DCE7F3] bg-white/90 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm">
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

const paginaImportacaoAtual = computed(() => {
  if (route.path === '/configuracoes/importacao/recebimentos') return 'Importação de Recebimentos'
  if (route.path === '/configuracoes/importacao/bancos') return 'Importação de Bancos'
  return 'Importação de Vendas'
})

const linkClass = (exactPath) => {
  const ativo = route.path === exactPath
  return [
    'rounded-[18px] px-5 py-3.5 whitespace-nowrap transition-all duration-300 border',
    ativo
      ? 'scale-[1.02] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-6 py-4 text-sm font-bold text-white border-[#244b77] shadow-[0_16px_34px_rgba(16,42,67,0.30)] ring-2 ring-[#8bb5de]/70 sm:text-base lg:text-lg'
      : 'border-transparent bg-transparent text-xs font-semibold text-[#486581] hover:-translate-y-0.5 hover:border-[#DCE7F3] hover:bg-[#F8FBFF] hover:text-[#163a5a] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:text-sm lg:text-base'
  ]
}
</script>
