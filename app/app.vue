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

      <!-- Filtros Simples (sempre visíveis em todas as páginas) -->
      <div class="bg-white p-4 shadow-sm border-b">
        <div class="flex flex-wrap items-center justify-center gap-4">
          <!-- Seletor de Empresa -->
          <SeletorEmpresa
            v-model="empresaSelecionada"
            :empresas="empresas"
            @empresa-changed="onEmpresaChanged"
          />

          <!-- Filtro de Data -->
          <FiltroData
            v-model="filtroData"
            @data-changed="onDataChanged"
          />

          <!-- Botão Aplicar Filtro -->
          <BotaoAplicarFiltro
            :empresa-selecionada="empresaSelecionada"
            :filtro-data="filtroData"
            @aplicar-filtro="aplicarFiltros"
          />
        </div>
      </div>

      <!-- Conteúdo das Páginas -->
      <main class="flex-1 overflow-y-auto">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  HomeIcon,
  ChartBarIcon,
  CreditCardIcon,
  DocumentCurrencyDollarIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'

// Componentes de layout
import IndexSidebar from '~/components/index/IndexSidebar.vue'
import IndexHeader from '~/components/index/IndexHeader.vue'
import IndexTabsHorizontal from '~/components/index/IndexTabsHorizontal.vue'
import IndexOverlay from '~/components/index/IndexOverlay.vue'

// Filtros simples (sempre presentes)
import SeletorEmpresa from '~/components/SeletorEmpresa.vue'
import FiltroData from '~/components/FiltroData.vue'
import BotaoAplicarFiltro from '~/components/BotaoAplicarFiltro.vue'

// Composables
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useVendas } from '~/composables/useVendas'

// Estado da aplicação
const sidebarAberta = ref(false)
const abaAtiva = ref('dashboard')
const windowWidth = ref(0)

// Estados dos filtros (apenas os três componentes)
const empresaSelecionada = ref('')
const filtroData = ref({ dataInicial: '', dataFinal: '' })

// Dados de empresas e carregamento
const { empresas, fetchEmpresas } = useEmpresas()

// Aplicador de filtros global para notificar a página atual
const { aplicarFiltros: aplicarFiltrosGlobais } = useGlobalFilters()
const { aplicarFiltros: aplicarFiltrosVendas } = useVendas()

// Definição das abas
const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'vendas', name: 'Vendas', icon: ChartBarIcon },
  { id: 'controladoria', name: 'Controladoria', icon: ClipboardDocumentListIcon },
  { id: 'taxas', name: 'Taxas', icon: CreditCardIcon },
  { id: 'pagamentos', name: 'Pagamentos', icon: DocumentCurrencyDollarIcon },
  { id: 'banco', name: 'Banco', icon: BanknotesIcon },
  { id: 'importar', name: 'Importar', icon: ArrowUpTrayIcon }
]

// Aba atual (dados para o header)
const abaAtual = computed(() => {
  return tabs.find(tab => tab.id === abaAtiva.value) || tabs[0]
})

// Converte ID -> Nome da empresa para compatibilidade com filtros de vendas
const obterNomeEmpresa = (empresaValor) => {
  if (!empresaValor) return ''
  // Se já é nome (string não numérica), retorna direto
  if (typeof empresaValor === 'string' && isNaN(empresaValor)) return empresaValor
  // Tenta localizar pelo id ou value
  const emp = empresas.value.find(e => e?.id == empresaValor || e?.value == empresaValor)
  return emp?.nome || emp?.label || empresaValor
}

// Handlers dos filtros
const onEmpresaChanged = (empresa) => {
  empresaSelecionada.value = empresa
}

const onDataChanged = (data) => {
  filtroData.value = data
}

const aplicarFiltros = (dadosFiltros) => {
  // Verifica se está na página vendas
  if (process.client && window.location.pathname === '/vendas') {
    // Aplica filtros específicos de vendas
    const nomeEmpresa = obterNomeEmpresa(dadosFiltros.empresa)
    aplicarFiltrosVendas({
      empresa: nomeEmpresa,
      dataInicial: dadosFiltros.dataInicial,
      dataFinal: dadosFiltros.dataFinal
    })
  } else {
    // Aplica filtros globais para outras páginas
    const nomeEmpresa = obterNomeEmpresa(dadosFiltros.empresa)
    aplicarFiltrosGlobais({
      empresa: nomeEmpresa,
      dataInicial: dadosFiltros.dataInicial,
      dataFinal: dadosFiltros.dataFinal
    })
  }
}

// Navegação entre abas
const selecionarAba = (abaId) => {
  abaAtiva.value = abaId
  if (windowWidth.value < 1024) {
    sidebarAberta.value = false
  }

  switch (abaId) {
    case 'dashboard':
      navigateTo('/')
      break
    case 'vendas':
      navigateTo('/vendas')
      break
    case 'controladoria':
      navigateTo('/controladoria')
      break
    case 'taxas':
      navigateTo('/taxas')
      break
    case 'pagamentos':
      navigateTo('/pagamentos')
      break
    case 'banco':
      navigateTo('/bancos')
      break
    case 'importar':
      navigateTo('/importar')
      break
  }
}

// Responsividade do layout
const atualizarTamanhoJanela = () => {
  windowWidth.value = window.innerWidth
}

// Inicialização
onMounted(async () => {
  await fetchEmpresas()
  atualizarTamanhoJanela()
  window.addEventListener('resize', atualizarTamanhoJanela)
})

onUnmounted(() => {
  window.removeEventListener('resize', atualizarTamanhoJanela)
})
</script>