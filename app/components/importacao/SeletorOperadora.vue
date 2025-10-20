<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-xl font-semibold mb-4">2. Selecione a Operadora</h2>
    <div v-if="disabled" class="text-gray-400 text-sm mb-4">
      ⚠️ Selecione uma empresa primeiro
    </div>
    
    <!-- Seção Cartões -->
    <div class="mb-8">
      <h3 class="text-lg font-medium text-gray-800 mb-3 flex items-center">
        <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
        Cartões ({{ operadorasCartoes.length }})
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div 
          v-for="operadora in operadorasCartoes" 
          :key="operadora.id"
          @click="!disabled && $emit('operadora-selecionada', operadora.id)"
          :class="[
            'border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center',
            disabled 
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
              : modelValue === operadora.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          ]"
        >
          <div class="flex flex-col items-center">
            <div :class="['w-12 h-12 rounded-full flex items-center justify-center mb-2', operadora.cor]">
              <span class="text-white font-bold text-lg">{{ operadora.sigla }}</span>
            </div>
            <span class="text-sm font-medium text-gray-700">{{ operadora.nome }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Seção Vouchers -->
    <div>
      <h3 class="text-lg font-medium text-gray-800 mb-3 flex items-center">
        <span class="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
        Vouchers ({{ operadorasVouchers.length }})
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div 
          v-for="operadora in operadorasVouchers" 
          :key="operadora.id"
          @click="!disabled && $emit('operadora-selecionada', operadora.id)"
          :class="[
            'border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center',
            disabled 
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
              : modelValue === operadora.id 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          ]"
        >
          <div class="flex flex-col items-center">
            <div :class="['w-12 h-12 rounded-full flex items-center justify-center mb-2', operadora.cor]">
              <span class="text-white font-bold text-lg">{{ operadora.sigla }}</span>
            </div>
            <span class="text-sm font-medium text-gray-700">{{ operadora.nome }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  modelValue: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['operadora-selecionada'])

// Computed para separar operadoras por categoria
const operadorasCartoes = computed(() => 
  operadoras.filter(op => op.categoria === 'Cartão')
)

const operadorasVouchers = computed(() => 
  operadoras.filter(op => op.categoria === 'Voucher')
)

const operadoras = [
  // === CARTÕES ===
  { id: 'tripag', nome: 'Tripag', sigla: 'TP', cor: 'bg-blue-800', categoria: 'Cartão' },
  { id: 'unica', nome: 'Única', sigla: 'UN', cor: 'bg-purple-600', categoria: 'Cartão' },
  { id: 'cielo', nome: 'Cielo', sigla: 'CI', cor: 'bg-blue-500', categoria: 'Cartão' },
  { id: 'sipag', nome: 'Sipag', sigla: 'SP', cor: 'bg-green-600', categoria: 'Cartão' },
  { id: 'sicredi', nome: 'Sicredi', sigla: 'SI', cor: 'bg-red-600', categoria: 'Cartão' },
  { id: 'rede', nome: 'Rede', sigla: 'RD', cor: 'bg-orange-600', categoria: 'Cartão' },
  { id: 'stone', nome: 'Stone', sigla: 'ST', cor: 'bg-gray-700', categoria: 'Cartão' },
  { id: 'azulzinha', nome: 'Azulzinha', sigla: 'AZ', cor: 'bg-blue-400', categoria: 'Cartão' },
  
  // === VOUCHERS ===
  { id: 'alelo', nome: 'Alelo', sigla: 'AL', cor: 'bg-yellow-500', categoria: 'Voucher' },
  { id: 'ticket', nome: 'Ticket', sigla: 'TK', cor: 'bg-red-500', categoria: 'Voucher' },
  { id: 'vr', nome: 'VR', sigla: 'VR', cor: 'bg-green-500', categoria: 'Voucher' },
  { id: 'sodexo', nome: 'Sodexo', sigla: 'SD', cor: 'bg-purple-500', categoria: 'Voucher' },
  { id: 'pluxe', nome: 'Pluxe', sigla: 'PL', cor: 'bg-cyan-500', categoria: 'Voucher' },
  { id: 'comprocard', nome: 'Comprocard', sigla: 'CC', cor: 'bg-orange-500', categoria: 'Voucher' },
  { id: 'lecard', nome: 'Lecard', sigla: 'LC', cor: 'bg-lime-500', categoria: 'Voucher' },
  { id: 'upbrasil', nome: 'Up Brasil', sigla: 'UB', cor: 'bg-green-600', categoria: 'Voucher' },
  { id: 'ecxcard', nome: 'ECX Card', sigla: 'EC', cor: 'bg-purple-600', categoria: 'Voucher' },
  { id: 'fncard', nome: 'FN Card', sigla: 'FN', cor: 'bg-pink-500', categoria: 'Voucher' },
  { id: 'benvisa', nome: 'Ben Visa', sigla: 'BV', cor: 'bg-teal-500', categoria: 'Voucher' },
  { id: 'credshop', nome: 'Credshop', sigla: 'CS', cor: 'bg-pink-600', categoria: 'Voucher' },
  { id: 'rccard', nome: 'RC Card', sigla: 'RC', cor: 'bg-rose-500', categoria: 'Voucher' },
  { id: 'goodcard', nome: 'Good Card', sigla: 'GC', cor: 'bg-emerald-500', categoria: 'Voucher' },
  { id: 'bigcard', nome: 'Big Card', sigla: 'BC', cor: 'bg-amber-500', categoria: 'Voucher' },
  { id: 'bkcard', nome: 'BK Card', sigla: 'BK', cor: 'bg-violet-500', categoria: 'Voucher' },
  { id: 'greencard', nome: 'Green Card', sigla: 'GR', cor: 'bg-green-500', categoria: 'Voucher' },
  { id: 'brasilcard', nome: 'Brasilcard', sigla: 'BR', cor: 'bg-red-400', categoria: 'Voucher' },
  { id: 'boltcard', nome: 'Boltcard', sigla: 'BT', cor: 'bg-blue-400', categoria: 'Voucher' },
  { id: 'cabal', nome: 'Cabal', sigla: 'CB', cor: 'bg-yellow-400', categoria: 'Voucher' },
  { id: 'verocard', nome: 'Verocard', sigla: 'VC', cor: 'bg-purple-400', categoria: 'Voucher' },
  { id: 'facecard', nome: 'Facecard', sigla: 'FC', cor: 'bg-orange-400', categoria: 'Voucher' },
  { id: 'valecard', nome: 'Valecard', sigla: 'VL', cor: 'bg-sky-400', categoria: 'Voucher' },
  { id: 'naip', nome: 'Naip', sigla: 'NP', cor: 'bg-yellow-300', categoria: 'Voucher' }
]
</script>