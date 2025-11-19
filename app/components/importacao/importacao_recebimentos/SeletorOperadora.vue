<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">2. Selecione a Operadora</h2>
          <p class="text-sm text-gray-600 mt-1">Escolha a operadora para importação dos dados</p>
        </div>
        <!-- badge moderno à direita -->
        <div 
          v-if="tituloDireita"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 font-bold text-base sm:text-lg tracking-wide shadow-sm ring-1 ring-blue-200/50 hover:shadow-md transition"
        >
          {{ tituloDireita }}
        </div>
      </div>
      <div v-if="disabled" class="text-yellow-600 text-sm mt-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
        ⚠️ Selecione uma empresa primeiro
      </div>
    </div>
    <div class="p-8">
      <div class="mb-8">
        <h3 class="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          Cartões ({{ operadorasCartoes.length }})
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
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

      <div>
        <h3 class="text-lg font-medium text-gray-800 mb-3 flex items-center">
          <span class="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
          Vouchers ({{ operadorasVouchers.length }})
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
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
  },
  tituloDireita: {
    type: String,
    default: ''
  }
})

defineEmits(['operadora-selecionada'])

const operadorasCartoes = computed(() => operadoras.filter(op => op.categoria === 'Cartão'))
const operadorasVouchers = computed(() => operadoras.filter(op => op.categoria === 'Voucher'))

const operadoras = [
  { id: 'tripag', nome: 'Tripag', sigla: 'TP', cor: 'bg-blue-800', categoria: 'Cartão' },
  { id: 'unica', nome: 'Única', sigla: 'UN', cor: 'bg-purple-600', categoria: 'Cartão' },
  { id: 'cielo', nome: 'Cielo', sigla: 'CI', cor: 'bg-blue-500', categoria: 'Cartão' },
  { id: 'sipag', nome: 'Sipag', sigla: 'SP', cor: 'bg-green-600', categoria: 'Cartão' },
  { id: 'sicredi', nome: 'Sicredi', sigla: 'SI', cor: 'bg-red-600', categoria: 'Cartão' },
  { id: 'rede', nome: 'Rede', sigla: 'RD', cor: 'bg-orange-600', categoria: 'Cartão' },
  { id: 'stone', nome: 'Stone', sigla: 'ST', cor: 'bg-gray-700', categoria: 'Cartão' },
  { id: 'safra', nome: 'Safra', sigla: 'SF', cor: 'bg-indigo-600', categoria: 'Cartão' },
  { id: 'azulzinha', nome: 'Azulzinha', sigla: 'AZ', cor: 'bg-blue-400', categoria: 'Cartão' },
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