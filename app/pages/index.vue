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
      
      <!-- Filtros Globais -->
      <IndexFilters
        v-model:empresa-selecionada="empresaSelecionada"
        v-model:filtro-data="filtroData"
        :empresas="empresas"
        @empresa-changed="onEmpresaChanged"
        @data-changed="onDataChanged"
        @aplicar-filtro="aplicarFiltroVendas"
      />
      
      <!-- Conteúdo Principal -->
      <IndexMainContent
        :aba-ativa="abaAtiva"
        :vendas="vendasFiltradas"
        :taxas="taxas"
        :resumo-calculado="resumoCalculado"
        :empresa-selecionada-nome="empresaSelecionadaNome"
        :filtro-data="filtroData"
        @update:vendas="vendas = $event"
        @update:taxas="taxas = $event"
        @vendas-changed="atualizarResumo"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { 
  HomeIcon, 
  ChartBarIcon, 
  CreditCardIcon, 
  DocumentCurrencyDollarIcon,
  BanknotesIcon,
  BuildingLibraryIcon
} from '@heroicons/vue/24/outline'

// Importar componentes
import IndexSidebar from '~/components/index/IndexSidebar.vue'
import IndexHeader from '~/components/index/IndexHeader.vue'
import IndexFilters from '~/components/index/IndexFilters.vue'
import IndexTabsHorizontal from '~/components/index/IndexTabsHorizontal.vue'
import IndexMainContent from '~/components/index/IndexMainContent.vue'
import IndexOverlay from '~/components/index/IndexOverlay.vue'

// Estado da aplicação
const sidebarAberta = ref(false)
const abaAtiva = ref('dashboard')
const windowWidth = ref(0)

// Dados reativos
const vendas = ref([])
const vendasOriginais = ref([]) // Manter uma cópia das vendas originais
const taxas = ref([])
const empresaSelecionada = ref('')
const filtroData = reactive({
  dataInicial: '',
  dataFinal: ''
})

// Estado do filtro
const filtroAtivo = ref(false)

// Composables
const { getEmpresas } = useEmpresas()
const empresas = getEmpresas()

// Definição das abas
const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'vendas', name: 'Vendas', icon: ChartBarIcon },
  { id: 'taxas', name: 'Taxas', icon: CreditCardIcon },
  { id: 'pagamentos', name: 'Pagamentos', icon: DocumentCurrencyDollarIcon },
  { id: 'banco', name: 'Banco', icon: BanknotesIcon }
]

// Computed properties
const abaAtual = computed(() => {
  return tabs.find(tab => tab.id === abaAtiva.value) || tabs[0]
})

const empresaSelecionadaNome = computed(() => {
  const empresa = empresas.find(e => e.id.toString() === empresaSelecionada.value)
  return empresa ? empresa.nome : ''
})

const vendasFiltradas = computed(() => {
  if (!filtroAtivo.value) {
    return vendas.value
  }

  return vendas.value.filter(venda => {
    // Filtro por empresa
    const empresaCorresponde = !empresaSelecionada.value || 
      venda.empresa === empresaSelecionadaNome.value

    // Filtro por data
    let dataCorresponde = true
    if (filtroData.dataInicial || filtroData.dataFinal) {
      const dataVenda = new Date(venda.dataVenda)
      
      if (filtroData.dataInicial) {
        const dataInicial = new Date(filtroData.dataInicial)
        dataCorresponde = dataCorresponde && dataVenda >= dataInicial
      }
      
      if (filtroData.dataFinal) {
        const dataFinal = new Date(filtroData.dataFinal)
        // Adicionar 23:59:59 à data final para incluir todo o dia
        dataFinal.setHours(23, 59, 59, 999)
        dataCorresponde = dataCorresponde && dataVenda <= dataFinal
      }
    }

    return empresaCorresponde && dataCorresponde
  })
})

const resumoCalculado = computed(() => {
  const vendasParaResumo = vendasFiltradas.value
  
  if (!vendasParaResumo || vendasParaResumo.length === 0) {
    return {
      vendasBrutas: 0,
      qtdVendasBrutas: 0,
      taxa: 0,
      taxaMedia: 0,
      vendasLiquidas: 0,
      qtdVendasLiquidas: 0,
      debitos: 0,
      qtdDebitos: 0,
      rejeitados: 0,
      qtdRejeitados: 0,
      totalLiquido: 0
    }
  }

  const vendasBrutas = vendasParaResumo.reduce((sum, venda) => sum + (parseFloat(venda.vendaBruto) || 0), 0)
  const taxa = vendasParaResumo.reduce((sum, venda) => sum + (parseFloat(venda.valorTaxa) || 0), 0)
  const vendasLiquidas = vendasParaResumo.reduce((sum, venda) => sum + (parseFloat(venda.vendaLiquido) || 0), 0)
  const debitos = vendasParaResumo.filter(v => v.modalidade === 'Débito').reduce((sum, venda) => sum + (parseFloat(venda.vendaBruto) || 0), 0)
  const rejeitados = vendasParaResumo.filter(v => v.status === 'rejeitado').reduce((sum, venda) => sum + (parseFloat(venda.vendaBruto) || 0), 0)
  
  return {
    vendasBrutas,
    qtdVendasBrutas: vendasParaResumo.length,
    taxa,
    taxaMedia: vendasBrutas > 0 ? ((taxa / vendasBrutas) * 100).toFixed(2) : 0,
    vendasLiquidas,
    qtdVendasLiquidas: vendasParaResumo.length,
    debitos,
    qtdDebitos: vendasParaResumo.filter(v => v.modalidade === 'Débito').length,
    rejeitados,
    qtdRejeitados: vendasParaResumo.filter(v => v.status === 'rejeitado').length,
    totalLiquido: vendasLiquidas - rejeitados
  }
})

// Métodos
const selecionarAba = (abaId) => {
  abaAtiva.value = abaId
  if (windowWidth.value < 1024) {
    sidebarAberta.value = false
  }
}

const onEmpresaChanged = (novaEmpresa) => {
  console.log('Empresa alterada para:', novaEmpresa)
  // Se o filtro estiver ativo, aplicar automaticamente
  if (filtroAtivo.value) {
    aplicarFiltroVendas(filtroData)
  }
}

const onDataChanged = (novaData) => {
  console.log('Data alterada para:', novaData)
  // Não aplicar filtro automaticamente, apenas quando clicar no botão
}

const aplicarFiltroVendas = (filtro) => {
  console.log('Aplicando filtro:', {
    empresa: empresaSelecionadaNome.value,
    data: filtro
  })
  
  // Ativar o filtro
  filtroAtivo.value = true
  
  // Carregar vendas do localStorage se necessário
  carregarVendasOriginais()
  
  // Feedback visual
  const totalVendas = vendas.value.length
  const vendasFiltradas = vendasFiltradas.value.length
  
  console.log(`Filtro aplicado: ${vendasFiltradas} de ${totalVendas} vendas exibidas`)
  
  // Atualizar resumo
  atualizarResumo()
}

const carregarVendasOriginais = () => {
  const dadosSalvos = localStorage.getItem('vendas-conciliacao')
  if (dadosSalvos) {
    const vendasSalvas = JSON.parse(dadosSalvos)
    vendas.value = vendasSalvas.map(venda => ({
      ...venda,
      dataVenda: venda.dataVenda || ''
    }))
    vendasOriginais.value = [...vendas.value]
  }
}

const atualizarDados = () => {
  carregarVendasOriginais()
  if (filtroAtivo.value) {
    aplicarFiltroVendas(filtroData)
  }
}

const atualizarResumo = () => {
  // O resumo é calculado automaticamente via computed property
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value >= 1024) {
    sidebarAberta.value = true
  } else {
    sidebarAberta.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  
  // Inicializar dados padrão
  const hoje = new Date()
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  
  filtroData.dataInicial = primeiroDiaMes.toISOString().split('T')[0]
  filtroData.dataFinal = hoje.toISOString().split('T')[0]
  
  if (empresas.length > 0) {
    empresaSelecionada.value = empresas[0].id.toString()
  }
  
  // Carregar vendas iniciais
  carregarVendasOriginais()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.transition-margin {
  transition: margin-left 0.3s ease;
}
</style>
