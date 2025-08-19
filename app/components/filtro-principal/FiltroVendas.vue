<template>
  <div class="bg-white p-4 shadow-sm border-b">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Filtro de Empresa -->
      <SeletorEmpresa 
        v-model="empresaSelecionada" 
        :empresas="empresas"
        @empresa-changed="onEmpresaChanged"
      />
      
      <!-- Filtro de Data -->
      <FiltroData 
        v-model="filtroData"
        @data-changed="onDataChanged"
      />
      
      <!-- Filtros específicos de Vendas -->
      <select 
        v-model="statusVenda" 
        class="px-3 py-2 border rounded"
      >
        <option value="">Todos os Status</option>
        <option value="aprovada">Aprovadas</option>
        <option value="pendente">Pendentes</option>
        <option value="cancelada">Canceladas</option>
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
      />
      
      <input 
        v-model="valorMaximo" 
        type="number" 
        placeholder="Valor Máximo"
        class="px-3 py-2 border rounded"
      />
      
      <!-- Botão Aplicar Filtro -->
      <button 
        @click="aplicarFiltros"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Aplicar Filtro
      </button>
      
      <!-- Botão Limpar Filtros -->
      <button 
        @click="limparFiltros"
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        Limpar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SeletorEmpresa from '../SeletorEmpresa.vue'
import FiltroData from '../FiltroData.vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useVendas } from '~/composables/useVendas'

// Composables
const { empresas, fetchEmpresas } = useEmpresas()
const { aplicarFiltros: aplicarFiltrosVendas } = useVendas()

// Estados dos filtros básicos
const empresaSelecionada = ref('')
const filtroData = ref({ dataInicial: '', dataFinal: '' })

// Estados específicos de Vendas
const statusVenda = ref('')
const operadora = ref('')
const valorMinimo = ref(null)
const valorMaximo = ref(null)

// Função para obter o nome da empresa pelo ID
const obterNomeEmpresa = (empresaId) => {
  if (!empresaId) return ''
  
  // Se já é um nome (string), retorna como está
  if (typeof empresaId === 'string' && isNaN(empresaId)) {
    return empresaId
  }
  
  // Se é um ID numérico, busca o nome
  const empresa = empresas.value.find(e => e.id == empresaId)
  return empresa?.nome || empresaId
}

// Handlers de eventos
const onEmpresaChanged = (empresa) => {
  empresaSelecionada.value = empresa
}

const onDataChanged = (data) => {
  filtroData.value = data
}

// Função principal para aplicar filtros
const aplicarFiltros = () => {
  // Obter nome da empresa
  const nomeEmpresa = obterNomeEmpresa(empresaSelecionada.value)
  
  console.log('Aplicando filtros de vendas:', {
    empresaId: empresaSelecionada.value,
    empresaNome: nomeEmpresa,
    filtroData: filtroData.value,
    statusVenda: statusVenda.value,
    operadora: operadora.value,
    valorMinimo: valorMinimo.value,
    valorMaximo: valorMaximo.value
  })
  
  // Aplicar filtros básicos (empresa e data) usando useVendas
  aplicarFiltrosVendas({
    empresa: nomeEmpresa, // Passar nome da empresa, não ID
    dataInicial: filtroData.value.dataInicial,
    dataFinal: filtroData.value.dataFinal
  })
  
  // TODO: Implementar filtros específicos de vendas (status, operadora, valores)
  // Estes filtros podem ser aplicados em uma segunda etapa ou integrados ao useVendas
}

// Função para limpar todos os filtros
const limparFiltros = () => {
  empresaSelecionada.value = ''
  filtroData.value = { dataInicial: '', dataFinal: '' }
  statusVenda.value = ''
  operadora.value = ''
  valorMinimo.value = null
  valorMaximo.value = null
  
  // Aplicar filtros vazios (mostra todas as vendas)
  aplicarFiltrosVendas({
    empresa: '',
    dataInicial: '',
    dataFinal: ''
  })
}

// Inicialização
onMounted(async () => {
  await fetchEmpresas()
})
</script>