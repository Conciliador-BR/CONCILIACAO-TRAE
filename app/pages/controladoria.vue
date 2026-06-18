<template>
  <div class="min-h-screen bg-[#F4F8FC]">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-[#244b77]">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-white">Controladoria</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-white/80 mt-1">Gestão de vendas e recebimentos</p>
        </div>
      </div>

      <!-- Navegação das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink 
              to="/controladoria/controladoria-vendas" 
              @click="registrarVisitaAba('vendas')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/controladoria/controladoria-vendas' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]' : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'"
            >
              Vendas
            </NuxtLink>
            <NuxtLink 
              to="/controladoria/controladoria-recebimentos" 
              @click="registrarVisitaAba('recebimentos')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/controladoria/controladoria-recebimentos' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]' : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'"
            >
              Recebimentos
            </NuxtLink>
            <NuxtLink 
              to="/controladoria/analise-de-vendas" 
              @click="registrarVisitaAba('analise')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/controladoria/analise-de-vendas' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]' : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'"
            >
              Análise de Vendas
            </NuxtLink>
            <NuxtLink 
              to="/controladoria/analise-de-recebimentos" 
              @click="registrarVisitaAba('analise-recebimentos')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/controladoria/analise-de-recebimentos' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]' : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'"
            >
              Análise de Recebimentos
            </NuxtLink>
          </nav>
        </div>
      </div>

      <!-- Conteúdo das Subpáginas -->
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
          <NuxtPage
            :page-key="getControladoriaPageKey"
            :keepalive="keepAliveConfig"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

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
      if (saved && ['vendas', 'recebimentos', 'analise', 'analise-recebimentos'].includes(saved)) {
        return saved
      }
    }
    return 'vendas' // padrão
  }

  const salvarUltimaAba = (aba) => {
    if (process.client && ['vendas', 'recebimentos', 'analise', 'analise-recebimentos'].includes(aba)) {
      localStorage.setItem(STORAGE_KEY, aba)
    }
  }

  const obterRotaUltimaAba = () => {
    const aba = carregarUltimaAba()
    return aba === 'recebimentos' 
      ? '/controladoria/controladoria-recebimentos'
      : aba === 'analise-recebimentos'
      ? '/controladoria/analise-de-recebimentos'
      : aba === 'analise'
      ? '/controladoria/analise-de-vendas'
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
const { filtrosGlobais, escutarEvento } = useGlobalFilters()
const controladoriaCacheVersion = ref(0)
let removerListenerFiltrosAplicados = null

const empresaCacheScope = computed(() => {
  return String(filtrosGlobais.empresaSelecionada || 'sem-empresa').trim() || 'sem-empresa'
})

const keepAliveConfig = computed(() => ({
  max: 8
}))

const getControladoriaPageKey = (currentRoute) => {
  const path = String(currentRoute?.path || route.path || '/controladoria')
  return `${empresaCacheScope.value}:${controladoriaCacheVersion.value}:${path}`
}

// Função para registrar visita a uma aba
const registrarVisitaAba = (aba) => {
  salvarUltimaAba(aba)
}

watch(() => filtrosGlobais.empresaSelecionada, (novaEmpresa, empresaAnterior) => {
  if (novaEmpresa === empresaAnterior) return
  controladoriaCacheVersion.value += 1
})

// Redirecionar para a última aba visitada se estiver na rota raiz
onMounted(() => {
  removerListenerFiltrosAplicados = escutarEvento('filtros-aplicados', () => {
    controladoriaCacheVersion.value += 1
  })

  if (route.path === '/controladoria') {
    const rotaDestino = obterRotaUltimaAba()
    navigateTo(rotaDestino)
  }
})

onUnmounted(() => {
  if (typeof removerListenerFiltrosAplicados === 'function') {
    removerListenerFiltrosAplicados()
  }
})
</script>
