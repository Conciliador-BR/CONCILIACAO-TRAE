<template>
  <div class="space-y-6 mb-6">
    <div
      v-for="grupo in grupos"
      :key="grupo.nome"
      class="overflow-hidden rounded-[24px] border border-[#DCE7F3] bg-white shadow-[0_12px_28px_rgba(16,42,67,0.08)] transition-all hover:shadow-[0_18px_36px_rgba(16,42,67,0.12)]"
    >
      <div class="flex flex-col items-start justify-between gap-4 border-b border-[#E7EFF8] bg-[#FAFCFF] px-6 py-4 md:flex-row md:items-center">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0" :style="{ backgroundColor: grupo.cor }">
            {{ grupo.nome.charAt(0) }}
          </div>
          <div>
            <h3 class="text-lg font-bold leading-tight text-[#102A43]">{{ grupo.nome }}</h3>
            <p class="mt-0.5 flex items-center gap-1 text-sm font-medium text-slate-500">
              <BuildingLibraryIcon class="w-4 h-4" />
              Multi-banco
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
        <div v-for="banco in grupo.bancos" :key="`${grupo.nome}-${banco.chave}`" class="bg-transparent">
          <div
            class="group flex cursor-pointer items-center justify-between px-6 py-4 transition-colors select-none hover:bg-slate-50"
            @click="toggleExpandir(grupo.nome, banco.chave)"
          >
            <div class="flex items-center gap-3">
              <div class="h-8 w-2 rounded-full bg-slate-500"></div>
              <span class="font-semibold text-slate-700 transition-colors group-hover:text-[#102A43]">{{ banco.nome }}</span>
            </div>

            <div class="flex items-center gap-8 pr-2">
              <div class="text-right">
                <span class="mr-2 text-xs font-bold uppercase text-slate-500">Qtd</span>
                <span class="text-sm font-bold text-slate-700">{{ banco.quantidade }}</span>
              </div>
              <div class="text-left min-w-[140px]">
                <span class="mr-2 text-xs font-bold uppercase text-slate-500">Total</span>
                <span class="text-sm font-bold text-[#8ad795]">{{ formatarValor(banco.total) }}</span>
              </div>
            </div>
          </div>

          <div v-show="expandido(grupo.nome, banco.chave)" class="border-t border-[#EEF3F8] bg-[#FAFCFF] px-4 pb-4 shadow-inner">
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
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'
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


