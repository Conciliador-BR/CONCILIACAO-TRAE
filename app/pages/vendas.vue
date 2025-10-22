<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div class="max-w-8xl mx-auto space-y-8">
      
      <!-- Header da página -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h1 class="text-3xl font-bold text-gray-900">Vendas</h1>
          <p class="text-sm text-gray-600 mt-1">Gestão completa de vendas e transações</p>
        </div>
      </div>

      <!-- Resumo Financeiro -->
      <ResumoVendas :resumo-calculado="resumoCalculado" />

      <!-- Container de Vendas -->
      <VendasContainer :vendas="vendas" />
      
    </div>
  </div>
</template>

<script setup>
// Imports necessários
import { computed, onMounted, onUnmounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useResumoFinanceiro } from '~/composables/useResumoFinanceiro'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import VendasContainer from '~/components/vendas-operadoras/VendasContainer.vue'
import ResumoVendas from '~/components/vendas-operadoras/ResumoVendas.vue'

// Configurações da página
useHead({
  title: 'Vendas - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gerenciamento de vendas' }
  ]
})

// Usar o composable useVendas
const {
  vendas,
  loading,
  error,
  fetchVendas,
  aplicarFiltros
} = useVendas()

// Usar filtros globais
const { filtrosGlobais, escutarEvento } = useGlobalFilters()

// Usar o composable de resumo financeiro
const { resumoCalculado } = useResumoFinanceiro(vendas)

// Função para aplicar filtros de vendas
const aplicarFiltrosVendas = (dadosFiltros) => {
  const filtrosFormatados = {
    empresa: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  }
  aplicarFiltros(filtrosFormatados)
}

// Variável para armazenar a função de cleanup do listener
let removerListener

// Inicialização
onMounted(async () => {
  // Carregar vendas apenas se necessário
  await fetchVendas()
  
  // Aplicar filtros globais existentes (se houver)
  const filtrosAtuais = {
    empresaSelecionada: filtrosGlobais.empresaSelecionada,
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  }
  
  if (filtrosAtuais.empresaSelecionada || filtrosAtuais.dataInicial || filtrosAtuais.dataFinal) {
    aplicarFiltrosVendas(filtrosAtuais)
  }
  
  // Escutar eventos de filtros globais
  removerListener = escutarEvento('filtrar-vendas', aplicarFiltrosVendas)
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  if (removerListener) {
    removerListener()
  }
})
</script>