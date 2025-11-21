<template>
  <div id="analise-de-vendas-root" class="space-y-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Carregando dados DRE...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Erro ao carregar dados DRE</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <div class="mt-4">
            <button 
              @click="recarregarDados"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Header Component -->
      <AnaliseDeVendasHeader 
        :total-bandeiras="analisePorBandeira.length"
        :melhor-bandeira="melhorBandeira"
        :melhor-modalidade="melhorModalidade"
        :volume-total="volumeTotal"
        :periodo-atual="periodoAtual"
        :loading="loading"
      />

      <!-- Stats Component -->
      <AnaliseDeVendasStats 
        :indicadores="indicadoresFinanceiros"
        :loading="loading"
      />

      <!-- Gráficos de Análise -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Gráfico de Receita por Bandeira -->
        <AnaliseDeVendasGraficos 
          :dados="analisePorBandeira"
          titulo="Receita por Bandeira"
          tipo="receita"
          default-type="bar"
          :loading="loading"
        />

        <!-- Gráfico de Custo de Taxas por Bandeira -->
        <AnaliseDeVendasGraficos 
          :dados="analisePorBandeira"
          titulo="Custo de Taxas por Bandeira"
          tipo="custo"
          default-type="pie"
          :loading="loading"
        />
      </div>

      <!-- Análise por Modalidade -->
      <div class="rounded-2xl p-6 bg-white/70 backdrop-blur border border-gray-200/60 shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Análise por Modalidade de Pagamento</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="modalidade in analiseModalidades" :key="modalidade.modalidade" 
               class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-gray-900">{{ modalidade.modalidade }}</h4>
              <span :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                modalidade.margemBruta >= 95 ? 'bg-green-100 text-green-800' : 
                modalidade.margemBruta >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              ]">
                {{ modalidade.margemBruta >= 95 ? 'Alta' : modalidade.margemBruta >= 90 ? 'Média' : 'Baixa' }}
              </span>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Transações:</span>
                <span class="font-medium">{{ modalidade.quantidade.toLocaleString('pt-BR') }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Receita Bruta:</span>
                <span class="font-medium text-green-700">{{ formatarMoeda(modalidade.receitaBruta) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Taxa Efetiva:</span>
                <span class="font-medium text-red-600">{{ formatarPercentual(modalidade.taxaEfetiva) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Margem Bruta:</span>
                <span class="font-medium">{{ formatarPercentual(modalidade.margemBruta) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabelas por Adquirente -->
      <div class="space-y-8">
        <AnaliseDeVendasTabelaPorAdquirente 
          v-for="grupo in gruposPorAdquirente"
          :key="grupo.adquirente"
          :adquirente="grupo.adquirente"
          :dados="grupo.vendasData"
          :totais="grupo.totais"
          :loading="loading"
        />
      </div>

      <!-- Análise Temporal -->
      <div v-if="analiseTemporal.length > 0" class="rounded-2xl p-6 bg-white/70 backdrop-blur border border-gray-200/60 shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Evolução Temporal</h3>
        <AnaliseDeVendasGraficos 
          :dados="analiseTemporal"
          titulo="Evolução Mensal - Receita e Margem"
          tipo="receita"
          default-type="line"
          :loading="loading"
        />
        <div class="mt-6 p-5 rounded-xl border border-blue-200 bg-blue-50">
          <h4 class="text-sm font-semibold text-blue-800 mb-3">Feedback de Evolução</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">{{ feedbackTemporal.receitasTexto }}</span>
              <span :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                feedbackTemporal.percentReceita >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              ]">
                {{ feedbackTemporal.percentReceita >= 0 ? '+' : '-' }}{{ formatarPercentual(Math.abs(feedbackTemporal.percentReceita)) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">{{ feedbackTemporal.custosTexto }}</span>
              <span :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                feedbackTemporal.percentCustos <= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              ]">
                {{ feedbackTemporal.percentCustos >= 0 ? '+' : '-' }}{{ formatarPercentual(Math.abs(feedbackTemporal.percentCustos)) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Importações dos componentes
import AnaliseDeVendasHeader from '~/components/controladoria/analise-de-vendas/AnaliseDeVendasHeader.vue'
import AnaliseDeVendasStats from '~/components/controladoria/analise-de-vendas/AnaliseDeVendasStats.vue'
import AnaliseDeVendasGraficos from '~/components/controladoria/analise-de-vendas/AnaliseDeVendasGraficos.vue'
import AnaliseDeVendasTabelaPorAdquirente from '~/components/controladoria/analise-de-vendas/AnaliseDeVendasTabelaPorAdquirente.vue'

// Importações dos composables
import { useAnaliseDeVendas } from '~/composables/PageControladoria/analise-de-vendas/useAnaliseDeVendas.js'
import { useAnaliseDeVendasCalculos } from '~/composables/PageControladoria/analise-de-vendas/useAnaliseDeVendasCalculos.js'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

// Registrar visita à aba Análise
const registrarVisitaAnalise = () => {
  if (process.client) {
    localStorage.setItem('controladoria_ultima_aba', 'analise')
  }
}

// Configuração da página
useHead({
  title: 'Controladoria - Análise de Vendas | MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Análise contábil e financeira das vendas por bandeira e período' }
  ]
})

// Composables principais
const { 
  dreData, 
  loading, 
  error, 
  analisePorBandeira, 
  gruposPorAdquirente,
  dreConsolidada, 
  analiseTemporal,
  buscarDadosDRE
} = useAnaliseDeVendas()

const { 
  lucratividadePorBandeira,
  analiseModalidades,
  indicadoresFinanceiros,
  comparativosTemporais,
  formatarMoeda,
  formatarPercentual,
  gerarFeedbackTemporal
} = useAnaliseDeVendasCalculos(analisePorBandeira, dreConsolidada, analiseTemporal)

// Dados computados para o header
const melhorBandeira = computed(() => {
  if (!lucratividadePorBandeira.value || lucratividadePorBandeira.value.length === 0) {
    return { bandeira: 'N/A', margemBruta: 0 }
  }
  return lucratividadePorBandeira.value[0]
})

const melhorModalidade = computed(() => {
  if (!analiseModalidades.value || analiseModalidades.value.length === 0) {
    return { modalidade: 'N/A', margemBruta: 0 }
  }
  return analiseModalidades.value.reduce((melhor, atual) => 
    atual.margemBruta > melhor.margemBruta ? atual : melhor
  )
})

const volumeTotal = computed(() => ({
  receitaLiquida: dreConsolidada.value?.receitaLiquida || 0,
  margemBruta: dreConsolidada.value?.margemBruta || 0
}))


const periodoAtual = computed(() => {
  const agora = new Date()
  return agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const feedbackTemporal = computed(() => gerarFeedbackTemporal())

// Função para recarregar dados
const recarregarDados = async () => {
  await buscarDadosDRE()
}

// Integração com filtros globais (se necessário)
const { escutarEvento, filtrosGlobais } = useGlobalFilters()

let removerListener

// Lifecycle hooks
onMounted(async () => {
  await buscarDadosDRE()
  registrarVisitaAnalise()
  
  // Listener para filtros globais (se implementado)
  if (escutarEvento) {
    removerListener = escutarEvento('filtrar-controladoria-dre', async (dadosFiltros) => {
      // Aplicar filtros se necessário
      await buscarDadosDRE(dadosFiltros)
    })
  }
})

onUnmounted(() => {
  // Cleanup do listener
  if (removerListener) {
    removerListener()
  }
})
</script>