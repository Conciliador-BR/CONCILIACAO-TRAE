<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
    <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0" :style="{ backgroundColor: cor }">
          {{ adquirente.charAt(0) }}
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-800 leading-tight">{{ adquirente }}</h3>
          <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
            <BuildingLibraryIcon class="w-4 h-4" />
            {{ banco }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-8 w-full md:w-auto justify-end">
        <div class="text-right">
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transações</p>
          <p class="text-lg font-bold text-gray-700 leading-none">{{ quantidade }}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
          <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(total) }}</p>
        </div>
      </div>
    </div>

    <div class="p-4">
      <TransacoesResumidasAjustavel 
        :transacoes="transacoes" 
        :resolver-voucher="resolverVoucher"
        :titulo="''" 
      />
    </div>
  </div>
</template>

<script setup>
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'
import TransacoesResumidasAjustavel from './TransacoesResumidasAjustavel.vue'

const props = defineProps({
  adquirente: { type: String, required: true },
  banco: { type: String, default: 'Banco' },
  quantidade: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  cor: { type: String, default: '#6B7280' },
  transacoes: { type: Array, default: () => [] },
  resolverVoucher: { type: Function, default: () => '' }
})

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}
</script>
