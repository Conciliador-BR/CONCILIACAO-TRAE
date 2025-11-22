<template>
  <div v-if="isLoginRoute">
    <NuxtPage />
  </div>
  <div v-else class="min-h-screen bg-gray-50 flex">
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
      <main class="flex-1 overflow-y-auto">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import IndexFiltros from '~/components/index/IndexFiltros.vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useVendas } from '~/composables/useVendas'
const sidebarAberta = ref(false)
const abaAtiva = ref('dashboard')
const windowWidth = ref(1024)
const route = useRoute()
const isLoginRoute = computed(() => route.path === '/login')
const empresaSelecionadaLocal = ref('')
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
const { empresas, empresaSelecionada: empresaSelecionadaGlobal, fetchEmpresas } = useEmpresas()
const { filtrosGlobais, aplicarFiltros: aplicarFiltrosGlobais, reinicializarDatasPadrao } = useGlobalFilters()
const { aplicarFiltros: aplicarFiltrosVendas } = useVendas()
const empresaSelecionada = computed({
  get: () => empresaSelecionadaGlobal.value,
  set: (value) => {
    empresaSelecionadaGlobal.value = value ?? ''
    empresaSelecionadaLocal.value = value ?? ''
  }
})
const obterNomeEmpresa = (empresaValor) => {
  if (!empresaValor) return ''
  if (typeof empresaValor === 'string' && isNaN(empresaValor)) return empresaValor
  const emp = empresas.value.find(e => e?.id == empresaValor || e?.value == empresaValor)
  return emp?.nome || emp?.label || empresaValor
}
const onEmpresaChanged = (empresa) => {
  const empresaValue = empresa || ''
  empresaSelecionadaLocal.value = empresaValue
  empresaSelecionadaGlobal.value = empresaValue
  filtrosGlobais.empresaSelecionada = empresaValue
}
const aplicarFiltros = (dadosFiltros) => {
  const empresaParaFiltro = dadosFiltros.empresa || empresaSelecionadaGlobal.value || ''
  if (filtrosGlobais.empresaSelecionada !== empresaParaFiltro) {
    filtrosGlobais.empresaSelecionada = empresaParaFiltro
  }
  aplicarFiltrosGlobais({ empresaSelecionada: empresaParaFiltro })
  if (process.client && window.location.pathname === '/vendas') {
    const nomeEmpresa = obterNomeEmpresa(dadosFiltros.empresa)
    aplicarFiltrosVendas({
      empresa: nomeEmpresa,
      dataInicial: filtrosGlobais.dataInicial,
      dataFinal: filtrosGlobais.dataFinal
    })
  }
}
const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'vendas', name: 'Vendas', icon: ChartBarIcon },
  { id: 'controladoria', name: 'Controladoria', icon: ClipboardDocumentListIcon },
  { id: 'cadastro', name: 'Cadastro', icon: CreditCardIcon },
  { id: 'pagamentos', name: 'Pagamentos', icon: DocumentCurrencyDollarIcon },
  { id: 'banco', name: 'Banco', icon: BanknotesIcon },
  { id: 'importar', name: 'Importar', icon: ArrowUpTrayIcon }
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
    case 'importar': navigateTo('/importar'); break
  }
}
const atualizarLarguraJanela = () => { if (process.client) windowWidth.value = window.innerWidth }
onMounted(async () => {
  try {
    if (!filtrosGlobais.dataInicial || !filtrosGlobais.dataFinal) {
      reinicializarDatasPadrao(true)
    }
    await fetchEmpresas()
  } catch {}
  if (process.client) {
    window.addEventListener('resize', atualizarLarguraJanela)
    atualizarLarguraJanela()
  }
})
onUnmounted(() => { if (process.client) window.removeEventListener('resize', atualizarLarguraJanela) })
</script>