<template>
  <div class="space-y-6">
    <RecebimentosContainer :vendas="vendasFiltradas" @tentar-refetch="carregarRecebimentos" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import RecebimentosContainer from '~/components/pagamentos-operadoras/recebimentos/RecebimentosContainer.vue'
 

// Configurações da página
useHead({ title: 'Recebimentos - MRF CONCILIAÇÃO' })
definePageMeta({ keepalive: true })

// Usar dados de recebimentos
const filtroCardAtivo = ref('')
const { dadosRecebimentos: vendas, fetchRecebimentos } = useRecebimentosCRUD()

// Usar filtros globais
const { escutarEvento, filtrosGlobais } = useGlobalFilters()

const carregarRecebimentos = async () => await fetchRecebimentos(true)

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

const agendarAplicacaoFiltrosRecebimentos = async (dados) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  return await new Promise((resolve) => {
    debounceTimer = setTimeout(async () => {
      try {
        await aplicarFiltrosRecebimentos(dados)
      } finally {
        debounceTimer = null
        resolve()
      }
    }, 400)
  })
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

  // Escutar eventos de filtros globais para pagamentos
  const handler = async (dados) => await agendarAplicacaoFiltrosRecebimentos(dados)
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
