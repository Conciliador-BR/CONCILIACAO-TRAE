<template>
  <div class="page-fluid min-h-screen bg-[#F4F8FC]">
    <div class="w-full px-2 sm:px-4 lg:px-5 xl:px-6 2xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-4 sm:px-6 lg:px-7 xl:px-8 2xl:px-10 py-4 sm:py-6 border-b border-[#244b77]">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-white">Pagamentos</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-white/80 mt-1">Gestão de recebimentos e previsões</p>
        </div>
      </div>

      
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-7 xl:px-8 2xl:px-10 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <NuxtLink 
              to="/Pagamentos/Recebimentos" 
              @click="registrarVisitaAba('recebimentos')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/Pagamentos/Recebimentos' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]' : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'"
            >
              Recebimentos
            </NuxtLink>
            <NuxtLink 
              to="/Pagamentos/Previsao-de-Pagamentos" 
              @click="registrarVisitaAba('previsao')"
              class="py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap"
              :class="$route.path === '/Pagamentos/Previsao-de-Pagamentos' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]' : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F7FAFC]'"
            >
              Previsão de Recebimentos
            </NuxtLink>
          </nav>
        </div>
      </div>

      
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="p-4 sm:p-5 lg:p-6 xl:p-7 2xl:p-8">
          <NuxtPage keepalive />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

useHead({
  title: 'Pagamentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de recebimentos e previsões' }
  ]
})

const usePagamentosNavigation = () => {
  const STORAGE_KEY = 'pagamentos_ultima_aba'

  const carregarUltimaAba = () => {
    if (process.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && ['recebimentos', 'previsao'].includes(saved)) {
        return saved
      }
    }
    return 'recebimentos'
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

  return { carregarUltimaAba, salvarUltimaAba, obterRotaUltimaAba }
}

const { carregarUltimaAba, salvarUltimaAba, obterRotaUltimaAba } = usePagamentosNavigation()
const route = useRoute()

const registrarVisitaAba = (aba) => { salvarUltimaAba(aba) }

onMounted(() => {
  const p = route.path
  if (p === '/Pagamentos' || p.toLowerCase() === '/pagamentos') {
    const rotaDestino = obterRotaUltimaAba()
    navigateTo(rotaDestino)
  }
})
</script>
