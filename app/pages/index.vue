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
import { useResumoFinanceiro } from '~/composables/useResumoFinanceiro'

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
const { empresas, fetchEmpresas } = useEmpresas()

// ❌ REMOVER ESTE BLOCO DUPLICADO:
// onMounted(async () => {
//   await fetchEmpresas()
// })

// Computed properties
const empresaSelecionadaNome = computed(() => {
  // ✅ Verificar se empresas é um array antes de usar .find()
  if (!empresas.value || !Array.isArray(empresas.value)) {
    return ''
  }
  
  const empresa = empresas.value.find(e => e.id.toString() === empresaSelecionada.value)
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

// Usar o composable de resumo financeiro
const { resumoCalculado } = useResumoFinanceiro(vendasFiltradas)

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

// Lifecycle - MANTER APENAS ESTE:
onMounted(async () => {
  await fetchEmpresas() // Carregar empresas do Supabase
  console.log('Empresas carregadas:', empresas.value) // Debug
})
</script>
