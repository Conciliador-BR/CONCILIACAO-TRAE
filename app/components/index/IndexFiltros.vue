<template>
  <!-- Filtros Simples (sempre visíveis em todas as páginas) -->
  <div class="px-2 py-1">
    <div class="max-w-5xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6">
          <div class="flex flex-wrap items-center justify-center gap-4">
            <!-- Seletor de Empresa -->
            <SeletorEmpresa
              v-model="empresaSelecionada"
              :empresas="empresas"
              @empresa-changed="onEmpresaChanged"
            />

            <!-- Filtro de Data -->
            <FiltroData
              v-model="filtroData"
            />

            <!-- Botão Aplicar Filtro -->
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