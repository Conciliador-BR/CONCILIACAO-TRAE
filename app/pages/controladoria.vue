<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Controladoria</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Gestão de vendas e recebimentos</p>
        </div>
      </div>

      <!-- Navegação das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink 
              to="/controladoria/controladoria-vendas" 
              @click="registrarVisitaAba('vendas')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/controladoria/controladoria-vendas' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              Vendas
            </NuxtLink>
            <NuxtLink 
              to="/controladoria/controladoria-recebimentos" 
              @click="registrarVisitaAba('recebimentos')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/controladoria/controladoria-recebimentos' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              Recebimentos
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
  title: 'Controladoria - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de vendas e recebimentos' }
  ]
})

// Composable para navegação da controladoria
const useControladoriaNavigation = () => {
  const STORAGE_KEY = 'controladoria_ultima_aba'

  const carregarUltimaAba = () => {
    if (process.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && ['vendas', 'recebimentos'].includes(saved)) {
        return saved
      }
    }
    return 'vendas' // padrão
  }

  const salvarUltimaAba = (aba) => {
    if (process.client && ['vendas', 'recebimentos'].includes(aba)) {
      localStorage.setItem(STORAGE_KEY, aba)
    }
  }

  const obterRotaUltimaAba = () => {
    const aba = carregarUltimaAba()
    return aba === 'recebimentos' 
      ? '/controladoria/controladoria-recebimentos'
      : '/controladoria/controladoria-vendas'
  }

  return {
    carregarUltimaAba,
    salvarUltimaAba,
    obterRotaUltimaAba
  }
}

const { carregarUltimaAba, salvarUltimaAba, obterRotaUltimaAba } = useControladoriaNavigation()
const route = useRoute()

// Função para registrar visita a uma aba
const registrarVisitaAba = (aba) => {
  salvarUltimaAba(aba)
}

// Redirecionar para a última aba visitada se estiver na rota raiz
onMounted(() => {
  if (route.path === '/controladoria') {
    const rotaDestino = obterRotaUltimaAba()
    console.log('🔄 Redirecionando para última aba visitada:', rotaDestino)
    navigateTo(rotaDestino)
  }
})
</script>