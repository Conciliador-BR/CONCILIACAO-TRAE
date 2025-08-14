<template>
  <div class="space-y-6">
    <!-- Filtros -->
    <IndexFilters
      v-model:empresa-selecionada="empresaSelecionada"
      v-model:filtro-data="filtroData"
      :empresas="empresas"
      @empresa-changed="onEmpresaChanged"
      @data-changed="onDataChanged"
      @aplicar-filtro="aplicarFiltro"
    />
    
    <!-- Título da Seção -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-2xl font-bold text-blue-800 mb-4">CONCILIAÇÕES VENDAS</h2>
      
      <!-- Tabela de Conciliações -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-blue-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">ADQUIRENTES</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">DÉBITO</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">CRÉDITO</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">CRÉDITO 2X</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">CRÉDITO 3X</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">CRÉDITO 4X5X6X</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">VOUCHER</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">Coluna1</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">(-) DESPESAS TAXA</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200">(-) DESPESAS CARTÃO</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">VENDA LÍQUIDA</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in vendasData" :key="index" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{{ item.adquirente }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.debito) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.credito) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.credito2x) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.credito3x) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.credito4x5x6x) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.voucher) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.coluna1) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.despesasTaxa) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(item.despesasCartao) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right font-medium">{{ formatCurrency(item.vendaLiquida) }}</td>
            </tr>
          </tbody>
          <!-- Linha de Totais -->
          <tfoot class="bg-yellow-50">
            <tr class="font-bold">
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">ÚNICA</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.debito) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.credito) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.credito2x) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.credito3x) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.credito4x5x6x) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.voucher) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.coluna1) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.despesasTaxa) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 text-right">{{ formatCurrency(totais.despesasCartao) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ formatCurrency(totais.vendaLiquida) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import IndexFilters from '~/components/index/IndexFilters.vue'

// Configurações da página
useHead({
  title: 'Controladoria - Vendas - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Conciliações de vendas' }
  ]
})

// Estados reativos da página
const empresaSelecionada = ref('')
const filtroData = reactive({
  dataInicial: '',
  dataFinal: ''
})

// Composables
const { getEmpresas } = useEmpresas()
const empresas = getEmpresas()

// Dados de exemplo baseados no print
const vendasData = ref([
  {
    adquirente: 'VISA ÚNICA',
    debito: 0,
    credito: 36635.04,
    credito2x: 25921.29,
    credito3x: 20509.22,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 1639.15,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 81426.40
  },
  {
    adquirente: 'VISA ELECTRON ÚNICA',
    debito: 154751.54,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 1330.86,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 153420.68
  },
  {
    adquirente: 'VISA SUPERMERCADO CRÉDITO ÚNICA',
    debito: 0,
    credito: 80420.38,
    credito2x: 34352.22,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 2684.99,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 113427.6
  },
  {
    adquirente: 'MAESTRO DÉBITO ÚNICA',
    debito: 82045.96,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 705.60,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 81340.36
  }
])

// Computed para totais
const totais = computed(() => {
  return vendasData.value.reduce((acc, item) => {
    acc.debito += item.debito
    acc.credito += item.credito
    acc.credito2x += item.credito2x
    acc.credito3x += item.credito3x
    acc.credito4x5x6x += item.credito4x5x6x
    acc.voucher += item.voucher
    acc.coluna1 += item.coluna1
    acc.despesasTaxa += item.despesasTaxa
    acc.despesasCartao += item.despesasCartao
    acc.vendaLiquida += item.vendaLiquida
    return acc
  }, {
    debito: 0,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 0,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 0
  })
})

// Métodos
const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const onEmpresaChanged = (novaEmpresa) => {
  console.log('Empresa alterada para:', novaEmpresa)
  // Lógica para filtrar dados por empresa
}

const onDataChanged = (novaData) => {
  console.log('Data alterada para:', novaData)
  // Lógica para filtrar dados por data
}

const aplicarFiltro = (filtro) => {
  console.log('Aplicando filtro:', filtro)
  // Lógica para aplicar filtros
}

// Inicialização
onMounted(() => {
  // Carregar dados iniciais se necessário
})
</script>