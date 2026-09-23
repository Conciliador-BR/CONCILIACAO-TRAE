<template>
  <div class="mb-8 px-0 w-full">
    <div class="flex overflow-x-scroll overflow-y-hidden gap-4 pb-4 snap-x scrollbar-thin flex-nowrap">
      
      <!-- Card Total Geral (Limpa Filtro) -->
      <div 
        @click="emitFilter(null)"
        class="flex-none w-64 cursor-pointer snap-start rounded-[24px] border border-[#DCE7F3] bg-gradient-to-br from-[#eef6ff] via-white to-[#f5fbff] p-4 text-[#102A43] shadow-[0_14px_34px_rgba(16,42,67,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(16,42,67,0.12)]"
        :class="{ 'ring-2 ring-[#5e92cb] ring-offset-2 ring-offset-white': !activeFilter }"
      >
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-slate-500 text-xs sm:text-sm lg:text-sm mb-1">Total Geral</p>
            <div class="space-y-1">
              <div>
                <span class="text-xs text-slate-400 block">Previsto</span>
                <span class="text-lg font-bold">{{ formatCurrency(totalGeralPrevisto) }}</span>
              </div>
              <div>
                <span class="text-xs text-slate-400 block">Pago</span>
                <span class="text-lg font-bold text-[#244B77]">{{ formatCurrency(totalGeralPago) }}</span>
              </div>
            </div>
          </div>
          <BanknotesIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#5e92cb] ml-2" />
        </div>
      </div>

      <!-- Cards por Adquirente -->
        <div 
          v-for="(card, index) in cardsAdquirentes" 
          :key="card.adquirente"
          @click="emitFilter(card.adquirente)"
          class="flex-none w-64 cursor-pointer snap-start rounded-[24px] border border-[#DCE7F3] p-4 text-[#102A43] shadow-[0_14px_34px_rgba(16,42,67,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(16,42,67,0.12)]"
          :class="[
            card.gradientClass,
            { 'ring-2 ring-offset-2 ring-offset-white': activeFilter === card.adquirente, [card.ringClass]: activeFilter === card.adquirente }
          ]"
        >
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-slate-700 text-xs sm:text-sm lg:text-sm truncate mb-1" :title="card.adquirente">
              {{ card.adquirente }}
            </p>
            <div class="space-y-1">
              <div>
                <span class="text-xs text-slate-500 block">Previsto</span>
                <span class="text-lg font-bold">{{ formatCurrency(card.totalPrevisto) }}</span>
              </div>
              <div>
                <span class="text-xs text-slate-500 block">Pago</span>
                <span class="text-lg font-bold text-[#244B77]">{{ formatCurrency(card.totalPago) }}</span>
              </div>
            </div>
          </div>
          <CreditCardIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#5e92cb] ml-2" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { BanknotesIcon, CreditCardIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  movimentacoes: { type: Array, default: () => [] },
  activeFilter: { type: String, default: null }
})

const emit = defineEmits(['filter-adquirente'])

// Lista de gradientes para os cards
const gradients = [
  { bg: 'bg-[linear-gradient(145deg,#eef6ff,#ffffff)]', ring: 'ring-[#5e92cb]' },
  { bg: 'bg-[linear-gradient(145deg,#eefbf2,#ffffff)]', ring: 'ring-[#7ad68f]' },
  { bg: 'bg-[linear-gradient(145deg,#fff7eb,#ffffff)]', ring: 'ring-[#f6c46e]' },
  { bg: 'bg-[linear-gradient(145deg,#f2f8ff,#ffffff)]', ring: 'ring-[#8bb5de]' },
]

// Calcular total geral previsto e pago
const totalGeralPrevisto = computed(() => {
  return props.movimentacoes.reduce((acc, mov) => acc + (Number(mov.previsto) || 0), 0)
})

const totalGeralPago = computed(() => {
  const totaisPorAdquirente = {}

  props.movimentacoes.forEach(mov => {
    const adq = mov.adquirente || 'Outros'
    const temTotalConsolidado = Object.prototype.hasOwnProperty.call(mov, 'depositoTotalAdquirente')

    if (temTotalConsolidado) {
      totaisPorAdquirente[adq] = Number(mov.depositoTotalAdquirente || 0)
      return
    }

    totaisPorAdquirente[adq] = (totaisPorAdquirente[adq] || 0) + (Number(mov.deposito) || 0)
  })

  return Object.values(totaisPorAdquirente).reduce((acc, valor) => acc + valor, 0)
})

// Calcular totais por adquirente
const cardsAdquirentes = computed(() => {
  const grupos = {}
  
  props.movimentacoes.forEach(mov => {
    const adq = mov.adquirente || 'Outros'
    if (!grupos[adq]) {
      grupos[adq] = { previsto: 0, pago: 0, pagoConsolidado: null }
    }

    grupos[adq].previsto += (Number(mov.previsto) || 0)

    if (Object.prototype.hasOwnProperty.call(mov, 'depositoTotalAdquirente')) {
      grupos[adq].pagoConsolidado = Number(mov.depositoTotalAdquirente || 0)
    } else {
      grupos[adq].pago += (Number(mov.deposito) || 0)
    }
  })

  // Converter para array e ordenar por valor previsto (decrescente)
  return Object.entries(grupos)
    .map(([adquirente, valores], index) => {
      const styleIndex = index % gradients.length
      return {
        adquirente,
        totalPrevisto: valores.previsto,
        totalPago: valores.pagoConsolidado ?? valores.pago,
        gradientClass: gradients[styleIndex].bg,
        ringClass: gradients[styleIndex].ring
      }
    })
    .sort((a, b) => b.totalPrevisto - a.totalPrevisto)
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const emitFilter = (adquirente) => {
  emit('filter-adquirente', adquirente)
}
</script>

<style scoped>
/* Estilizar a barra de rolagem para ficar mais elegante e sempre visível */
.scrollbar-thin::-webkit-scrollbar {
  height: 12px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #e6edf5;
  border-radius: 6px;
  margin: 0 20px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #9ab7d3;
  border-radius: 6px;
  border: 3px solid #e6edf5; /* Cria efeito de espaçamento */
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #7fa4c7;
}
</style>
