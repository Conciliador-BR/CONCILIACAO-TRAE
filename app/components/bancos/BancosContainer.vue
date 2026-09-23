<template>
  <div class="h-full flex flex-col bg-[#F4F8FC]">
    <!-- Header -->
    <BancosHeader 
      :total-movimentacoes="totalItems"
      :saldo-total="saldoTotal"
      @dados-atualizados="handleDadosAtualizados"
      @erro-atualizacao="handleErroAtualizacao"
    />
    
    <!-- Navegação das Abas -->
    <div class="mt-4 overflow-hidden rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_18px_40px_rgba(16,42,67,0.08)]">
      <div class="border-b border-[#E7EFF8] bg-gradient-to-r from-[#F8FBFF] to-white px-12 py-8">
        <nav class="flex items-center space-x-8">
          <button
            @click="abaAtiva = 'movimentacoes'"
            class="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 border"
            :class="abaAtiva === 'movimentacoes' 
              ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]'
              : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-800'"
          >
            Movimentações
          </button>
          <button
            @click="abaAtiva = 'extrato-detalhado'"
            class="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 border"
            :class="abaAtiva === 'extrato-detalhado' 
              ? 'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]'
              : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-800'"
          >
            Extrato Detalhado
          </button>
        </nav>
      </div>
    </div>
    
    <!-- Conteúdo das Abas -->
    <div class="mt-6 min-h-[750px] overflow-hidden rounded-[30px] border border-[#DCE7F3] bg-white shadow-[0_20px_48px_rgba(16,42,67,0.08)]">
      <div class="p-0 h-full">
    <!-- Conteúdo da Aba Movimentações -->
        <div v-show="abaAtiva === 'movimentacoes'" class="flex-1 flex flex-col h-full bancos-fluid-pane">
    
    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-500">Carregando dados bancários...</p>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">Erro ao carregar dados</h3>
        <p class="text-slate-500 mb-4">{{ error }}</p>
        <button 
          @click="recarregarDados"
          class="rounded-lg bg-[#244B77] px-4 py-2 text-white hover:bg-[#1f4268]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="!movimentacoes || movimentacoes.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-slate-300 text-6xl mb-4">🏦</div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">Nenhuma movimentação encontrada</h3>
        <p class="text-slate-500 mb-4">Selecione uma empresa para visualizar os dados bancários</p>
        <button 
          @click="recarregarDados"
          class="rounded-lg bg-[#244B77] px-4 py-2 text-white hover:bg-[#1f4268]"
        >
          Recarregar dados
        </button>
      </div>
    </div>
    
    <!-- Conteúdo quando há dados -->
    <div v-else class="flex-1 flex flex-col min-h-[650px]">
      
      <!-- Container fluido para alinhar cards e tabela -->
      <div class="w-full space-y-4">
        <!-- Cards de Resumo em container separado com rolagem própria -->
        <div class="overflow-hidden rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_12px_32px_rgba(16,42,67,0.06)]">
          <div class="w-full p-0">
            <BancosResumoCards 
              :movimentacoes="cleanMovimentacoes" 
              :active-filter="selectedAdquirente"
              @filter-adquirente="handleFilterAdquirente"
            />
          </div>
        </div>

        <!-- Calendario de Recebimentos -->
        <div class="w-full p-0">
          <RecebimentosCalendar
            :records="filteredMovimentacoes"
            @export="handleExportarRecebimentos"
          />
        </div>
      </div>
    </div>
        </div>
        
        <!-- Conteúdo da Aba Extrato Detalhado -->
        <ExtratoDetalhadoContainer v-show="abaAtiva === 'extrato-detalhado'" />
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useBancosVendas } from '~/composables/PageBancos/useBancosVendas'
import { useBancosPrevisao } from '~/composables/PageBancos/useBancosPrevisao'

// Componentes
import BancosHeader from './BancosHeader.vue'
import BancosResumoCards from './BancosResumoCards.vue'
import RecebimentosCalendar from './RecebimentosCalendar.vue'
import ExtratoDetalhadoContainer from './ExtratoDetalhadoContainer.vue'

// Composables (declaração única)
const { empresaSelecionada } = useEmpresas()
const { initializeResponsive } = useResponsiveColumns()
const {
  loading,
  error,
  movimentacoes,
  totalItems,
  saldoTotal,
  fetchMovimentacoes,
  setPage,
  configurarListenerGlobal
} = useBancosVendas()

const {
  calcularPrevisoesDiarias
} = useBancosPrevisao()

// Estados locais
const abaAtiva = ref('movimentacoes')
const selectedAdquirente = ref(null)

// Computed para filtrar movimentações localmente (Removendo OUTROS)
const cleanMovimentacoes = computed(() => {
  if (!movimentacoes.value) return []
  return movimentacoes.value.filter(mov => !mov.adquirente || mov.adquirente.toUpperCase() !== 'OUTROS')
})

const filteredMovimentacoes = computed(() => {
  if (!selectedAdquirente.value) {
    return cleanMovimentacoes.value
  }
  
  return cleanMovimentacoes.value.filter(mov => 
    mov.adquirente === selectedAdquirente.value
  )
})

// Handler para filtro de adquirente
const handleFilterAdquirente = (adquirente) => {
  selectedAdquirente.value = adquirente
  setPage(1) // Resetar para primeira página ao filtrar
}

// Função principal para recarregar todos os dados
const recarregarDados = async (forcarRecarregamento = false) => {
  try {
    await Promise.all([
      fetchMovimentacoes({}, forcarRecarregamento),
      calcularPrevisoesDiarias()
    ])
  } catch (err) {
    error.value = err.message || 'Erro ao carregar dados'
  }
}

// Handlers
const handleDadosAtualizados = async () => {
  await recarregarDados(true)
}

const handleErroAtualizacao = (erro) => {
  error.value = erro
}

const handleExportarRecebimentos = (records = []) => {
  if (!process.client || !records.length) return

  const headers = ['Data', 'Adquirente', 'Previsto', 'Debitos c/ antecipacao', 'Debitos', 'Deposito', 'Saldo', 'Status']
  const rows = records.map(record => [
    record.data || '',
    record.adquirente || '',
    Number(record.previsto || 0),
    Number(record.debitosAntecipacao || 0),
    Number(record.debitos || 0),
    Number(record.deposito || 0),
    Number(record.saldoConciliacao || 0),
    record.status || ''
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `recebimentos-calendario-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Variáveis para armazenar as funções de cleanup
let stopWatchingEmpresa = null
let stopListeningGlobal = null

// Watchers e lifecycle
onMounted(async () => {
  await nextTick()
  initializeResponsive()
  stopListeningGlobal = configurarListenerGlobal()
  stopWatchingEmpresa = watch(empresaSelecionada, async (novaEmpresa, empresaAnterior) => {
    if (novaEmpresa !== empresaAnterior) {
      await recarregarDados(true)
    }
  }, { immediate: false })
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  // Limpando watchers do componente bancos...
  
  // Limpar watcher da empresa
  if (stopWatchingEmpresa) {
    stopWatchingEmpresa()
    stopWatchingEmpresa = null
  }
  
  // Limpar listener global
  if (stopListeningGlobal) {
    stopListeningGlobal()
    stopListeningGlobal = null
  }
})
</script>

<style scoped>
.bancos-fluid-pane {
  width: 100%;
  min-width: 0;
}
</style>
