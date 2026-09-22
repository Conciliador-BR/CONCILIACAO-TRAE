<template>
  <div class="space-y-6 mb-6">
    <div
      v-for="grupo in gruposOrdenados"
      :key="grupo.nome"
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
    >
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0" :style="{ backgroundColor: obterCorGrupo(grupo.nome) }">
            {{ grupo.nome.charAt(0) }}
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">{{ formatarRotulo(grupo.nome) }}</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              {{ banco }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transações</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ grupo.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(grupo.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="subgrupo in grupo.subgruposOrdenados" :key="`${grupo.nome}-${subgrupo.nome}`" class="bg-white">
          <div
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none"
            @click="toggleExpandir(grupo.nome, subgrupo.nome)"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-8 rounded-full bg-slate-400"></div>
              <span class="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{{ formatarRotulo(subgrupo.nome) }}</span>
            </div>

            <div class="flex items-center gap-8 pr-2">
              <div class="text-right">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Qtd</span>
                <span class="text-sm font-bold text-gray-700">{{ subgrupo.quantidade }}</span>
              </div>
              <div class="text-left min-w-[140px]">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Total</span>
                <span class="text-sm font-bold text-emerald-600">{{ formatarValor(subgrupo.total) }}</span>
              </div>
            </div>
          </div>

          <div v-show="expandido(grupo.nome, subgrupo.nome)" class="px-4 pb-4 bg-gray-50 border-t border-gray-100/50 shadow-inner">
            <div class="pt-4">
              <TransacoesResumidasAjustavel
                :transacoes="subgrupo.transacoes"
                :resolver-voucher="resolverVoucher"
                :titulo="''"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'
import { agruparTransacoesPagamentosBanco } from '~/composables/usePagamentoBancoEngine'
import TransacoesResumidasAjustavel from './TransacoesResumidasAjustavel.vue'

const props = defineProps({
  banco: {
    type: String,
    default: 'Banco'
  },
  transacoes: {
    type: Array,
    default: () => []
  },
  resolverVoucher: {
    type: Function,
    default: () => ''
  }
})

const { detectarAdquirente } = useAdquirenteDetector()

const ORDEM_GRUPOS = [
  'UNICA',
  'CIELO',
  'STONE',
  'GETNET',
  'SAFRA',
  'REDE',
  'SIPAG',
  'SICREDI',
  'PAGSEGURO',
  'AZULZINHA',
  'MERCADOPAGO',
  'BIN',
  'CABAL'
]

const CORES_GRUPO = {
  UNICA: '#7C3AED',
  CIELO: '#0EA5E9',
  REDE: '#EA580C',
  STONE: '#374151',
  AZULZINHA: '#3B82F6',
  SIPAG: '#059669',
  SICREDI: '#16A34A',
  PAGSEGURO: '#0EA5E9',
  GETNET: '#0891B2',
  SAFRA: '#16A34A',
  MERCADOPAGO: '#F59E0B',
  BIN: '#6B7280',
  CABAL: '#FACC15',
  ALELO: '#F59E0B',
  TICKET: '#EF4444',
  VR: '#10B981',
  PLUXEE: '#EF4444',
  LIBERCARD: '#A855F7',
  'LE CARD': '#84CC16'
}

const expandidos = ref({})

const chaveExpandida = (grupo, subgrupo) => `${grupo}::${subgrupo}`

const expandido = (grupo, subgrupo) => Boolean(expandidos.value[chaveExpandida(grupo, subgrupo)])

const toggleExpandir = (grupo, subgrupo) => {
  const chave = chaveExpandida(grupo, subgrupo)
  expandidos.value[chave] = !expandidos.value[chave]
}

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

const formatarRotulo = (valor) => {
  const texto = String(valor || '').trim().toUpperCase()
  const mapa = {
    'ELO DEBITO': 'ELO DÉBITO',
    'ELO CREDITO': 'ELO CRÉDITO',
    'CABAL DEBITO': 'CABAL DÉBITO',
    'CABAL CREDITO': 'CABAL CRÉDITO',
    'DNS DEBITO': 'DNS DÉBITO'
  }
  return mapa[texto] || texto
}

const obterCorGrupo = (grupo) => {
  const chave = String(grupo || '').trim().toUpperCase()
  return CORES_GRUPO[chave] || '#6B7280'
}

const prioridadeGrupo = (grupo) => {
  const indice = ORDEM_GRUPOS.indexOf(String(grupo || '').trim().toUpperCase())
  return indice === -1 ? Number.MAX_SAFE_INTEGER : indice
}

const gruposOrdenados = computed(() => {
  const grupos = agruparTransacoesPagamentosBanco(props.transacoes || [], detectarAdquirente)

  return Object.values(grupos)
    .map((grupo) => ({
      ...grupo,
      subgruposOrdenados: Object.values(grupo.subgrupos || {}).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')
      })
    }))
    .sort((a, b) => {
      const prioridadeA = prioridadeGrupo(a.nome)
      const prioridadeB = prioridadeGrupo(b.nome)
      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB
      if (b.total !== a.total) return b.total - a.total
      return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')
    })
})
</script>
