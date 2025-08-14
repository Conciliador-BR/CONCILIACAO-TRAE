<template>
  <div class="space-y-6">
    <!-- Filtros Globais -->
    <IndexFilters
      v-model:empresa-selecionada="empresaSelecionada"
      v-model:filtro-data="filtroData"
      :empresas="empresas"
      @empresa-changed="onEmpresaChanged"
      @data-changed="onDataChanged"
      @aplicar-filtro="aplicarFiltroVendas"
    />
    
    <!-- Conteúdo Principal -->
    <IndexMainContent
      :aba-ativa="abaAtiva"
      :vendas="vendasFiltradas"
      :taxas="taxas"
      :resumo-calculado="resumoCalculado"
      :empresa-selecionada-nome="empresaSelecionadaNome"
      :filtro-data="filtroData"
      @update:vendas="vendas = $event"
      @update:taxas="taxas = $event"
      @vendas-changed="atualizarResumo"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from '#app'
import { useEmpresas } from '~/composables/useEmpresas'

// Importar componentes
import IndexFilters from '~/components/index/IndexFilters.vue'
import IndexMainContent from '~/components/index/IndexMainContent.vue'

// Obter aba ativa da URL
const route = useRoute()
const abaAtiva = computed(() => {
  return route.query.aba || 'dashboard'
})

// Dados reativos
const vendas = ref([])
const vendasOriginais = ref([])
const taxas = ref([])
const empresaSelecionada = ref('')
const filtroData = reactive({
  dataInicial: '',
  dataFinal: ''
})

// Estado do filtro
const filtroAtivo = ref(false)

// Composables
const { getEmpresas } = useEmpresas()
const empresas = getEmpresas()

// Computed properties
const empresaSelecionadaNome = computed(() => {
  const empresa = empresas.find(e => e.id.toString() === empresaSelecionada.value)
  return empresa ? empresa.nome : ''
})

const vendasFiltradas = computed(() => {
  if (!filtroAtivo.value) {
    return vendas.value
  }

  return vendas.value.filter(venda => {
    // Filtro por empresa
    const empresaCorresponde = !empresaSelecionada.value || 
      venda.empresa === empresaSelecionadaNome.value

    // Filtro por data
    let dataCorresponde = true
    if (filtroData.dataInicial || filtroData.dataFinal) {
      const dataVenda = new Date(venda.dataVenda)
      
      if (filtroData.dataInicial) {
        const dataInicial = new Date(filtroData.dataInicial)
        dataCorresponde = dataCorresponde && dataVenda >= dataInicial
      }
      
      if (filtroData.dataFinal) {
        const dataFinal = new Date(filtroData.dataFinal)
        dataFinal.setHours(23, 59, 59, 999)
        dataCorresponde = dataCorresponde && dataVenda <= dataFinal
      }
    }

    return empresaCorresponde && dataCorresponde
  })
})

const resumoCalculado = computed(() => {
  const vendasParaResumo = vendasFiltradas.value
  
  if (!vendasParaResumo || vendasParaResumo.length === 0) {
    return {
      vendasBrutas: 0,
      qtdVendasBrutas: 0,
      taxa: 0,
      taxaMedia: 0,
      vendasLiquidas: 0,
      qtdVendasLiquidas: 0,
      debitos: 0,
      qtdDebitos: 0,
      rejeitados: 0,
      qtdRejeitados: 0,
      totalLiquido: 0
    }
  }

  const vendasBrutas = vendasParaResumo.reduce((sum, venda) => sum + (parseFloat(venda.vendaBruto) || 0), 0)
  const taxa = vendasParaResumo.reduce((sum, venda) => sum + (parseFloat(venda.valorTaxa) || 0), 0)
  const vendasLiquidas = vendasParaResumo.reduce((sum, venda) => sum + (parseFloat(venda.vendaLiquido) || 0), 0)
  const debitos = vendasParaResumo.filter(v => v.modalidade === 'Débito').reduce((sum, venda) => sum + (parseFloat(venda.vendaBruto) || 0), 0)
  const rejeitados = vendasParaResumo.filter(v => v.status === 'rejeitado').reduce((sum, venda) => sum + (parseFloat(venda.vendaBruto) || 0), 0)
  
  return {
    vendasBrutas,
    qtdVendasBrutas: vendasParaResumo.length,
    taxa,
    taxaMedia: vendasBrutas > 0 ? ((taxa / vendasBrutas) * 100).toFixed(2) : 0,
    vendasLiquidas,
    qtdVendasLiquidas: vendasParaResumo.length,
    debitos,
    qtdDebitos: vendasParaResumo.filter(v => v.modalidade === 'Débito').length,
    rejeitados,
    qtdRejeitados: vendasParaResumo.filter(v => v.status === 'rejeitado').length,
    totalLiquido: vendasLiquidas - rejeitados
  }
})

// Métodos
const onEmpresaChanged = (novaEmpresa) => {
  console.log('Empresa alterada:', novaEmpresa)
}

const onDataChanged = (novaData) => {
  console.log('Data alterada:', novaData)
}

const aplicarFiltroVendas = (filtro) => {
  console.log('Aplicando filtro:', filtro)
  filtroAtivo.value = true
}

const atualizarResumo = () => {
  // Lógica para atualizar resumo
}

// Carregar dados iniciais
onMounted(async () => {
  // Carregar dados de vendas e taxas
})
</script>
