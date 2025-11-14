<template>
  <div class="flex-1 flex flex-col">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Filtros -->
      <div class="mb-7">
      <div class="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Filtros de Extrato</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Seletor de Banco -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <select 
                  v-model="bancoSelecionado"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="TODOS">Todos os Adquirentes</option>
                  <option v-for="adquirente in adquirentesDisponiveis" :key="adquirente" :value="adquirente">
                    {{ adquirente }}
                  </option>
                </select>
              </div>
            </div>
            
            <!-- Botão de Busca -->
            <div class="mt-6 pt-6 border-t border-gray-200">
              <button 
                @click="buscarDados(true)"
                :disabled="loading"
                class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <span v-if="loading">Buscando...</span>
                <span v-else>Buscar Transações</span>
              </button>
          </div>
        </div>
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
      <div class="mb-6">
        <div class="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <nav class="flex space-x-8">
              <button
                @click="abaAtivaExtrato = 'todas'"
                class="py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 rounded-t-lg"
                :class="abaAtivaExtrato === 'todas' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
              >
                Todas as Transações ({{ totalTransacoes }})
              </button>
              <button
                @click="abaAtivaExtrato = 'resumidas'"
                class="py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 rounded-t-lg"
                :class="abaAtivaExtrato === 'resumidas' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
              >
                Transações Resumidas
              </button>
            </nav>
          </div>
          
          <!-- Conteúdo das Abas -->
          <div class="p-6">
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
  transacoesOriginais,
  filtroAtivo,
  bancosDisponiveis,
  adquirentesDisponiveis,
  totalTransacoes,
  totalCreditos,
  totalDebitos,
  saldoTotal,
  buscarTransacoesBancarias,
  aplicarFiltrosLocais,
  buscarBancosEmpresa,
  limparEstadoPersistido
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
const buscarDados = async (forceReload = false) => {
  if (!empresaSelecionada.value) return
  const filtros = {
    bancoSelecionado: bancoSelecionado.value,
    adquirente: adquirenteSelecionado.value,
    dataInicial: dataInicial.value,
    dataFinal: dataFinal.value
  }
  await buscarTransacoesBancarias(filtros, forceReload)
}

// Método para aplicar apenas filtros locais (sem recarregar dados)
const aplicarFiltrosAutomatico = () => {
  const filtros = {
    bancoSelecionado: bancoSelecionado.value,
    adquirente: adquirenteSelecionado.value,
    dataInicial: dataInicial.value,
    dataFinal: dataFinal.value
  }
  
  // Atualizar filtro ativo antes de aplicar
  filtroAtivo.value = { ...filtros }
  
  aplicarFiltrosLocais(filtros)
}

// Listener para o evento de aplicar filtros
const { escutarEvento } = useGlobalFilters()

// Inicializar com dados padrão
onMounted(async () => {
  if (empresaSelecionada.value) {
    await buscarBancosEmpresa()
    if (transacoesOriginais.value.length > 0) {
      bancoSelecionado.value = filtroAtivo.value.bancoSelecionado || 'TODOS'
      adquirenteSelecionado.value = filtroAtivo.value.adquirente || 'TODOS'
      aplicarFiltrosAutomatico()
    }
  }
  escutarEvento('filtrar-bancos', () => {
    buscarDados(true)
  })
})

// Watch para aplicar filtros automaticamente quando mudam
watch([bancoSelecionado, adquirenteSelecionado], () => {
  // Só aplicar filtros se já temos dados carregados
  if (transacoesOriginais.value.length > 0) {
    aplicarFiltrosAutomatico()
  }
})

// Watcher para reagir às mudanças na empresa selecionada
watch(empresaSelecionada, async (novaEmpresa, empresaAnterior) => {
  if (novaEmpresa && novaEmpresa !== empresaAnterior) {
    await buscarBancosEmpresa()
    if (empresaAnterior && empresaAnterior !== novaEmpresa) {
      limparEstadoPersistido()
      bancoSelecionado.value = 'TODOS'
      adquirenteSelecionado.value = 'TODOS'
    }
  }
}, { immediate: false })

// Busca só acontece quando o botão "Aplicar Filtro" for clicado
</script>