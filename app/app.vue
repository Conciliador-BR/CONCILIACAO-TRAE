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

// Componentes de filtros
import SeletorEmpresa from '~/components/SeletorEmpresa.vue'
import FiltroData from '~/components/FiltroData.vue'
import BotaoAplicarFiltro from '~/components/BotaoAplicarFiltro.vue'

// Composables
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useVendas } from '~/composables/useVendas'

// Estados do layout
const sidebarAberta = ref(false)
const abaAtiva = ref('dashboard')
const windowWidth = ref(1024)

// Estados dos filtros
const empresaSelecionadaLocal = ref('')

// Computed para sincronizar filtroData com filtros globais
const filtroData = computed({
  get: () => ({
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  }),
  set: (value) => {
    filtrosGlobais.dataInicial = value.dataInicial
    filtrosGlobais.dataFinal = value.dataFinal
  }
})

// Dados de empresas
const { empresas, empresaSelecionada: empresaSelecionadaGlobal, fetchEmpresas, loading, error } = useEmpresas()

// Aplicador de filtros global
const { filtrosGlobais, aplicarFiltros: aplicarFiltrosGlobais, reinicializarDatasPadrao } = useGlobalFilters()
const { aplicarFiltros: aplicarFiltrosVendas } = useVendas()

// Computed para sincronizar o estado local com o global
const empresaSelecionada = computed({
  get: () => empresaSelecionadaGlobal.value,
  set: (value) => {
    empresaSelecionadaGlobal.value = value ?? ''
    empresaSelecionadaLocal.value = value ?? ''
  }
})

// Converte ID -> Nome da empresa para compatibilidade com filtros de vendas
const obterNomeEmpresa = (empresaValor) => {
  if (!empresaValor) return ''
  if (typeof empresaValor === 'string' && isNaN(empresaValor)) return empresaValor
  const emp = empresas.value.find(e => e?.id == empresaValor || e?.value == empresaValor)
  return emp?.nome || emp?.label || empresaValor
}

// Handlers dos filtros
const onEmpresaChanged = (empresa) => {
  // Sincronizar tanto o estado local quanto o global
  const empresaValue = empresa || ''
  empresaSelecionadaLocal.value = empresaValue
  empresaSelecionadaGlobal.value = empresaValue
  
  // Sincronizar explicitamente com filtros globais
  filtrosGlobais.empresaSelecionada = empresaValue
  
  console.log('🏢 [APP] Empresa selecionada:', empresaValue, '(tipo:', typeof empresaValue, ')')
  console.log('🏢 [APP] Estado global sincronizado:', empresaSelecionadaGlobal.value)
  console.log('🏢 [APP] filtrosGlobais.empresaSelecionada:', filtrosGlobais.empresaSelecionada)
}

// onDataChanged removido - não é mais necessário pois filtroData é computed

const aplicarFiltros = (dadosFiltros) => {
  // Agora só aplica filtros quando o botão for clicado
  const empresaParaFiltro = dadosFiltros.empresa || empresaSelecionadaGlobal.value || ''
  
  console.log('🔄 [APP] Aplicando filtros com empresa:', empresaParaFiltro)
  console.log('🔄 [APP] Dados recebidos:', dadosFiltros)
  console.log('🔄 [APP] Datas atuais nos filtros globais:', {
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  })
  
  // Preservar datas atuais se não forem fornecidas
  const dataInicialFinal = dadosFiltros.dataInicial || filtrosGlobais.dataInicial
  const dataFinalFinal = dadosFiltros.dataFinal || filtrosGlobais.dataFinal
  
  aplicarFiltrosGlobais({
    empresaSelecionada: empresaParaFiltro,
    dataInicial: dataInicialFinal,
    dataFinal: dataFinalFinal
  })
  
  if (process.client && window.location.pathname === '/vendas') {
    const nomeEmpresa = obterNomeEmpresa(dadosFiltros.empresa)
    aplicarFiltrosVendas({
      empresa: nomeEmpresa,
      dataInicial: dataInicialFinal,
      dataFinal: dataFinalFinal
    })
  }
}

// Definição das abas
const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'vendas', name: 'Vendas', icon: ChartBarIcon },
  { id: 'controladoria', name: 'Controladoria', icon: ClipboardDocumentListIcon },
  { id: 'cadastro', name: 'Cadastro', icon: CreditCardIcon },
  { id: 'pagamentos', name: 'Pagamentos', icon: DocumentCurrencyDollarIcon },
  { id: 'banco', name: 'Banco', icon: BanknotesIcon },
  { id: 'importar', name: 'Importar', icon: ArrowUpTrayIcon }
]

// Aba atual (dados para o header)
const abaAtual = computed(() => {
  return tabs.find(tab => tab.id === abaAtiva.value) || tabs[0]
})

// Navegação entre abas
const selecionarAba = (abaId) => {
  abaAtiva.value = abaId
  if (windowWidth.value < 1024) {
    sidebarAberta.value = false
  }

  switch (abaId) {
    case 'dashboard':
      navigateTo('/dashboard')
      break
    case 'vendas':
      navigateTo('/vendas')
      break
    case 'controladoria':
      navigateTo('/controladoria')
      break
    case 'cadastro':
      navigateTo('/cadastro')
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

// Função para atualizar largura da janela
const atualizarLarguraJanela = () => {
  if (process.client) {
    windowWidth.value = window.innerWidth
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Inicializar datas padrão do mês atual
    reinicializarDatasPadrao()
    
    await fetchEmpresas()
  } catch (err) {
    console.error('Erro ao carregar empresas:', err)
  }
  
  if (process.client) {
    window.addEventListener('resize', atualizarLarguraJanela)
    atualizarLarguraJanela()
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('resize', atualizarLarguraJanela)
  }
})
</script>