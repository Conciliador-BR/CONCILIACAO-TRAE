<template>
  <!-- Filtros Simples (sempre visíveis em todas as páginas) -->
  <div class="px-2 sm:px-4 lg:px-6 xl:px-8 py-1">
    <div class="w-full mx-auto">
      <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
        
        <!-- Seção de Navegação -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div class="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 xl:space-x-8 overflow-x-auto min-h-[60px]">
            <!-- Botão do Menu -->
            <button @click="$emit('toggle-sidebar')" class="p-3 rounded-xl text-blue-100 hover:text-white hover:bg-blue-400/30 transition-colors border border-transparent hover:border-blue-300/50 flex-shrink-0">
              <Bars3Icon class="w-6 h-6" />
            </button>
            
            <!-- Tabs -->
            <div class="flex space-x-2 sm:space-x-4 lg:space-x-6 xl:space-x-8 overflow-x-auto justify-center flex-1">
              <div 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="$emit('selecionar-aba', tab.id)"
                class="flex items-center py-3 px-3 sm:px-4 lg:px-5 xl:px-6 cursor-pointer rounded-lg transition-all duration-200 whitespace-nowrap"
                :class="{
                  'bg-white/20 text-white border border-white/30': abaAtiva === tab.id,
                  'text-white hover:text-white hover:bg-white/10': abaAtiva !== tab.id
                }"
              >
                <component :is="tab.icon" class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                <span class="font-semibold text-sm sm:text-base lg:text-base xl:text-lg">{{ tab.name }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Linha separadora com gradiente azul -->
        <div class="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <!-- Conteúdo dos filtros -->
        <div class="bg-white px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8">
          <div class="flex flex-wrap items-end justify-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
            <!-- Seletor de Empresa -->
            <div class="transform hover:scale-105 transition-all duration-300 w-full sm:w-auto min-w-[200px] sm:min-w-[250px] lg:min-w-[300px]">
              <SeletorEmpresa
                v-model="empresaSelecionada"
                :empresas="empresas"
                @empresa-changed="onEmpresaChanged"
              />
            </div>

            <!-- Filtro de Data -->
            <div class="transform hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <FiltroData
                v-model="filtroData"
              />
            </div>

            <!-- Botão Aplicar Filtro -->
            <div class="transform hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <BotaoAplicarFiltro
                :empresa-selecionada="empresaSelecionada"
                :filtro-data="filtroData"
                @aplicar-filtro="aplicarFiltros"
              />
            </div>
          </div>
        </div>
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