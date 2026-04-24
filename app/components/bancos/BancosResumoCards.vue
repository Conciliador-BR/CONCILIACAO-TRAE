<template>
  <div class="mb-8 px-0 w-full">
    <div class="flex overflow-x-scroll overflow-y-hidden pb-4 gap-4 snap-x scrollbar-thin flex-nowrap">
      
      <!-- Card Total Geral (Limpa Filtro) -->
      <div 
        @click="emitFilter(null)"
        class="flex-none w-64 bg-[#102a43] text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer snap-start"
        :class="{ 'ring-4 ring-[#5e92cb] ring-offset-2': !activeFilter }"
      >
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-white/80 text-xs sm:text-sm lg:text-sm mb-1">Total Geral</p>
            <div class="space-y-1">
              <div>
                <span class="text-xs text-white/70 block">Previsto</span>
                <span class="text-lg font-bold">{{ formatCurrency(totalGeralPrevisto) }}</span>
              </div>
              <div>
                <span class="text-xs text-white/70 block">Pago</span>
                <span class="text-lg font-bold text-white">{{ formatCurrency(totalGeralPago) }}</span>
              </div>
            </div>
          </div>
          <BanknotesIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/70 ml-2" />
        </div>
      </div>

      <!-- Cards por Adquirente -->
        <div 
          v-for="(card, index) in cardsAdquirentes" 
          :key="card.adquirente"
          @click="emitFilter(card.adquirente)"
          class="flex-none w-64 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer snap-start"
          :class="[
            card.gradientClass,
            { 'ring-4 ring-offset-2': activeFilter === card.adquirente, [card.ringClass]: activeFilter === card.adquirente }
          ]"
        >
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-white text-opacity-90 text-xs sm:text-sm lg:text-sm truncate mb-1" :title="card.adquirente">
              {{ card.adquirente }}
            </p>
            <div class="space-y-1">
              <div>
                <span class="text-xs text-white text-opacity-70 block">Previsto</span>
                <span class="text-lg font-bold">{{ formatCurrency(card.totalPrevisto) }}</span>
              </div>
              <div>
                <span class="text-xs text-white text-opacity-70 block">Pago</span>
                <span class="text-lg font-bold text-white">{{ formatCurrency(card.totalPago) }}</span>
              </div>
            </div>
          </div>
          <CreditCardIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white text-opacity-40 ml-2" />
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
  { bg: 'bg-[#102a43]', ring: 'ring-[#5e92cb]' },
  { bg: 'bg-[#1E7E34]', ring: 'ring-[#B7E4C7]' },
  { bg: 'bg-[#B56A00]', ring: 'ring-[#FFD8A8]' },
  { bg: 'bg-[#244b77]', ring: 'ring-[#8bb5de]' },
]

// Calcular total geral previsto e pago
const totalGeralPrevisto = computed(() => {
  return props.movimentacoes.reduce((acc, mov) => acc + (Number(mov.previsto) || 0), 0)
})

const totalGeralPago = computed(() => {
  return props.movimentacoes.reduce((acc, mov) => acc + (Number(mov.deposito) || 0), 0)
})

// Calcular totais por adquirente
const cardsAdquirentes = computed(() => {
  const grupos = {}
  
  props.movimentacoes.forEach(mov => {
    const adq = mov.adquirente || 'Outros'
    if (!grupos[adq]) {
      grupos[adq] = { previsto: 0, pago: 0 }
    }
    grupos[adq].previsto += (Number(mov.previsto) || 0)
    grupos[adq].pago += (Number(mov.deposito) || 0)
  })

  // Converter para array e ordenar por valor previsto (decrescente)
  return Object.entries(grupos)
    .map(([adquirente, valores], index) => {
      const styleIndex = index % gradients.length
      return {
        adquirente,
        totalPrevisto: valores.previsto,
        totalPago: valores.pago,
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
  background: #f1f1f1;
  border-radius: 6px;
  margin: 0 20px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
  border: 3px solid #f1f1f1; /* Cria efeito de espaçamento */
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
