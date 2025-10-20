<template>
  <div v-if="transacoesResumidasPorAdquirente && Object.keys(transacoesResumidasPorAdquirente).length > 0" 
       class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800">
        Transações Resumidas por Adquirente
      </h3>
      <div class="text-sm text-gray-600">
        {{ Object.keys(transacoesResumidasPorAdquirente).length }} adquirente(s) encontrado(s)
      </div>
    </div>

    <div class="space-y-6">
      <div v-for="(dadosAdquirente, adquirente) in transacoesResumidasPorAdquirente" 
           :key="adquirente" 
           class="border border-gray-200 rounded-lg p-4">
        
        <!-- Cabeçalho do Adquirente -->
        <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
          <h4 class="text-md font-semibold text-gray-700 flex items-center">
            <span class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: getCorAdquirente(adquirente) }"></span>
            {{ adquirente }}
          </h4>
          <div class="text-right">
            <div class="text-sm text-gray-500">{{ dadosAdquirente.transacoes.length }} transação(ões)</div>
            <div class="text-lg font-bold" :class="[
              dadosAdquirente.valorTotal >= 0 ? 'text-green-600' : 'text-red-600'
            ]">
              {{ formatarValor(dadosAdquirente.valorTotal) }}
            </div>
          </div>
        </div>

        <!-- Tabela de Transações do Adquirente -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="transacao in dadosAdquirente.transacoes" 
                  :key="transacao.id" 
                  class="hover:bg-gray-50">
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {{ transacao.data }}
                </td>
                <td class="px-4 py-2 text-sm text-gray-900">
                  <div class="max-w-xs truncate" :title="transacao.descricao">
                    {{ transacao.descricao }}
                  </div>
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                  <span :class="[
                    transacao.valorNumerico >= 0 ? 'text-green-600' : 'text-red-600'
                  ]">
                    {{ transacao.valor }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Resumo Geral -->
    <div class="mt-6 pt-4 border-t border-gray-200">
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-700">Total Geral:</span>
        <span class="text-lg font-bold" :class="[
          calcularTotalGeral() >= 0 ? 'text-green-600' : 'text-red-600'
        ]">
          {{ formatarValor(calcularTotalGeral()) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

// Lista de adquirentes separados por categoria
const adquirentesCartoes = [
  'TRIPAG',
  'UNICA', 
  'CIELO',
  'CIEL',
  'SIPAG',
  'SICREDI',
  'REDE',
  'STONE',
  'STON',
  'AZULZINHA'
]

const adquirentesVouchers = [
  'ALELO',
  'TICKET',
  'VR',
  'SODEXO',
  'PLUXE',
  'COMPROCARD',
  'LECARD',
  'LE CARD',
  'UP BRASIL',
  'ECX CARD',
  'FN CARD',
  'BEN VISA',
  'CREDSHOP',
  'RC CARD',
  'GOOD CARD',
  'BIG CARD',
  'BK CARD',
  'GREEN CARD',
  'BRASILCARD',
  'BOLTCARD',
  'CABAL',
  'VEROCARD',
  'FACECARD',
  'VALECARD',
  'NAIP'
]

// Lista combinada para compatibilidade
const adquirentes = [...adquirentesCartoes, ...adquirentesVouchers]

// Cores para cada adquirente - Cartões (tons de azul/verde)
const coresCartoes = {
  'TRIPAG': '#1E40AF',
  'UNICA': '#7C3AED',
  'CIELO': '#0EA5E9',
  'CIEL': '#0EA5E9',
  'SIPAG': '#059669',
  'SICREDI': '#DC2626',
  'REDE': '#EA580C',
  'STONE': '#374151',
  'STON': '#374151',
  'AZULZINHA': '#3B82F6'
}

// Cores para vouchers (tons de laranja/amarelo/rosa)
const coresVouchers = {
  'ALELO': '#F59E0B',
  'TICKET': '#EF4444',
  'VR': '#10B981',
  'SODEXO': '#8B5CF6',
  'PLUXE': '#06B6D4',
  'COMPROCARD': '#F97316',
  'LECARD': '#84CC16',
  'LE CARD': '#84CC16',
  'UP BRASIL': '#22C55E',
  'ECX CARD': '#A855F7',
  'FN CARD': '#EC4899',
  'BEN VISA': '#14B8A6',
  'CREDSHOP': '#F472B6',
  'RC CARD': '#FB7185',
  'GOOD CARD': '#34D399',
  'BIG CARD': '#FBBF24',
  'BK CARD': '#A78BFA',
  'GREEN CARD': '#4ADE80',
  'BRASILCARD': '#F87171',
  'BOLTCARD': '#60A5FA',
  'CABAL': '#FACC15',
  'VEROCARD': '#C084FC',
  'FACECARD': '#FB923C',
  'VALECARD': '#38BDF8',
  'NAIP': '#FDE047'
}

// Cores combinadas
const coresAdquirentes = { ...coresCartoes, ...coresVouchers }

const transacoesResumidasPorAdquirente = computed(() => {
  const resumo = {}
  
  props.transacoes.forEach(transacao => {
    const adquirenteEncontrado = identificarAdquirente(transacao.descricao)
    
    if (adquirenteEncontrado) {
      if (!resumo[adquirenteEncontrado]) {
        resumo[adquirenteEncontrado] = {
          transacoes: [],
          valorTotal: 0
        }
      }
      
      resumo[adquirenteEncontrado].transacoes.push(transacao)
      resumo[adquirenteEncontrado].valorTotal += transacao.valorNumerico
    }
  })
  
  return resumo
})

const identificarAdquirente = (descricao) => {
  const descricaoUpper = descricao.toUpperCase()
  
  // Primeiro verifica cartões
  for (const adquirente of adquirentesCartoes) {
    if (descricaoUpper.includes(adquirente)) {
      return `${adquirente} (Cartão)`
    }
  }
  
  // Depois verifica vouchers
  for (const adquirente of adquirentesVouchers) {
    if (descricaoUpper.includes(adquirente)) {
      return `${adquirente} (Voucher)`
    }
  }
  
  return null
}

const getCorAdquirente = (adquirente) => {
  // Extrair o nome base removendo a categoria
  const nomeBase = adquirente.replace(/ \(Cartão\)| \(Voucher\)/, '')
  return coresAdquirentes[nomeBase] || '#6B7280'
}

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

const calcularTotalGeral = () => {
  return Object.values(transacoesResumidasPorAdquirente.value)
    .reduce((total, adquirente) => total + adquirente.valorTotal, 0)
}
</script>