<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-gray-700">Filtros</h3>
      <div class="flex items-center gap-3">
        <BotaoAplicarFiltro 
          @aplicar-filtro="aplicarFiltros"
        />
        <button
          v-if="temFiltrosAtivos"
          @click="limparTodosFiltros"
          class="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Limpar todos os filtros
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Modalidade -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-500 mb-2">
          Modalidade
        </label>
        <div class="relative">
          <select
            v-model="filtros.modalidade"
            class="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
          >
            <option value="" class="text-gray-500">Modalidade</option>
            <option 
              v-for="modalidade in modalidadesOptions"
              :key="modalidade.value"
              :value="modalidade.value"
              class="text-gray-700"
            >
              {{ modalidade.label }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Icon name="heroicons:chevron-down" class="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <!-- Bandeira -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-500 mb-2">
          Bandeira
        </label>
        <div class="relative">
          <input
            v-model="filtros.bandeira"
            type="text"
            class="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-gray-300 transition-colors"
            placeholder="Digite a bandeira"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Icon name="heroicons:credit-card" class="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <!-- Data da Venda -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-500 mb-2">
          Data da venda
        </label>
        <div class="relative">
          <input
            v-model="filtros.dataVenda"
            type="date"
            class="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-gray-300 transition-colors"
            placeholder="30/10/2025"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Icon name="heroicons:calendar-days" class="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <!-- Venda Bruta -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-500 mb-2">
          Venda Bruta
        </label>
        <div class="relative">
          <input
            v-model="filtros.vendaBruta"
            type="number"
            step="0.01"
            min="0"
            class="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-gray-300 transition-colors"
            placeholder="R$ 0,00"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Icon name="heroicons:currency-dollar" class="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <!-- NSU -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-500 mb-2">
          NSU
        </label>
        <div class="relative">
          <input
            v-model="filtros.nsu"
            type="text"
            class="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-gray-300 transition-colors"
            placeholder="NSU"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Icon name="heroicons:hashtag" class="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BotaoAplicarFiltro from '../../BotaoAplicarFiltro.vue'

// Emits
const emit = defineEmits(['aplicar-filtros'])

// Estado local dos filtros
const filtros = ref({
  modalidade: '',
  bandeira: '',
  dataVenda: '',
  vendaBruta: '',
  nsu: ''
})

// Computed para verificar se há filtros ativos
const temFiltrosAtivos = computed(() => {
  return Object.values(filtros.value).some(valor => valor && valor.toString().trim() !== '')
})

// Função para aplicar filtros
const aplicarFiltros = () => {
  
  emit('aplicar-filtros', { ...filtros.value })
}

// Função para limpar todos os filtros
const limparTodosFiltros = () => {
  filtros.value = {
    modalidade: '',
    bandeira: '',
    dataVenda: '',
    vendaBruta: '',
    nsu: ''
  }
  // Aplicar filtros vazios imediatamente ao limpar
  aplicarFiltros()
}

// Modalidades disponíveis para o select
const modalidadesOptions = [
  {
    value: 'CREDITO',
    label: 'Crédito'
  },
  {
    value: 'DEBITO',
    label: 'Débito'
  },
  {
    value: 'PARCELADO',
    label: 'Parcelado'
  },
  {
    value: 'PIX',
    label: 'PIX'
  }
]


</script>