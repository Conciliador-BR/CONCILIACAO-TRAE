<template>
  <div class="space-y-6 mb-6">
    <div
      v-for="grupo in gruposOrdenados"
      :key="grupo.nome"
      class="overflow-hidden rounded-[24px] border border-[#DCE7F3] bg-white shadow-[0_12px_28px_rgba(16,42,67,0.08)] transition-all hover:shadow-[0_18px_36px_rgba(16,42,67,0.12)]"
    >
      <div class="flex flex-col items-start justify-between gap-4 border-b border-[#E7EFF8] bg-[#FAFCFF] px-6 py-4 md:flex-row md:items-center">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0" :style="{ backgroundColor: obterCorGrupo(grupo.nome) }">
            {{ grupo.nome.charAt(0) }}
          </div>
          <div>
            <h3 class="text-lg font-bold leading-tight text-[#102A43]">{{ formatarRotulo(grupo.nome) }}</h3>
            <p class="mt-0.5 flex items-center gap-1 text-sm font-medium text-slate-500">
              <BuildingLibraryIcon class="w-4 h-4" />
              {{ banco }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Transações</p>
            <p class="text-lg font-bold leading-none text-slate-700">{{ grupo.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
            <p class="text-lg font-bold leading-none text-[#8ad795]">{{ formatarValor(grupo.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-[#EEF3F8]">
        <div v-for="subgrupo in grupo.subgruposOrdenados" :key="`${grupo.nome}-${subgrupo.nome}`" class="bg-transparent">
          <div
            class="group flex cursor-pointer items-center justify-between px-6 py-4 transition-colors select-none hover:bg-slate-50"
            @click="toggleExpandir(grupo.nome, subgrupo.nome)"
          >
            <div class="flex items-center gap-3">
              <div class="h-8 w-2 rounded-full bg-slate-500"></div>
              <span class="font-semibold text-slate-700 transition-colors group-hover:text-[#102A43]">{{ formatarRotulo(subgrupo.nome) }}</span>
            </div>

            <div class="flex items-center gap-8 pr-2">
              <div class="text-right">
                <span class="mr-2 text-xs font-bold uppercase text-slate-500">Qtd</span>
                <span class="text-sm font-bold text-slate-700">{{ subgrupo.quantidade }}</span>
              </div>
              <div class="text-left min-w-[140px]">
                <span class="mr-2 text-xs font-bold uppercase text-slate-500">Total</span>
                <span class="text-sm font-bold text-[#8ad795]">{{ formatarValor(subgrupo.total) }}</span>
              </div>
            </div>
          </div>

          <div v-show="expandido(grupo.nome, subgrupo.nome)" class="border-t border-[#EEF3F8] bg-[#FAFCFF] px-4 pb-4 shadow-inner">
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
