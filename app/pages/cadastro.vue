<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Cadastro</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Gestão de cadastros e configurações</p>
        </div>
      </div>

      <!-- Navegação das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink 
              to="/cadastro/cadastro-taxas" 
              @click="registrarVisitaAba('taxas')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/cadastro/cadastro-taxas' || $route.path === '/cadastro' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              Cadastro de Taxas
            </NuxtLink>
            <NuxtLink 
              to="/cadastro/cadastro-senhas" 
              @click="registrarVisitaAba('senhas')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/cadastro/cadastro-senhas' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              Cadastro de Senhas e Bancos
            </NuxtLink>
          </nav>
        </div>
      </div>

      <!-- Conteúdo das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
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