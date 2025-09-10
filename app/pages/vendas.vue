<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">Vendas</h1>
      
      <!-- Resumo Financeiro -->
      <ResumoVendas :resumo-calculado="resumoCalculado" />

      <!-- VendasContainer -->
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