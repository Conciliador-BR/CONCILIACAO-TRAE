<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6" v-if="vendas.length > 0">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">4. Vendas Processadas</h2>
      <div class="flex space-x-4">
        <span class="text-sm text-gray-600">
          Total: {{ vendas.length }} vendas
        </span>
        <span class="text-sm text-gray-600">
          Valor Bruto: {{ formatCurrency(valorBrutoTotal) }}
        </span>
        <span class="text-sm text-gray-600 font-semibold text-green-600">
          Valor Líquido: {{ formatCurrency(valorLiquidoTotal) }}
        </span>
      </div>
    </div>
    
    <!-- Tabela de Vendas -->
    <div class="overflow-x-auto">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">ID</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Modalidade</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Bruto</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Taxa MDR</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa MDR</th>
            <th class="px-2 py-2 text-center text-xs font-medium">Nº Parcelas</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Bandeira</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido Antecipação</th>
            <th class="px-2 py-2 text-center text-xs font-medium text-blue-600">Previsão PGTO</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Adquirente</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Empresa</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Matriz</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(venda, index) in paginatedVendas" 
            :key="index"
            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="px-2 py-2 text-xs">{{ venda.id || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(venda.data_venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.modalidade }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ venda.nsu }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium">{{ formatCurrency(venda.valor_bruto) }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium text-green-600">{{ formatCurrency(venda.valor_liquido) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.taxa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.despesa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-center">{{ venda.numero_parcelas || 1 }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.bandeira }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.despesa_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_liquido_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-center font-medium text-blue-600">{{ venda.previsao_calculada }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.adquirente }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.empresa }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.matriz }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Componente de Paginação -->
    <VendasPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :items-per-page="itemsPerPage"
      @update:currentPage="setPage"
      @update:itemsPerPage="setItemsPerPage"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { usePrevisaoPagamento } from '~/composables/importacao/Envio_vendas/usePrevisaoPagamento'
import VendasPagination from './VendasPagination.vue'

const props = defineProps({
  vendas: {
    type: Array,
    default: () => []
  }
})

// Estados para paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Usar o composable centralizado para cálculo de previsões
const { calcularPrevisaoVenda, carregarTaxas, limparCacheParcelas } = usePrevisaoPagamento()

// Computed para paginação
const totalItems = computed(() => props.vendas.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Watcher para limpar cache quando vendas mudarem
watch(() => props.vendas, (novasVendas, vendasAnteriores) => {
  // Limpar cache apenas se as vendas realmente mudaram
  if (novasVendas !== vendasAnteriores) {
    limparCacheParcelas()
  }
}, { deep: true })

// Computed para calcular previsões uma única vez
const vendasComPrevisao = computed(() => {
  return props.vendas.map(venda => ({
    ...venda,
    previsao_calculada: calcularPrevisaoVenda(venda)
  }))
})

const paginatedVendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return vendasComPrevisao.value.slice(start, end)
})

// Métodos de paginação
const setPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const setItemsPerPage = (newSize) => {
  itemsPerPage.value = newSize
  currentPage.value = 1 // Reset para primeira página
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const valorBrutoTotal = computed(() => {
  return props.vendas.reduce((total, venda) => total + (venda.valor_bruto || 0), 0)
})

const valorLiquidoTotal = computed(() => {
  return props.vendas.reduce((total, venda) => total + (venda.valor_liquido || 0), 0)
})

// ✅ Função para cores alternadas nas linhas
const getRowClasses = (index) => {
  const baseClasses = 'border-t hover:bg-blue-50 transition-colors duration-150'
  const isEven = index % 2 === 0
  return isEven ? baseClasses + ' bg-white' : baseClasses + ' bg-gray-50'
}



const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  // Função para criar data de forma segura (evita problemas de timezone)
  const criarDataSegura = (dataString) => {
    if (!dataString) return null
    
    // Se já é um objeto Date válido
    if (dataString instanceof Date && !isNaN(dataString.getTime())) {
      return new Date(dataString.getFullYear(), dataString.getMonth(), dataString.getDate())
    }
    
    const str = String(dataString).trim()
    
    // Formato YYYY-MM-DD (mais comum vindo do banco)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [ano, mes, dia] = str.split('-').map(Number)
      return new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [dia, mes, ano] = str.split('/').map(Number)
      return new Date(ano, mes - 1, dia)
    }
    
    return null
  }
  
  const data = criarDataSegura(dateString)
  if (!data || isNaN(data.getTime())) {
    console.warn('Data inválida para formatação:', dateString)
    return '-'
  }
  
  return data.toLocaleDateString('pt-BR')
}

// Carregar taxas quando o componente for montado
onMounted(async () => {
  await carregarTaxas()
})
</script>