<template>
  <div class="bg-white p-4 shadow-sm border-b">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Filtros específicos de Previsão de Pagamentos -->
      <select 
        v-model="statusPagamento" 
        class="px-3 py-2 border rounded"
      >
        <option value="">Todos os Status</option>
        <option value="pendente">Pendente</option>
        <option value="pago">Pago</option>
        <option value="atrasado">Atrasado</option>
      </select>
      
      <select 
        v-model="operadora" 
        class="px-3 py-2 border rounded"
      >
        <option value="">Todas as Operadoras</option>
        <option value="visa">Visa</option>
        <option value="mastercard">Mastercard</option>
        <option value="elo">Elo</option>
        <option value="amex">American Express</option>
      </select>
      
      <input 
        v-model="valorMinimo" 
        type="number" 
        placeholder="Valor Mínimo"
        class="px-3 py-2 border rounded"
        step="0.01"
      />
      
      <input 
        v-model="valorMaximo" 
        type="number" 
        placeholder="Valor Máximo"
        class="px-3 py-2 border rounded"
        step="0.01"
      />
      
      <!-- Botão Limpar Filtros Específicos -->
      <button 
        @click="limparFiltrosEspecificos"
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        Limpar Filtros
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { usePrevisaoSupabase } from '~/composables/PagePagamentos/filtrar_tabelas_previsao/usePrevisaoSupabase'

// Composables
const { escutarEvento, filtrosGlobais } = useGlobalFilters()
const { aplicarFiltros: aplicarFiltrosPagamentos } = usePrevisaoSupabase()

// Estados específicos de Previsão de Pagamentos
const statusPagamento = ref('')
const operadora = ref('')
const valorMinimo = ref(null)
const valorMaximo = ref(null)

// Função para aplicar filtros quando o botão global for clicado
const aplicarFiltrosGlobais = (dadosFiltros) => {
  
  
  // Aplicar filtros básicos (empresa e data) usando usePrevisaoSupabase
  aplicarFiltrosPagamentos({
    empresa: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  })
  
  // TODO: Implementar filtros específicos de pagamentos (status, operadora, valores)
  // Estes filtros podem ser aplicados em uma segunda etapa
}

// Função para limpar apenas os filtros específicos
const limparFiltrosEspecificos = () => {
  statusPagamento.value = ''
  operadora.value = ''
  valorMinimo.value = null
  valorMaximo.value = null
  
  
}

// Variável para armazenar a função de cleanup do listener
let stopListening

// Inicialização - escutar eventos de filtros globais
onMounted(() => {
  
  
  // Escutar evento específico de filtros de pagamentos
  stopListening = escutarEvento('filtrar-pagamentos', aplicarFiltrosGlobais)
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  
  if (stopListening) {
    stopListening()
    stopListening = null
  }
})
</script>