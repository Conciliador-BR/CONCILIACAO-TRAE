<template>
  <div class="flex-1 flex flex-col w-full">
    <div class="w-full max-w-none">
      <!-- Filtros -->
      <div class="mb-7">
      <div class="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-[#DCE7F3] overflow-hidden shadow-sm">
        <div class="px-6 py-4 border-b border-[#DCE7F3]">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Filtros de Extrato</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Seletor de Banco -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <select 
                  v-model="bancoSelecionado"
                  class="w-full px-4 py-3 border border-[#BFD3EA] rounded-xl bg-white text-[#102A43] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8bb5de] focus:border-[#244b77] transition-all duration-200"
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
                  class="w-full px-4 py-3 border border-[#BFD3EA] rounded-xl bg-white text-[#102A43] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8bb5de] focus:border-[#244b77] transition-all duration-200"
                >
                  <option value="TODOS">Todos os Adquirentes</option>
                  <option v-for="adquirente in adquirentesDisponiveis" :key="adquirente" :value="adquirente">
                    {{ adquirente }}
                  </option>
                </select>
              </div>
            </div>
            
            <!-- Botão de Busca -->
            <div class="mt-6 pt-6 border-t border-[#DCE7F3]">
              <button 
                @click="buscarDados(true)"
                :disabled="loading"
                class="group relative px-6 py-3 bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white rounded-xl shadow-lg border border-[#244b77] ring-2 ring-[#8bb5de] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium hover:shadow-xl"
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
          class="px-4 py-2 bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white rounded-lg border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de] hover:shadow-xl transition-all duration-300"
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
        <div class="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-[#DCE7F3] overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-[#DCE7F3]">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <nav class="flex space-x-8">
                <button
                  @click="abaAtivaExtrato = 'todas'"
                  class="py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 rounded-t-lg"
                  :class="abaAtivaExtrato === 'todas' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border-[#244b77] shadow-lg ring-2 ring-[#8bb5de] border-b-2' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
                >
                  Todas as Transações ({{ totalTransacoesFiltradasMes }})
                </button>
                <button
                  @click="abaAtivaExtrato = 'resumidas'"
                  class="py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 rounded-t-lg"
                  :class="abaAtivaExtrato === 'resumidas' ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border-[#244b77] shadow-lg ring-2 ring-[#8bb5de] border-b-2' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
                >
                  Transações Resumidas
                </button>
              </nav>

              <div class="text-sm">
                <label class="text-gray-600 mr-2">Mês:</label>
                <select
                  v-model="mesSelecionado"
                  class="border border-[#BFD3EA] rounded-lg px-3 py-2 text-sm text-[#102A43] bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8bb5de] focus:border-[#244b77] transition-all duration-200"
                >
                  <option value="todos">Todos os meses</option>
                  <option v-for="op in opcoesMes" :key="op.valor" :value="op.valor">
                    {{ op.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Conteúdo das Abas -->
          <div class="p-4 lg:p-5">
            <TabelaTodasTransacoes 
              v-if="abaAtivaExtrato === 'todas'"
              :transacoes="transacoesFiltradas"
            />
            <TransacoesResumidasBancoShared
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import TabelaTodasTransacoes from './extrato-detalhado/TabelaTodasTransacoes.vue'
import TransacoesResumidasBancoShared from '~/components/configuracoes/importacao/importacao_bancos/TransacoesResumidasBancoShared.vue'

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
const mesSelecionado = ref('todos')

// Usar datas dos filtros globais
const dataInicial = computed(() => filtrosGlobais.dataInicial)
const dataFinal = computed(() => filtrosGlobais.dataFinal)

const extrairMesAno = (data) => {
  const valor = String(data || '').trim()
  if (!valor) return null
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [, mm, aaaa] = valor.split('/')
    return `${aaaa}-${mm}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor.slice(0, 7)
  }
  return null
}

const labelMesAno = (mesAno) => {
  const [ano, mes] = String(mesAno).split('-')
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const idx = Math.max(1, Math.min(12, Number(mes || 0))) - 1
  return `${nomes[idx]} / ${ano}`
}

const opcoesMes = computed(() => {
  const set = new Set()
  for (const t of transacoes.value || []) {
    const chave = extrairMesAno(t?.data_formatada || t?.data)
    if (chave) set.add(chave)
  }
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b))
    .map(valor => ({ valor, label: labelMesAno(valor) }))
})

// Computed para transações filtradas
const transacoesFiltradas = computed(() => {
  if (mesSelecionado.value === 'todos') return transacoes.value || []
  return (transacoes.value || []).filter(t => extrairMesAno(t?.data_formatada || t?.data) === mesSelecionado.value)
})

const totalTransacoesFiltradasMes = computed(() => transacoesFiltradas.value.length)

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
let removeFiltrarBancos = null

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
  removeFiltrarBancos = escutarEvento('filtrar-bancos', () => {
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

watch(opcoesMes, (novasOpcoes) => {
  if (mesSelecionado.value === 'todos') return
  const existe = novasOpcoes.some(op => op.valor === mesSelecionado.value)
  if (!existe) mesSelecionado.value = 'todos'
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

onUnmounted(() => {
  if (removeFiltrarBancos) {
    removeFiltrarBancos()
    removeFiltrarBancos = null
  }
})

// Busca só acontece quando o botão "Aplicar Filtro" for clicado
</script>
