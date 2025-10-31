<template>
  <!-- Filtros Simples (sempre visíveis em todas as páginas) -->
  <div class="px-6 py-1">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
        
        <!-- Seção de Navegação -->
        <div class="bg-gradient-to-r from-gray-50 via-white to-gray-50 px-8 py-6 border-b border-gray-200">
          <div class="flex items-center space-x-8 overflow-x-auto">
            <!-- Botão do Menu -->
            <button @click="$emit('toggle-sidebar')" class="p-3 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 flex-shrink-0">
              <Bars3Icon class="w-6 h-6" />
            </button>
            
            <!-- Tabs -->
            <div class="flex space-x-8 overflow-x-auto justify-center flex-1">
              <div 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="$emit('selecionar-aba', tab.id)"
                class="flex items-center py-3 px-4 cursor-pointer rounded-lg transition-all duration-200 whitespace-nowrap"
                :class="{
                  'bg-blue-50 text-blue-600 border border-blue-200': abaAtiva === tab.id,
                  'text-gray-500 hover:text-gray-700 hover:bg-gray-50': abaAtiva !== tab.id
                }"
              >
                <component :is="tab.icon" class="w-5 h-5 mr-2" />
                <span class="font-medium">{{ tab.name }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Conteúdo dos filtros -->
        <div class="bg-gradient-to-br from-white via-gray-50 to-blue-50 px-8 py-8">
          <div class="flex flex-wrap items-end justify-center gap-6">
            <!-- Seletor de Empresa -->
            <div class="transform hover:scale-105 transition-all duration-300">
              <SeletorEmpresa
                v-model="empresaSelecionada"
                :empresas="empresas"
                @empresa-changed="onEmpresaChanged"
              />
            </div>

            <!-- Filtro de Data -->
            <div class="transform hover:scale-105 transition-all duration-300">
              <FiltroData
                v-model="filtroData"
              />
            </div>

            <!-- Botão Aplicar Filtro -->
            <div class="transform hover:scale-105 transition-all duration-300">
              <BotaoAplicarFiltro
                :empresa-selecionada="empresaSelecionada"
                :filtro-data="filtroData"
                @aplicar-filtro="aplicarFiltros"
              />
            </div>
          </div>
        </div>
        
        <!-- Footer decorativo -->
        <div class="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import SeletorEmpresa from '~/components/SeletorEmpresa.vue'
import FiltroData from '~/components/FiltroData.vue'
import BotaoAplicarFiltro from '~/components/BotaoAplicarFiltro.vue'

// Props
const props = defineProps({
  empresas: {
    type: Array,
    default: () => []
  },
  empresaSelecionada: {
    type: [String, Number],
    default: ''
  },
  filtroData: {
    type: Object,
    default: () => ({ dataInicial: '', dataFinal: '' })
  },
  sidebarAberta: {
    type: Boolean,
    default: false
  },
  tabs: {
    type: Array,
    default: () => []
  },
  abaAtiva: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:empresaSelecionada', 'update:filtroData', 'empresa-changed', 'aplicar-filtro', 'selecionar-aba', 'toggle-sidebar'])

// Computed para v-model do empresaSelecionada
const empresaSelecionada = computed({
  get: () => props.empresaSelecionada,
  set: (value) => emit('update:empresaSelecionada', value)
})

// Computed para v-model do filtroData
const filtroData = computed({
  get: () => props.filtroData,
  set: (value) => emit('update:filtroData', value)
})

// Handlers
const onEmpresaChanged = (empresa) => {
  emit('empresa-changed', empresa)
}

const aplicarFiltros = (dadosFiltros) => {
  emit('aplicar-filtro', dadosFiltros)
}
</script>