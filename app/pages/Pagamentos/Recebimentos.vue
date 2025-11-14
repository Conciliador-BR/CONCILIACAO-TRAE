<template>
  <div class="space-y-6">
    <ResumoCardsRecebimentos :dados="vendas" />
    <RecebimentosContainer :vendas="vendas" @tentar-refetch="carregarRecebimentos" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import RecebimentosContainer from '~/components/pagamentos-operadoras/recebimentos/RecebimentosContainer.vue'
import ResumoCardsRecebimentos from '~/components/pagamentos-operadoras/recebimentos/ResumoCardsRecebimentos.vue'
 

// Configurações da página
useHead({ title: 'Recebimentos - MRF CONCILIAÇÃO' })
definePageMeta({ keepalive: true })

// Usar dados de recebimentos
const vendas = ref([])
const { fetchRecebimentos } = useRecebimentosCRUD()

// Usar filtros globais
const { escutarEvento, filtrosGlobais } = useGlobalFilters()

const carregarRecebimentos = async () => {
  vendas.value = await fetchRecebimentos()
}

// Função para aplicar filtros de recebimentos
const aplicarFiltrosRecebimentos = async (dadosFiltros) => {
  const filtrosFormatados = {
    empresaSelecionada: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  }
  await carregarRecebimentos()
}

// Variável para armazenar a função de cleanup do listener
let removerListener
let debounceTimer

const registrarVisitaRecebimentos = () => {
  if (process.client) {
    localStorage.setItem('pagamentos_ultima_aba', 'recebimentos')
  }
}

// Carregar dados ao montar
onMounted(async () => {
  registrarVisitaRecebimentos()
  await carregarRecebimentos()

  const filtrosAtuais = {
    empresaSelecionada: filtrosGlobais.empresaSelecionada,
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  }

  if (filtrosAtuais.empresaSelecionada || filtrosAtuais.dataInicial || filtrosAtuais.dataFinal) {
    await aplicarFiltrosRecebimentos(filtrosAtuais)
  }

  // Escutar eventos de filtros globais para pagamentos
  const handler = (dados) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => aplicarFiltrosRecebimentos(dados), 400)
  }
  removerListener = escutarEvento('filtrar-pagamentos', handler)
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  if (removerListener) {
    removerListener()
  }
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
