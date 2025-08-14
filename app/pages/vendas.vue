<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">Vendas</h1>
      
      <!-- Resumo Financeiro -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <!-- Vendas Brutas -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm">Vendas Brutas</p>
              <p class="text-2xl font-bold">{{ formatCurrency(resumoCalculado.vendasBrutas) }}</p>
              <div class="flex items-center mt-1">
                <span class="text-green-300 text-sm">{{ resumoCalculado.qtdVendasBrutas }} vendas</span>
              </div>
            </div>
            <CurrencyDollarIcon class="w-12 h-12 text-green-200" />
          </div>
        </div>

        <!-- Total Taxas -->
        <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-red-100 text-sm">Total Taxas</p>
              <p class="text-2xl font-bold">{{ formatCurrency(resumoCalculado.taxa) }}</p>
              <div class="flex items-center mt-1">
                <span class="text-red-300 text-sm">{{ resumoCalculado.taxaMedia }}% média</span>
              </div>
            </div>
            <PercentBadgeIcon class="w-12 h-12 text-red-200" />
          </div>
        </div>

        <!-- Débitos -->
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm">Débitos</p>
              <p class="text-2xl font-bold">{{ formatCurrency(resumoCalculado.debitos) }}</p>
              <div class="flex items-center mt-1">
                <span class="text-orange-300 text-sm">{{ resumoCalculado.qtdDebitos }} débitos</span>
              </div>
            </div>
            <ExclamationTriangleIcon class="w-12 h-12 text-orange-200" />
          </div>
        </div>

        <!-- Vendas Líquidas -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">Vendas Líquidas</p>
              <p class="text-2xl font-bold">{{ formatCurrency(resumoCalculado.vendasLiquidas) }}</p>
              <div class="flex items-center mt-1">
                <span class="text-blue-300 text-sm">{{ resumoCalculado.qtdVendasLiquidas }} vendas</span>
              </div>
            </div>
            <ArrowTrendingUpIcon class="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <!-- Total Líquido -->
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">Total Líquido</p>
              <p class="text-2xl font-bold">{{ formatCurrency(resumoCalculado.totalLiquido) }}</p>
              <div class="flex items-center mt-1">
                <span class="text-purple-300 text-sm">Final</span>
              </div>
            </div>
            <BanknotesIcon class="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SeletorEmpresa 
          v-model="empresaSelecionada"
          :empresas="empresas"
        />
        <FiltroData 
          v-model="filtroData"
        />
        <BotaoAplicarFiltro
          :empresa-selecionada="empresaSelecionadaNome"
          :filtro-data="filtroData"
          @aplicar-filtro="aplicarFiltroVendas"
        />
      </div>

      <!-- VendasContainer -->
      <VendasContainer />
    </div>
  </div>
</template>

<script setup>
// Imports necessários
import { ref, computed, watch, onMounted } from 'vue'
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  PercentBadgeIcon, 
  BanknotesIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useEmpresas } from '~/composables/useEmpresas'
import { useVendas } from '~/composables/useVendas'
import { useResumoFinanceiro } from '~/composables/useResumoFinanceiro'
import VendasContainer from '~/components/vendas-operadoras/VendasContainer.vue'
import BotaoAplicarFiltro from '~/components/BotaoAplicarFiltro.vue'

// Configurações da página
useHead({
  title: 'Vendas - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gerenciamento de vendas' }
  ]
})

// Estados reativos
const empresaSelecionada = ref('')
const filtroData = ref({
  dataInicial: '',
  dataFinal: ''
})

// Usar o composable useVendas
const {
  vendas,
  loading,
  error,
  fetchVendas,
  aplicarFiltros
} = useVendas()

// Dados das empresas
const empresas = ref([])

// Usar o composable de resumo financeiro
const { resumoCalculado } = useResumoFinanceiro(vendas)

// Computed para nome da empresa selecionada
const empresaSelecionadaNome = computed(() => {
  if (!empresaSelecionada.value) return ''
  const empresa = empresas.value.find(e => e.id == empresaSelecionada.value)
  return empresa?.nome || ''
})

// Métodos
const filtrarDados = () => {
  console.log('Filtrando dados...')
}

const onEmpresaChanged = (empresa) => {
  console.log('Empresa alterada:', empresa)
}

const onDataChanged = (data) => {
  console.log('Data alterada:', data)
}

const aplicarFiltroVendas = (filtros) => {
  console.log('Aplicando filtro de vendas:', filtros)
  
  // Chamar a função aplicarFiltros do composable useVendas
  aplicarFiltros({
    empresa: filtros.empresa,
    dataInicial: filtros.dataInicial,
    dataFinal: filtros.dataFinal
  })
}

const atualizarVendas = (novasVendas) => {
  // Esta função não é mais necessária pois o VendasContainer
  // usa diretamente o composable useVendas
}

// Inicialização
onMounted(async () => {
  const { empresas: empresasData, fetchEmpresas } = useEmpresas()
  await fetchEmpresas()
  empresas.value = empresasData.value
  
  // Carregar vendas iniciais
  await fetchVendas()
})

// Função para formatar valores monetários
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>