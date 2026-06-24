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
    />
    <IndexOverlay
      :sidebar-aberta="sidebarAberta"
      @fechar-sidebar="sidebarAberta = false"
    />
    <div class="flex-1 flex flex-col" :class="{ 'ml-64': sidebarAberta && windowWidth >= 1024 }">
      <IndexFiltros
        class="relative z-[90]"
        :empresas="empresas"
        v-model:empresa-selecionada="empresaSelecionada"
        v-model:filtro-data="filtroData"
        :sidebar-aberta="sidebarAberta"
        :tabs="tabs"
        :aba-ativa="abaAtiva"
        @empresa-changed="onEmpresaChanged"
        @aplicar-filtro="aplicarFiltros"
        @selecionar-aba="selecionarAba"
        @toggle-sidebar="sidebarAberta = !sidebarAberta"
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

const obterDatasPadraoMesAtual = () => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  const formatarData = (data) => {
    const anoAtual = data.getFullYear()
    const mesAtual = String(data.getMonth() + 1).padStart(2, '0')
    const diaAtual = String(data.getDate()).padStart(2, '0')
    return `${anoAtual}-${mesAtual}-${diaAtual}`
  }

  return {
    dataInicial: formatarData(new Date(ano, mes, 1)),
    dataFinal: formatarData(new Date(ano, mes + 1, 0))
  }
}

const sidebarAberta = ref(false)
const abaAtiva = ref('dashboard')
const windowWidth = ref(1024)
const loadingAplicacaoFiltros = ref(false)
const route = useRoute()
const { initializeAuth } = useAuth()
const portalInicializado = ref(false)
const isPublicRoute = computed(() => {
  return route.path === '/' || route.path === '/login' || route.path.startsWith('/reset-password')
})
const empresaSelecionada = ref('')
const filtroData = ref({
  dataInicial: '',
  dataFinal: ''
})
const { empresas, empresaSelecionada: empresaSelecionadaGlobal, fetchEmpresas } = useEmpresas()
const { filtrosGlobais, emitirEvento } = useGlobalFilters()
const { aplicarFiltros: aplicarFiltrosVendas } = useVendas()
const { fetchRecebimentos } = useRecebimentosCRUD()
const { buscarTransacoesBancarias, filtroAtivo: filtroAtivoBancos } = useExtratoDetalhado()
const aguardar = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const onEmpresaChanged = (empresa) => {
  empresaSelecionada.value = empresa || ''
  empresaSelecionadaGlobal.value = empresaSelecionada.value
}
const aplicarFiltros = async (dadosFiltros) => {
  const empresaParaFiltro = dadosFiltros.empresa || empresaSelecionada.value || ''
  const filtrosAplicados = {
    empresaSelecionada: empresaParaFiltro,
    dataInicial: dadosFiltros.dataInicial ?? filtroData.value.dataInicial,
    dataFinal: dadosFiltros.dataFinal ?? filtroData.value.dataFinal
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
    Object.assign(filtrosGlobais, filtrosAplicados)
    await sincronizarPaginasPrincipais()
    await sincronizarEventosSecundarios()
    const tempoMinimoExibicao = 450
    const tempoDecorrido = Date.now() - inicioLoading
    if (tempoDecorrido < tempoMinimoExibicao) {
      await aguardar(tempoMinimoExibicao - tempoDecorrido)
    }
  } finally {
    loadingAplicacaoFiltros.value = false
  }
}
const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'vendas', name: 'Vendas', icon: ChartBarIcon },
  { id: 'controladoria', name: 'Controladoria', icon: ClipboardDocumentListIcon },
  { id: 'cadastro', name: 'Cadastro', icon: CreditCardIcon },
  { id: 'pagamentos', name: 'Pagamentos', icon: DocumentCurrencyDollarIcon },
  { id: 'banco', name: 'Banco', icon: BanknotesIcon },
  { id: 'configuracoes', name: 'Configurações', icon: ArrowUpTrayIcon }
]
const abaAtual = computed(() => tabs.find(tab => tab.id === abaAtiva.value) || tabs[0])
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
const atualizarLarguraJanela = () => { if (process.client) windowWidth.value = window.innerWidth }

const inicializarPortal = async () => {
  if (portalInicializado.value) return

  try {
    await initializeAuth()
    filtroData.value = obterDatasPadraoMesAtual()
    await fetchEmpresas()
    if (!empresaSelecionada.value && empresas.value.length > 0) {
      empresaSelecionada.value = empresas.value[0].id
      empresaSelecionadaGlobal.value = empresas.value[0].id
    }
  } catch {}

  portalInicializado.value = true

  if (process.client) {
    window.addEventListener('resize', atualizarLarguraJanela)
    atualizarLarguraJanela()
  }
}

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
})
</script>

<style>
/* Ajuste global de escala visual para Full HD e acima */
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

/* Tabelas mais proporcionais quando o container é amplo */
.app-main table th,
.app-main table td {
  font-size: 0.8125rem;
}

@media (max-width: 1366px) {
  :root {
    font-size: 13px;
  }
}
</style>
