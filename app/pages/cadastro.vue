<template>
  <div class="min-h-screen bg-[#F4F8FC]">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-[#244b77]">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-white">Cadastro</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-white/80 mt-1">Gestão de cadastros e configurações</p>
        </div>
      </div>

      <!-- Navegação das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink 
              to="/cadastro/cadastro-taxas" 
              @click="registrarVisitaAba('taxas')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/cadastro/cadastro-taxas' || $route.path === '/cadastro' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]' : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'"
            >
              Cadastro de Taxas
            </NuxtLink>
            <NuxtLink 
              to="/cadastro/cadastro-senhas" 
              @click="registrarVisitaAba('senhas')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/cadastro/cadastro-senhas' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]' : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'"
            >
              Cadastro de Senhas e Bancos
            </NuxtLink>
          </nav>
        </div>
      </div>

      <!-- Conteúdo das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
          <NuxtPage />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

// Configurações da página
useHead({
  title: 'Cadastro - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de cadastros e configurações' }
  ]
})

// Composable para navegação do cadastro
const useCadastroNavigation = () => {
  const STORAGE_KEY = 'cadastro_ultima_aba'

  const carregarUltimaAba = () => {
    if (process.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && ['taxas', 'senhas'].includes(saved)) {
        return saved
      }
    }
    return 'taxas' // padrão
  }

  const salvarUltimaAba = (aba) => {
    if (process.client && ['taxas', 'senhas'].includes(aba)) {
      localStorage.setItem(STORAGE_KEY, aba)
    }
  }

  const obterRotaUltimaAba = () => {
    const aba = carregarUltimaAba()
    if (aba === 'senhas') return '/cadastro/cadastro-senhas'
    return '/cadastro/cadastro-taxas'
  }

  return {
    carregarUltimaAba,
    salvarUltimaAba,
    obterRotaUltimaAba
  }
}

const { carregarUltimaAba, salvarUltimaAba, obterRotaUltimaAba } = useCadastroNavigation()
const route = useRoute()

// Função para registrar visita a uma aba
const registrarVisitaAba = (aba) => {
  salvarUltimaAba(aba)
}

// Redirecionar para a última aba visitada se estiver na rota raiz
onMounted(() => {
  if (route.path === '/cadastro') {
    const rotaDestino = obterRotaUltimaAba()
    console.log('🔄 [CADASTRO] Redirecionando para última aba visitada:', rotaDestino)
    navigateTo(rotaDestino)
  }
})
</script>
