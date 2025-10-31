<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Pagamentos</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Gestão de recebimentos e previsões</p>
        </div>
      </div>

      <!-- Navegação das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink 
              to="/Pagamentos/Recebimentos" 
              @click="registrarVisitaAba('recebimentos')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/Pagamentos/Recebimentos' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              Recebimentos
            </NuxtLink>
            <NuxtLink 
              to="/Pagamentos/Previsao-de-Pagamentos" 
              @click="registrarVisitaAba('previsao')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/Pagamentos/Previsao-de-Pagamentos' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              Previsão de Recebimentos
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
  title: 'Pagamentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de recebimentos e previsões' }
  ]
})

// Composable para navegação dos pagamentos
const usePagamentosNavigation = () => {
  const STORAGE_KEY = 'pagamentos_ultima_aba'

  const carregarUltimaAba = () => {
    if (process.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && ['recebimentos', 'previsao'].includes(saved)) {
        return saved
      }
    }
    return 'recebimentos' // padrão
  }

  const salvarUltimaAba = (aba) => {
    if (process.client && ['recebimentos', 'previsao'].includes(aba)) {
      localStorage.setItem(STORAGE_KEY, aba)
    }
  }

  const obterRotaUltimaAba = () => {
    const aba = carregarUltimaAba()
    return aba === 'previsao' 
      ? '/Pagamentos/Previsao-de-Pagamentos'
      : '/Pagamentos/Recebimentos'
  }

  return {
    carregarUltimaAba,
    salvarUltimaAba,
    obterRotaUltimaAba
  }
}

const { carregarUltimaAba, salvarUltimaAba, obterRotaUltimaAba } = usePagamentosNavigation()
const route = useRoute()

// Função para registrar visita a uma aba
const registrarVisitaAba = (aba) => {
  salvarUltimaAba(aba)
}

// Redirecionar para a última aba visitada se estiver na rota raiz
onMounted(() => {
  if (route.path === '/Pagamentos') {
    const rotaDestino = obterRotaUltimaAba()
    console.log('🔄 [PAGAMENTOS] Redirecionando para última aba visitada:', rotaDestino)
    navigateTo(rotaDestino)
  }
})
</script>