<template>
  <div class="space-y-6">
    <ResumoCardsRecebimentos
      :dados="vendas"
      :active-filter="filtroCardAtivo"
      @filter-change="setFiltroCard"
    />
    <RecebimentosContainer :vendas="vendasFiltradas" @tentar-refetch="carregarRecebimentos" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import RecebimentosContainer from '~/components/pagamentos-operadoras/recebimentos/RecebimentosContainer.vue'
import ResumoCardsRecebimentos from '~/components/pagamentos-operadoras/recebimentos/ResumoCardsRecebimentos.vue'
 

// Configurações da página
useHead({ title: 'Recebimentos - MRF CONCILIAÇÃO' })
definePageMeta({ keepalive: true })

// Usar dados de recebimentos
const vendas = ref([])
const filtroCardAtivo = ref('')
const { fetchRecebimentos } = useRecebimentosCRUD()

// Usar filtros globais
const { escutarEvento, filtrosGlobais } = useGlobalFilters()

const carregarRecebimentos = async () => {
  vendas.value = await fetchRecebimentos()
}

const normalizeText = (text) => String(text || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()

const isDebitoCardRow = (row) => {
  const modalidade = normalizeText(row?.modalidade)
  const bandeira = normalizeText(row?.bandeira)
  const texto = `${modalidade} ${bandeira}`.trim()
  const isAluguelMaquina = texto.includes('aluguel') && (texto.includes('maquin') || texto.includes('terminal') || texto.includes('pos'))
  const isDebitoFixo = texto.includes('mensalidade') || texto.includes('ajuste') || texto.includes('desconto')
  return isAluguelMaquina || isDebitoFixo
}

const vendasFiltradas = computed(() => {
  if (!filtroCardAtivo.value) return vendas.value
  if (filtroCardAtivo.value === 'vendasBrutas') {
    return (vendas.value || []).filter(v => Number(v?.valor_bruto || 0) > 0)
  }
  if (filtroCardAtivo.value === 'debitos') {
    return (vendas.value || []).filter(isDebitoCardRow)
  }
  if (filtroCardAtivo.value === 'despesaAntecipacao') {
    return (vendas.value || []).filter(v => Math.abs(Number(v?.despesa_antecipacao || 0)) > 0)
  }
  return vendas.value
})

const setFiltroCard = (filtro) => {
  filtroCardAtivo.value = String(filtro || '')
}

// Função para aplicar filtros de recebimentos
const aplicarFiltrosRecebimentos = async () => {
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
  const filtrosAtuais = {
    empresaSelecionada: filtrosGlobais.empresaSelecionada,
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  }

  if (filtrosAtuais.empresaSelecionada || filtrosAtuais.dataInicial || filtrosAtuais.dataFinal) {
    await aplicarFiltrosRecebimentos()
  } else {
    await carregarRecebimentos()
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
