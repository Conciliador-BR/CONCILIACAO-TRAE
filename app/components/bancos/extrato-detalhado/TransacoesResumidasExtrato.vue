<template>
  <div class="flex-1 flex flex-col bg-white">
    <!-- Resumo por Adquirente -->
    <ResumoAdquirentes :transacoes="props.transacoes" />
    
    <!-- Lista de Adquirentes -->
    <div class="flex-1 overflow-auto p-6 bg-white">
      <div class="space-y-6">
        <div 
          v-for="(dados, adquirente) in transacoesPorAdquirente" 
          :key="adquirente"
          class="border border-gray-200 rounded-lg overflow-hidden"
        >
          <!-- Header do Adquirente -->
          <div 
            class="px-6 py-4 cursor-pointer"
            :style="{ backgroundColor: obterCorAdquirente(adquirente) }"
            @click="toggleAdquirente(adquirente)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <h4 class="text-lg font-medium text-white">{{ adquirente }}</h4>
                <span class="bg-white bg-opacity-20 text-white px-2 py-1 rounded-full text-sm">
                  {{ dados.transacoes.length }} transações
                </span>
              </div>
              <div class="flex items-center space-x-4">
                <span class="text-white font-bold text-lg">
                  {{ formatarMoeda(dados.total) }}
                </span>
                <svg 
                  class="w-5 h-5 text-white transform transition-transform"
                  :class="{ 'rotate-180': adquirentesExpandidos[adquirente] }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Tabela de Transações do Adquirente -->
          <div v-if="adquirentesExpandidos[adquirente]" class="bg-white">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(transacao, index) in dados.transacoes" :key="index" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ transacao.data_formatada || formatarData(transacao.data) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ transacao.banco?.replace('_', ' ') || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ transacao.descricao || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium"
                      :class="transacao.valor >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatarMoeda(transacao.valor) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ResumoAdquirentes from './ResumoAdquirentes.vue'

// Props
const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

// Estados
const adquirentesExpandidos = ref({})

// Lista de adquirentes separados por categoria
const adquirentesCartoes = [
  'TRIPAG', 'UNICA', 'CIELO', 'CIEL', 'SIPAG', 'SICREDI', 
  'REDE', 'STONE', 'STON', 'AZULZINHA'
]

const adquirentesVouchers = [
  'ALELO', 'TICKET', 'VR BEN', 'SODEXO', 'PLUXE', 'COMPROCARD',
  'LECARD', 'LE CARD', 'UP BRASIL', 'ECX CARD', 'FN CARD',
  'BEN VISA', 'CREDSHOP', 'RC CARD', 'GOOD CARD', 'BIG CARD',
  'BK CARD', 'GREEN CARD', 'BRASILCARD', 'BOLTCARD', 'CABAL',
  'VEROCARD', 'FACECARD', 'VALECARD', 'NAIP'
]

// Cores para cartões (tons de azul/verde)
const coresCartoes = {
  'TRIPAG': '#1E40AF', 'UNICA': '#7C3AED', 'CIELO': '#0EA5E9',
  'CIEL': '#0EA5E9', 'SIPAG': '#059669', 'SICREDI': '#DC2626',
  'REDE': '#EA580C', 'STONE': '#374151', 'STON': '#374151',
  'AZULZINHA': '#3B82F6'
}

// Cores para vouchers (tons de laranja/amarelo/rosa)
const coresVouchers = {
  'ALELO': '#F59E0B', 'TICKET': '#EF4444', 'VR BEN': '#10B981',
  'SODEXO': '#8B5CF6', 'PLUXE': '#06B6D4', 'COMPROCARD': '#F97316',
  'LECARD': '#84CC16', 'LE CARD': '#84CC16', 'UP BRASIL': '#22C55E',
  'ECX CARD': '#A855F7', 'FN CARD': '#EC4899', 'BEN VISA': '#14B8A6',
  'CREDSHOP': '#F472B6', 'RC CARD': '#FB7185', 'GOOD CARD': '#34D399',
  'BIG CARD': '#FBBF24', 'BK CARD': '#A78BFA', 'GREEN CARD': '#4ADE80',
  'BRASILCARD': '#F87171', 'BOLTCARD': '#60A5FA', 'CABAL': '#FACC15',
  'VEROCARD': '#C084FC', 'FACECARD': '#FB923C', 'VALECARD': '#38BDF8',
  'NAIP': '#FDE047'
}

// Lista de adquirentes com cores combinada
const adquirentesConfig = { 
  ...coresCartoes, 
  ...coresVouchers
}

// Computed para agrupar transações por adquirente
const transacoesPorAdquirente = computed(() => {
  const grupos = {}
  
  props.transacoes.forEach(transacao => {
    let adquirente = null
    
    // Identificar adquirente pela descrição
    if (transacao.descricao) {
      const descricaoUpper = transacao.descricao.toUpperCase()
      
      // Primeiro verifica cartões
      for (const nome of adquirentesCartoes) {
        if (descricaoUpper.includes(nome)) {
          adquirente = `${nome} (Cartão)`
          break
        }
      }
      
      // Se não encontrou cartão, verifica vouchers
      if (!adquirente) {
        for (const nome of adquirentesVouchers) {
          if (descricaoUpper.includes(nome)) {
            adquirente = `${nome} (Voucher)`
            break
          }
        }
      }
    }
    
    // Só adiciona se encontrou um adquirente conhecido (não OUTROS)
    if (adquirente) {
      if (!grupos[adquirente]) {
        grupos[adquirente] = {
          transacoes: [],
          total: 0
        }
      }
      
      grupos[adquirente].transacoes.push(transacao)
      grupos[adquirente].total += transacao.valor || 0
    }
  })
  
  // Ordenar por total (maior primeiro)
  const gruposOrdenados = {}
  Object.keys(grupos)
    .sort((a, b) => grupos[b].total - grupos[a].total)
    .forEach(key => {
      gruposOrdenados[key] = grupos[key]
    })
  
  return gruposOrdenados
})

// Computed para total geral
const totalGeral = computed(() => {
  return props.transacoes.reduce((sum, t) => sum + (t.valor || 0), 0)
})

// Função para obter cor do adquirente
const obterCorAdquirente = (adquirente) => {
  // Retorna sempre azul para todos os adquirentes (teste)
  return '#3B82F6'
}

// Função para expandir/recolher adquirente
const toggleAdquirente = (adquirente) => {
  adquirentesExpandidos.value[adquirente] = !adquirentesExpandidos.value[adquirente]
}

// Função para formatar moeda
const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return 'R$ 0,00'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Math.abs(valor))
}

// Função para formatar data
const formatarData = (data) => {
  if (!data) return 'N/A'
  
  try {
    if (typeof data === 'string' && data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return data
    }
    
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [ano, mes, dia] = data.split('-')
      return `${dia}/${mes}/${ano}`
    }
    
    const dateObj = new Date(data)
    if (!isNaN(dateObj.getTime())) {
      const dia = String(dateObj.getDate()).padStart(2, '0')
      const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
      const ano = dateObj.getFullYear()
      return `${dia}/${mes}/${ano}`
    }
    
    return 'N/A'
  } catch (error) {
    return 'N/A'
  }
}
</script>