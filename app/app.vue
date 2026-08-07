<template>
  <div v-if="isPublicRoute">
    <NuxtPage />
  </div>
  <div v-else class="app-shell min-h-screen bg-[#F4F8FC] flex">
    <IndexSidebar
      :sidebar-aberta="sidebarAberta"
      :tabs="tabs"
      :aba-ativa="abaAtiva"
      @fechar="sidebarAberta = false"
      @selecionar-aba="selecionarAba"
      @logout="sairDoPortal"
    />
    <IndexOverlay
      :sidebar-aberta="sidebarAberta"
      @fechar-sidebar="sidebarAberta = false"
    />
    <div
      class="flex-1 flex flex-col"
      :class="{
        'ml-64': sidebarAberta && windowWidth >= 1024,
        'portal-compact-shell': compactLayoutEnabled
      }"
    >
      <IndexFiltros
        class="relative z-[90]"
        :empresas="empresas"
        v-model:empresa-selecionada="empresaSelecionadaRascunho"
        v-model:filtro-data="filtroDataRascunho"
        :sidebar-aberta="sidebarAberta"
        :tabs="tabs"
        :aba-ativa="abaAtiva"
        @empresa-changed="onEmpresaChanged"
        @aplicar-filtro="aplicarFiltros"
        @selecionar-aba="selecionarAba"
        @toggle-sidebar="sidebarAberta = !sidebarAberta"
        @logout="sairDoPortal"
      />
      <main class="app-main relative z-0 flex-1 overflow-y-auto">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </main>
    </div>
    <FiltroAplicacaoFlutuante
      :open="loadingAplicacaoFiltros"
      titulo="Aplicando filtros"
      descricao="Carregando vendas, recebimentos e extratos bancarios..."
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeIcon,
  ChartBarIcon,
  CreditCardIcon,
  DocumentCurrencyDollarIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'
import FiltroAplicacaoFlutuante from '~/components/index/FiltroAplicacaoFlutuante.vue'
import IndexFiltros from '~/components/index/IndexFiltros.vue'
import { useVendas } from '~/composables/useVendas'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useUserAccess } from '~/composables/useUserAccess'

const sidebarAberta = ref(false)
const abaAtiva = ref('dashboard')
const windowWidth = ref(1024)
const loadingAplicacaoFiltros = ref(false)
const route = useRoute()
const { initializeAuth, logout } = useAuth()
const { canAccessConfig } = useUserAccess()
const portalInicializado = ref(false)
const isPublicRoute = computed(() => {
  return route.path === '/' || route.path === '/login' || route.path.startsWith('/reset-password')
})
const isConfiguracoesCadastroRoute = computed(() => {
  return route.path === '/configuracoes/importacao/cadastro' || route.path.startsWith('/configuracoes/importacao/cadastro/')
})
const compactLayoutEnabled = computed(() => !isPublicRoute.value && !isConfiguracoesCadastroRoute.value)
const { empresas, empresaSelecionada: empresaSelecionadaGlobal, fetchEmpresas } = useEmpresas()
const {
  filtrosGlobais,
  atualizarFiltros,
  emitirEvento,
  reinicializarDatasPadrao,
  restaurarFiltrosDoStorage,
  inicializarPersistencia
} = useGlobalFilters()
const { aplicarFiltros: aplicarFiltrosVendas } = useVendas()
const { fetchRecebimentos } = useRecebimentosCRUD()
const { buscarTransacoesBancarias, filtroAtivo: filtroAtivoBancos } = useExtratoDetalhado()
const aguardar = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const empresaSelecionadaRascunho = ref('')
const filtroDataRascunho = ref({
  dataInicial: '',
  dataFinal: ''
})

inicializarPersistencia()

const sincronizarRascunhoFiltros = (dados = {}) => {
  empresaSelecionadaRascunho.value = dados.empresaSelecionada ?? filtrosGlobais.empresaSelecionada ?? ''
  filtroDataRascunho.value = {
    dataInicial: dados.dataInicial ?? filtrosGlobais.dataInicial ?? '',
    dataFinal: dados.dataFinal ?? filtrosGlobais.dataFinal ?? ''
  }
}

const onEmpresaChanged = (empresa) => {
  empresaSelecionadaRascunho.value = empresa || ''
}

const aplicarFiltros = async (dadosFiltros) => {
  const empresaParaFiltro = dadosFiltros.empresa ?? empresaSelecionadaRascunho.value ?? ''
  const filtrosAplicados = {
    empresaSelecionada: empresaParaFiltro,
    dataInicial: dadosFiltros.dataInicial ?? filtroDataRascunho.value.dataInicial,
    dataFinal: dadosFiltros.dataFinal ?? filtroDataRascunho.value.dataFinal
  }

  const sincronizarPaginasPrincipais = async () => {
    const filtrosBancos = {
      bancoSelecionado: filtroAtivoBancos.value?.bancoSelecionado || 'TODOS',
      adquirente: filtroAtivoBancos.value?.adquirente || 'TODOS',
      dataInicial: filtrosAplicados.dataInicial || '',
      dataFinal: filtrosAplicados.dataFinal || ''
    }

    await Promise.allSettled([
      aplicarFiltrosVendas({
        empresa: filtrosAplicados.empresaSelecionada,
        dataInicial: filtrosAplicados.dataInicial,
        dataFinal: filtrosAplicados.dataFinal
      }),
      fetchRecebimentos(),
      buscarTransacoesBancarias(filtrosBancos, true)
    ])
  }

  const sincronizarEventosSecundarios = async () => {
    await Promise.allSettled([
      emitirEvento('filtrar-controladoria-vendas', filtrosAplicados),
      emitirEvento('filtrar-controladoria-recebimentos', filtrosAplicados),
      emitirEvento('filtrar-dashboard', filtrosAplicados),
      emitirEvento('filtros-aplicados', filtrosAplicados)
    ])
  }

  try {
    loadingAplicacaoFiltros.value = true
    await nextTick()
    await aguardar(25)
    const inicioLoading = Date.now()
    empresaSelecionadaGlobal.value = empresaParaFiltro
    atualizarFiltros(filtrosAplicados)
    await sincronizarPaginasPrincipais()
    await sincronizarEventosSecundarios()
    sincronizarRascunhoFiltros(filtrosAplicados)
    const tempoMinimoExibicao = 450
    const tempoDecorrido = Date.now() - inicioLoading
    if (tempoDecorrido < tempoMinimoExibicao) {
      await aguardar(tempoMinimoExibicao - tempoDecorrido)
    }
  } finally {
    loadingAplicacaoFiltros.value = false
  }
}
const tabs = computed(() => {
  const baseTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'vendas', name: 'Vendas', icon: ChartBarIcon },
    { id: 'controladoria', name: 'Controladoria', icon: ClipboardDocumentListIcon },
    { id: 'cadastro', name: 'Cadastro', icon: CreditCardIcon },
    { id: 'pagamentos', name: 'Pagamentos', icon: DocumentCurrencyDollarIcon },
    { id: 'banco', name: 'Banco', icon: BanknotesIcon }
  ]

  if (canAccessConfig.value) {
    baseTabs.push({ id: 'configuracoes', name: 'Configurações', icon: ArrowUpTrayIcon })
  }

  return baseTabs
})
const abaAtual = computed(() => tabs.value.find(tab => tab.id === abaAtiva.value) || tabs.value[0])
const selecionarAba = (abaId) => {
  abaAtiva.value = abaId
  if (windowWidth.value < 1024) sidebarAberta.value = false
  switch (abaId) {
    case 'dashboard': navigateTo('/dashboard'); break
    case 'vendas': navigateTo('/vendas'); break
    case 'controladoria': navigateTo('/controladoria'); break
    case 'cadastro': navigateTo('/cadastro'); break
    case 'pagamentos': navigateTo('/pagamentos'); break
    case 'banco': navigateTo('/bancos'); break
    case 'configuracoes': navigateTo('/configuracoes'); break
  }
}
const sairDoPortal = async () => {
  try {
    await logout()
  } catch {}

  sidebarAberta.value = false
  await navigateTo('/')
}
const atualizarLarguraJanela = () => { if (process.client) windowWidth.value = window.innerWidth }
const sincronizarClasseLayoutCompacto = () => {
  if (!process.client) return
  document.documentElement.classList.toggle('portal-compact-ui', compactLayoutEnabled.value)
}

const inicializarPortal = async () => {
  if (portalInicializado.value) return

  try {
    await initializeAuth()
    restaurarFiltrosDoStorage()
    await fetchEmpresas()

    if (!filtrosGlobais.dataInicial || !filtrosGlobais.dataFinal) {
      reinicializarDatasPadrao()
    }

    const empresaSalvaExiste = empresas.value.some(empresa => String(empresa.id) === String(filtrosGlobais.empresaSelecionada))

    if (empresaSalvaExiste) {
      empresaSelecionadaGlobal.value = filtrosGlobais.empresaSelecionada
    } else if (empresas.value.length > 0) {
      const primeiraEmpresaId = empresas.value[0].id
      atualizarFiltros({ empresaSelecionada: primeiraEmpresaId })
      empresaSelecionadaGlobal.value = primeiraEmpresaId
    }

    sincronizarRascunhoFiltros()
  } catch {}

  portalInicializado.value = true

  if (process.client) {
    window.addEventListener('resize', atualizarLarguraJanela)
    atualizarLarguraJanela()
  }
}

watch(
  compactLayoutEnabled,
  () => {
    sincronizarClasseLayoutCompacto()
  },
  { immediate: true }
)

watch(
  () => route.path,
  async () => {
    if (isPublicRoute.value) return
    await inicializarPortal()
  },
  { immediate: true }
)

onUnmounted(() => {
  if (process.client) window.removeEventListener('resize', atualizarLarguraJanela)
  if (process.client) document.documentElement.classList.remove('portal-compact-ui')
})
</script>

<style>
/* Base preservada para páginas que já estão no tamanho ideal */
:root {
  font-size: 14px;
}

body {
  font-size: 0.875rem;
  line-height: 1.35;
}

.app-main {
  padding-inline: 0.625rem;
}

.app-main > * {
  width: 100%;
  max-width: 1600px;
  margin-inline: auto;
}

.app-main > *.page-fluid {
  max-width: none;
}

.app-main table th,
.app-main table td {
  font-size: 0.8125rem;
}

/* Compactação global para o portal, preservando Configurações > Importação > Cadastro */
html.portal-compact-ui {
  font-size: 12px;
}

html.portal-compact-ui body {
  font-size: 0.8125rem;
  line-height: 1.3;
}

.portal-compact-shell .app-main {
  padding-inline: 0.5rem;
}

.portal-compact-shell .app-main > * {
  max-width: 1520px;
}

.portal-compact-shell .app-main table th,
.portal-compact-shell .app-main table td {
  font-size: 0.75rem;
}

@media (max-width: 1366px) {
  :root {
    font-size: 13px;
  }

  html.portal-compact-ui {
    font-size: 11px;
  }
}
</style>
