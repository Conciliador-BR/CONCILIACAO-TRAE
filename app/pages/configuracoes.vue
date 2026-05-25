<template>
  <div class="min-h-screen bg-[#F4F8FC]">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-[#244b77]">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-white">Configurações</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-white/80 mt-1">Gerencie importação, auditoria e cadastros auxiliares</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink
              to="/configuracoes/importacao"
              :class="linkClass('importacao')"
            >
              Importação
            </NuxtLink>
            <NuxtLink
              to="/configuracoes/importacao/auditoria"
              :class="linkClass('auditoria')"
            >
              Auditoria
            </NuxtLink>
            <NuxtLink
              to="/configuracoes/importacao/cadastro"
              :class="linkClass('cadastro')"
            >
              Cadastro
            </NuxtLink>
          </nav>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
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

const linkClass = (aba) => {
  const path = route.path
  const ativoImportacao = path === '/configuracoes/importacao' || path === '/configuracoes/importacao/vendas' || path === '/configuracoes/importacao/bancos' || path === '/configuracoes/importacao/recebimentos'
  const ativoAuditoria = path === '/configuracoes/importacao/auditoria' || path.startsWith('/configuracoes/importacao/auditoria/')
  const ativoCadastro = path === '/configuracoes/importacao/cadastro' || path.startsWith('/configuracoes/importacao/cadastro/')
  const ativo = (aba === 'importacao' && ativoImportacao) || (aba === 'auditoria' && ativoAuditoria) || (aba === 'cadastro' && ativoCadastro)
  return [
    'py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap',
    ativo
      ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]'
      : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'
  ]
}
</script>
