<template>
  <!-- Filtros Simples (sempre visíveis em todas as páginas) -->
  <div class="relative z-[1000] w-full max-w-full overflow-visible px-2 py-1 sm:px-4 lg:px-6 xl:px-8">
    <div class="relative z-[1000] mx-auto w-full max-w-full min-w-0 overflow-visible">
      <div class="index-filtros-shell relative z-[1000] w-full max-w-full min-w-0 overflow-visible rounded-3xl border border-gray-100 bg-white shadow-2xl">
        
        <!-- Seção de Navegação -->
        <div class="index-filtros-header bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-3 py-4 text-white sm:px-6 sm:py-6 lg:px-8 xl:px-12">
          <div class="flex justify-center mb-4">
            <img
              :src="logoSrc"
              alt="Economic Card Conciliadora"
              class="index-filtros-logo h-auto w-full max-w-[18rem] object-contain sm:max-w-xs lg:max-w-sm"
            >
          </div>

          <div class="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4">
            <!-- Botão do Menu -->
            <button @click="$emit('toggle-sidebar')" class="shrink-0 rounded-xl border border-transparent p-2.5 text-white/90 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white sm:p-3">
              <Bars3Icon class="w-6 h-6" />
            </button>
            
            <!-- Tabs -->
            <div class="flex min-w-0 flex-1 flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4">
              <div 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="$emit('selecionar-aba', tab.id)"
                class="flex min-w-0 cursor-pointer items-center rounded-lg px-2.5 py-2 text-center transition-all duration-200 sm:px-4 sm:py-3 lg:px-5"
                :class="{
                  'bg-white/15 text-white border border-white/25 shadow-sm': abaAtiva === tab.id,
                  'text-white/90 hover:text-white hover:bg-white/10': abaAtiva !== tab.id
                }"
              >
                <component :is="tab.icon" class="mr-1.5 h-5 w-5 shrink-0 sm:mr-2 sm:h-6 sm:w-6" />
                <span class="truncate text-xs font-semibold sm:text-sm lg:text-base">{{ tab.name }}</span>
              </div>
            </div>

            <button
              @click="$emit('logout')"
              class="flex shrink-0 cursor-pointer items-center rounded-lg px-3 py-2 text-white/95 transition-all duration-200 hover:bg-white/10 hover:text-white sm:px-5 sm:py-3"
            >
              <ArrowRightOnRectangleIcon class="mr-1.5 h-5 w-5 sm:mr-2 sm:h-6 sm:w-6" />
              <span class="text-xs font-semibold sm:text-sm lg:text-base">Logout</span>
            </button>
          </div>
        </div>
        
        <!-- Linha separadora com gradiente verde da logo -->
        <div class="h-1 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#8ad795]"></div>
        
        <!-- Conteúdo dos filtros -->
        <div class="overflow-visible bg-white px-3 py-3 sm:px-6 sm:py-4 lg:px-8 xl:px-12">
          <div class="grid w-full min-w-0 grid-cols-1 items-end gap-3 overflow-visible md:grid-cols-3 xl:flex xl:flex-wrap xl:items-end">
            <!-- Seletor de Empresa -->
            <div class="index-filtro-card relative z-[1200] w-full min-w-0 max-w-full xl:flex-[1_1_36rem]">
              <SeletorEmpresa
                v-model="empresaSelecionada"
                :empresas="empresas"
                @empresa-changed="onEmpresaChanged"
              />
            </div>

            <!-- Filtro de Data -->
            <div class="index-filtro-card relative z-[1100] w-full min-w-0 max-w-full xl:flex-[1_1_26rem]">
              <FiltroData
                v-model="filtroData"
              />
            </div>

            <!-- Botão Aplicar Filtro -->
            <div class="index-filtro-card flex w-full min-w-0 justify-center self-center xl:w-auto xl:flex-none">
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
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/vue/24/outline'
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
const emit = defineEmits(['update:empresaSelecionada', 'update:filtroData', 'empresa-changed', 'aplicar-filtro', 'selecionar-aba', 'toggle-sidebar', 'logout'])

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

const runtimeConfig = useRuntimeConfig()
const logoSrc = computed(() => `${runtimeConfig.app.baseURL}economic-card-logo.png`)

// Handlers
const onEmpresaChanged = (empresa) => {
  emit('empresa-changed', empresa)
}

const aplicarFiltros = (dadosFiltros) => {
  emit('aplicar-filtro', dadosFiltros)
}
</script>

<style scoped>
.index-filtros-shell,
.index-filtros-header,
.index-filtros-logo,
.index-filtro-card {
  transform: translateZ(0);
  backface-visibility: hidden;
}

.index-filtros-shell {
  isolation: isolate;
}

.index-filtro-card {
  transition: filter 0.25s ease, box-shadow 0.25s ease;
}

.index-filtro-card:hover {
  filter: brightness(1.01);
}
</style>
