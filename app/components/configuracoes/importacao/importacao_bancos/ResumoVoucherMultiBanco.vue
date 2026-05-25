<template>
  <div class="space-y-6 mb-6">
    <div
      v-for="grupo in grupos"
      :key="grupo.nome"
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
    >
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0" :style="{ backgroundColor: grupo.cor }">
            {{ grupo.nome.charAt(0) }}
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">{{ grupo.nome }}</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Multi-banco
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
        <div v-for="banco in grupo.bancos" :key="`${grupo.nome}-${banco.chave}`" class="bg-white">
          <div
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none"
            @click="toggleExpandir(grupo.nome, banco.chave)"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-8 rounded-full bg-slate-400"></div>
              <span class="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{{ banco.nome }}</span>
            </div>

            <div class="flex items-center gap-6">
              <div class="text-right">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Qtd</span>
                <span class="text-sm font-bold text-gray-700">{{ banco.quantidade }}</span>
              </div>
              <div class="text-right w-24">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Total</span>
                <span class="text-sm font-bold text-emerald-600">{{ formatarValor(banco.total) }}</span>
              </div>
              <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <ChevronDownIcon v-if="!expandido(grupo.nome, banco.chave)" class="w-4 h-4" />
                <ChevronUpIcon v-else class="w-4 h-4" />
              </div>
            </div>
          </div>

          <div v-show="expandido(grupo.nome, banco.chave)" class="px-4 pb-4 bg-gray-50 border-t border-gray-100/50 shadow-inner">
            <div class="pt-4">
              <TransacoesResumidasAjustavel
                :transacoes="banco.transacoes"
                :resolver-voucher="() => grupo.nome"
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
import { ref } from 'vue'
import { BuildingLibraryIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'
import TransacoesResumidasAjustavel from './TransacoesResumidasAjustavel.vue'

defineProps({
  grupos: {
    type: Array,
    default: () => []
  }
})

const expandidos = ref({})

const chaveExpandida = (voucher, banco) => `${voucher}::${banco}`

const expandido = (voucher, banco) => Boolean(expandidos.value[chaveExpandida(voucher, banco)])

const toggleExpandir = (voucher, banco) => {
  const chave = chaveExpandida(voucher, banco)
  expandidos.value[chave] = !expandidos.value[chave]
}

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}
</script>
