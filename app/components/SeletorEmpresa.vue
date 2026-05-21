<template>
  <div ref="dropdownRef" class="bg-white rounded-xl shadow-lg p-5 border-2 border-[#244b77] hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
    <label class="block text-sm font-semibold text-[#244b77] mb-3 flex items-center">
      <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm-2 5v7a2 2 0 002 2h12a2 2 0 002-2V9H2zm8 2a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clip-rule="evenodd"/>
      </svg>
      Empresa
    </label>

    <div class="relative min-w-[320px] sm:min-w-[380px] lg:min-w-[460px]">
      <button
        type="button"
        class="w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3.5 text-left shadow-sm transition-all duration-300 hover:border-[#73c77d] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#73c77d]/40 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="!empresas || empresas.length === 0"
        @click="alternarDropdown"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {{ empresaSelecionadaDetalhes ? 'Empresa selecionada' : 'Selecione uma empresa' }}
            </p>
            <p class="truncate text-base font-semibold text-[#163a5a]">
              {{ textoPrincipalSelecionado }}
            </p>
            <p class="truncate text-sm text-slate-500">
              {{ textoSecundarioSelecionado }}
            </p>
          </div>
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#244b77]">
            <svg class="h-5 w-5 transition-transform duration-200" :class="{ 'rotate-180': dropdownAberto }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      <transition name="dropdown-fade">
        <div
          v-if="dropdownAberto"
          class="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-100"
        >
          <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
            <p class="text-sm font-semibold text-[#163a5a]">Selecionar empresa</p>
            <p class="text-xs text-slate-500">Matriz e filiais agrupadas para facilitar a escolha</p>
          </div>

          <div class="max-h-[420px] overflow-y-auto px-3 py-3 seletor-scroll">
            <button
              type="button"
              class="mb-3 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200"
              :class="empresaSelecionadaDetalhes ? 'border-slate-200 bg-white text-slate-700 hover:border-[#73c77d] hover:bg-slate-50' : 'border-[#73c77d] bg-[#effbf1] text-[#163a5a] shadow-sm'"
              @click="selecionarEmpresa('')"
            >
              <div>
                <p class="text-sm font-semibold">Todas as Empresas</p>
                <p class="text-xs text-slate-500">Visão geral consolidada</p>
              </div>
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Geral</span>
            </button>

            <div
              v-for="grupo in gruposEmpresas"
              :key="grupo.nome"
              class="mb-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
            >
              <div class="mb-2 flex items-center justify-between gap-3 px-1">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-[#163a5a]">{{ grupo.nome }}</p>
                  <p class="text-xs text-slate-500">{{ grupo.empresas.length }} unidade<span v-if="grupo.empresas.length > 1">s</span></p>
                </div>
                <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#244b77] shadow-sm">
                  Grupo
                </span>
              </div>

              <div class="space-y-2">
                <button
                  v-for="empresa in grupo.empresas"
                  :key="empresa.id"
                  type="button"
                  class="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200"
                  :class="String(empresaSelecionada) === String(empresa.id)
                    ? 'border-[#73c77d] bg-white shadow-sm ring-1 ring-[#73c77d]/30'
                    : 'border-transparent bg-white/80 hover:border-[#BFDBFE] hover:bg-white hover:shadow-sm'"
                  @click="selecionarEmpresa(empresa.id)"
                >
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span
                        class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                        :class="obterTipoUnidade(empresa).variant"
                      >
                        {{ obterTipoUnidade(empresa).label }}
                      </span>
                      <span class="truncate text-sm font-semibold text-slate-800">
                        {{ empresa.nomeMatriz || empresa.nome }}
                      </span>
                    </div>
                    <p class="mt-1 truncate text-xs text-slate-500">
                      EC {{ empresa.matriz || 'Nao informado' }}
                    </p>
                  </div>

                  <div
                    class="ml-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border"
                    :class="String(empresaSelecionada) === String(empresa.id)
                      ? 'border-[#73c77d] bg-[#effbf1] text-[#2f7d32]'
                      : 'border-slate-200 bg-white text-transparent'"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="m5 13 4 4L19 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div v-if="empresas && empresas.length === 0" class="text-xs text-red-500 mt-2">
      Nenhuma empresa encontrada. Verifique a conexão com o banco de dados.
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  empresas: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'empresa-changed'])
const dropdownRef = ref(null)
const dropdownAberto = ref(false)

const empresaSelecionada = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const empresaSelecionadaDetalhes = computed(() => {
  return (props.empresas || []).find((empresa) => String(empresa.id) === String(props.modelValue)) || null
})

const textoPrincipalSelecionado = computed(() => {
  if (!props.empresas || props.empresas.length === 0) return 'Carregando empresas...'
  if (!empresaSelecionadaDetalhes.value) return 'Todas as Empresas'
  return empresaSelecionadaDetalhes.value.nome || 'Empresa selecionada'
})

const textoSecundarioSelecionado = computed(() => {
  if (!props.empresas || props.empresas.length === 0) return 'Aguarde o carregamento da lista'
  if (!empresaSelecionadaDetalhes.value) return 'Visualize todas as matrizes e filiais'

  const unidade = obterTipoUnidade(empresaSelecionadaDetalhes.value).label
  const complemento = empresaSelecionadaDetalhes.value.nomeMatriz || unidade
  return `${complemento} • EC ${empresaSelecionadaDetalhes.value.matriz || 'Nao informado'}`
})

const gruposEmpresas = computed(() => {
  const grupos = new Map()

  for (const empresa of props.empresas || []) {
    const chaveGrupo = String(empresa?.nome || `Empresa ${empresa?.id || ''}`).trim()
    if (!grupos.has(chaveGrupo)) {
      grupos.set(chaveGrupo, {
        nome: chaveGrupo,
        empresas: []
      })
    }

    grupos.get(chaveGrupo).empresas.push(empresa)
  }

  return Array.from(grupos.values()).map((grupo) => ({
    ...grupo,
    empresas: grupo.empresas.slice().sort((a, b) => prioridadeTipoUnidade(a) - prioridadeTipoUnidade(b))
  }))
})

const prioridadeTipoUnidade = (empresa) => {
  const nomeMatriz = String(empresa?.nomeMatriz || '').toLowerCase()
  if (nomeMatriz.includes('matriz')) return 0
  if (nomeMatriz.includes('filial')) return 1
  return 2
}

const obterTipoUnidade = (empresa) => {
  const nomeMatriz = String(empresa?.nomeMatriz || '').trim()
  const nomeMatrizNormalizado = nomeMatriz.toLowerCase()

  if (nomeMatrizNormalizado.includes('matriz')) {
    return {
      label: 'Matriz',
      variant: 'bg-emerald-50 text-emerald-700'
    }
  }

  if (nomeMatrizNormalizado.includes('filial')) {
    return {
      label: 'Filial',
      variant: 'bg-blue-50 text-blue-700'
    }
  }

  return {
    label: nomeMatriz || 'Unidade',
    variant: 'bg-slate-100 text-slate-700'
  }
}

const alternarDropdown = () => {
  if (!props.empresas || props.empresas.length === 0) return
  dropdownAberto.value = !dropdownAberto.value
}

const selecionarEmpresa = (empresaId) => {
  empresaSelecionada.value = empresaId
  emit('empresa-changed', empresaId)
  dropdownAberto.value = false
}

const handleClickFora = (event) => {
  if (!dropdownRef.value?.contains(event.target)) {
    dropdownAberto.value = false
  }
}

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', handleClickFora)
  }
})

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('click', handleClickFora)
  }
})
</script>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.18s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.seletor-scroll::-webkit-scrollbar {
  width: 8px;
}

.seletor-scroll::-webkit-scrollbar-track {
  background: #eef2f7;
  border-radius: 9999px;
}

.seletor-scroll::-webkit-scrollbar-thumb {
  background: #c7d5e4;
  border-radius: 9999px;
}

.seletor-scroll::-webkit-scrollbar-thumb:hover {
  background: #9fb5cc;
}
</style>
