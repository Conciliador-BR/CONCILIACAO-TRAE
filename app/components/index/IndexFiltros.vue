<template>
  <!-- Filtros Simples (sempre visíveis em todas as páginas) -->
  <div class="px-6 py-4">
    <div class="max-w-6xl mx-auto">
      <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
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
  }
})

// Emits
const emit = defineEmits(['update:empresaSelecionada', 'update:filtroData', 'empresa-changed', 'aplicar-filtro'])

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