<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <IndexSidebar
      :sidebar-aberta="sidebarAberta"
      :tabs="tabs"
      :aba-ativa="abaAtiva"
      @fechar="sidebarAberta = false"
      @selecionar-aba="selecionarAba"
    />
    
    <!-- Overlay para mobile -->
    <IndexOverlay
      :sidebar-aberta="sidebarAberta"
      @fechar-sidebar="sidebarAberta = false"
    />
    
    <!-- Conteúdo Principal -->
    <div class="flex-1 flex flex-col" :class="{ 'ml-64': sidebarAberta && windowWidth >= 1024 }">
      <!-- Header -->
      <IndexHeader
        :aba-atual="abaAtual"
        @toggle-sidebar="sidebarAberta = !sidebarAberta"
      />
      
      <!-- Abas Horizontais (quando sidebar fechada) -->
      <IndexTabsHorizontal
        :sidebar-aberta="sidebarAberta"
        :tabs="tabs"
        :aba-ativa="abaAtiva"
        @selecionar-aba="selecionarAba"
      />
      
      <!-- Conteúdo das Páginas -->
      <main class="flex-1 overflow-y-auto">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { 
  HomeIcon, 
  ChartBarIcon, 
  CreditCardIcon, 
  DocumentCurrencyDollarIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'

// Importar componentes
import IndexSidebar from '~/components/index/IndexSidebar.vue'
import IndexHeader from '~/components/index/IndexHeader.vue'
import IndexTabsHorizontal from '~/components/index/IndexTabsHorizontal.vue'
import IndexOverlay from '~/components/index/IndexOverlay.vue'

// Estado da aplicação
const sidebarAberta = ref(false)
const abaAtiva = ref('dashboard')
const windowWidth = ref(0)

// Definição das abas
const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'vendas', name: 'Vendas', icon: ChartBarIcon },
  { id: 'controladoria', name: 'Controladoria', icon: ClipboardDocumentListIcon },
  { id: 'taxas', name: 'Taxas', icon: CreditCardIcon },
  { id: 'pagamentos', name: 'Pagamentos', icon: DocumentCurrencyDollarIcon },
  { id: 'banco', name: 'Banco', icon: BanknotesIcon }
]

// Computed properties
const abaAtual = computed(() => {
  return tabs.find(tab => tab.id === abaAtiva.value) || tabs[0]
})

// Métodos
const selecionarAba = (abaId) => {
  abaAtiva.value = abaId
  if (windowWidth.value < 1024) {
    sidebarAberta.value = false
  }
  
  // Navegar para a página correspondente
  switch(abaId) {
    case 'dashboard':
      navigateTo('/?aba=dashboard')
      break
    case 'vendas':
      navigateTo('/?aba=vendas')
      break
    case 'controladoria':
      navigateTo('/controladoria')
      break
    case 'taxas':
      navigateTo('/?aba=taxas')
      break
    case 'pagamentos':
      navigateTo('/?aba=pagamentos')
      break
    case 'banco':
      navigateTo('/?aba=banco')
      break
  }
}

// Detectar mudanças na rota para atualizar aba ativa
const route = useRoute()
watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/controladoria')) {
    abaAtiva.value = 'controladoria'
  } else if (newPath === '/') {
    // Verificar parâmetro de query para definir aba ativa
    const abaQuery = route.query.aba
    if (abaQuery && tabs.find(tab => tab.id === abaQuery)) {
      abaAtiva.value = abaQuery
    } else {
      abaAtiva.value = 'dashboard' // padrão
    }
  }
}, { immediate: true })

// Também observar mudanças na query
watch(() => route.query.aba, (novaAba) => {
  if (novaAba && tabs.find(tab => tab.id === novaAba)) {
    abaAtiva.value = novaAba
  }
}, { immediate: true })

// Gerenciar tamanho da janela
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  updateWindowWidth()
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})
</script>
