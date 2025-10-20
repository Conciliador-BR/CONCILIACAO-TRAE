<template>
  <div class="flex-1 flex flex-col bg-gray-50">
    <!-- Filtros -->
    <div class="bg-white border-b border-gray-200 p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Seletor de Banco -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Banco
          </label>
          <select 
            v-model="bancoSelecionado"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os Bancos</option>
            <option v-for="banco in bancosDisponiveis" :key="banco" :value="banco">
              {{ banco.replace('_', ' ') }}
            </option>
          </select>
        </div>
        
        <!-- Seletor de Adquirente -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Adquirente
          </label>
          <select 
            v-model="adquirenteSelecionado"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os Adquirentes</option>
            <option v-for="adquirente in adquirentesDisponiveis" :key="adquirente" :value="adquirente">
              {{ adquirente }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Botão de Busca -->
      <div class="mt-4">
        <button 
          @click="buscarDados"
          :disabled="loading"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Buscando...</span>
          <span v-else>Buscar Transações</span>
        </button>
      </div>
    </div>
    
    <!-- Estado: Nenhuma empresa selecionada -->
    <div v-if="!empresaSelecionada" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-yellow-500 text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa selecionada</h3>
        <p class="text-gray-600">Selecione uma empresa para visualizar o extrato detalhado</p>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Carregando extrato detalhado...</p>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button 
          @click="buscarDados"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="!transacoes || transacoes.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-gray-400 text-6xl mb-4">📊</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
        <p class="text-gray-600">Ajuste os filtros e tente novamente</p>
      </div>
    </div>
    
    <!-- Conteúdo Principal -->
    <div v-else class="flex-1 flex flex-col">
      <!-- Abas do Extrato -->
      <div class="bg-white border-b border-gray-200">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button
            @click="abaAtivaExtrato = 'todas'"
            :class="[
              abaAtivaExtrato === 'todas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Todas as Transações ({{ totalTransacoes }})
          </button>
          <button
            @click="abaAtivaExtrato = 'resumidas'"
            :class="[
              abaAtivaExtrato === 'resumidas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Transações Resumidas
          </button>
        </nav>
      </div>
      
      <!-- Conteúdo das Abas -->
      <div class="flex-1">
        <TabelaTodasTransacoes 
          v-if="abaAtivaExtrato === 'todas'"
          :transacoes="transacoesFiltradas"
        />
        <TransacoesResumidasExtrato 
          v-else-if="abaAtivaExtrato === 'resumidas'"
          :transacoes="transacoesFiltradas"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import TabelaTodasTransacoes from './extrato-detalhado/TabelaTodasTransacoes.vue'
import TransacoesResumidasExtrato from './extrato-detalhado/TransacoesResumidasExtrato.vue'

// Composables
const { filtrosGlobais } = useGlobalFilters()
const empresaSelecionada = computed(() => filtrosGlobais.empresaSelecionada)

const {
  loading,
  error,
  transacoes,
  bancosDisponiveis,
  adquirentesDisponiveis,
  totalTransacoes,
  totalCreditos,
  totalDebitos,
  saldoTotal,
  buscarTransacoesBancarias
} = useExtratoDetalhado()

// Estados locais
const bancoSelecionado = ref('TODOS')
const adquirenteSelecionado = ref('TODOS')
const abaAtivaExtrato = ref('todas')

// Usar datas dos filtros globais
const dataInicial = computed(() => filtrosGlobais.dataInicial)
const dataFinal = computed(() => filtrosGlobais.dataFinal)

// Computed para transações filtradas
const transacoesFiltradas = computed(() => {
  return transacoes.value || []
})

// Método para buscar dados
const buscarDados = async () => {
  console.log('🔘 [DEBUG] Botão "Buscar Transações" clicado!')
  console.log('🏢 [DEBUG] Empresa selecionada no componente:', empresaSelecionada.value)
  console.log('🏢 [DEBUG] Filtros globais:', filtrosGlobais)
  
  // Verificar se há empresa selecionada
  if (!empresaSelecionada.value) {
    console.warn('⚠️ [DEBUG] Nenhuma empresa selecionada, retornando...')
    return
  }
  
  const filtros = {
    bancoSelecionado: bancoSelecionado.value,
    adquirente: adquirenteSelecionado.value,
    dataInicial: dataInicial.value,
    dataFinal: dataFinal.value
  }
  
  console.log('📋 [DEBUG] Filtros que serão enviados:', filtros)
  
  await buscarTransacoesBancarias(filtros)
}

// Inicializar com dados padrão
onMounted(() => {
  // Só buscar dados se houver uma empresa selecionada e datas definidas
  if (empresaSelecionada.value && dataInicial.value && dataFinal.value) {
    buscarDados()
  }
})

// Watcher para reagir às mudanças na empresa selecionada
watch(empresaSelecionada, (novaEmpresa, empresaAnterior) => {
  console.log('🔄 [DEBUG] Empresa selecionada mudou:', { anterior: empresaAnterior, nova: novaEmpresa })
  
  // Se há uma empresa selecionada, buscar dados automaticamente
  if (novaEmpresa && novaEmpresa !== empresaAnterior) {
    console.log('🔄 [DEBUG] Buscando dados automaticamente para nova empresa...')
    buscarDados()
  }
}, { immediate: false })

// Watchers para reagir às mudanças nas datas globais
watch([dataInicial, dataFinal], ([novaDataInicial, novaDataFinal], [dataInicialAnterior, dataFinalAnterior]) => {
  console.log('📅 [DEBUG] Datas globais mudaram:', { 
    dataInicial: { anterior: dataInicialAnterior, nova: novaDataInicial },
    dataFinal: { anterior: dataFinalAnterior, nova: novaDataFinal }
  })
  
  // Se há empresa selecionada e datas válidas, buscar dados automaticamente
  if (empresaSelecionada.value && novaDataInicial && novaDataFinal) {
    console.log('🔄 [DEBUG] Buscando dados automaticamente para novas datas...')
    buscarDados()
  }
}, { immediate: false })
</script>