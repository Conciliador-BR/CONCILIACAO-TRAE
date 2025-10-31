<template>
  <div v-if="adquirentesComTransacoes.length > 0" class="mb-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Resumo por Adquirente</h3>
    
    <!-- Grid responsivo para os cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 bg-white p-6 rounded-lg">
      <div 
        v-for="(adquirente, index) in adquirentesComTransacoes" 
        :key="adquirente.nome"
        class="bg-gradient-to-r text-white p-4 rounded-xl shadow-lg"
        :style="{ 
          background: `linear-gradient(135deg, ${adquirente.cor}, ${adquirente.corSecundaria})` 
        }"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-white/90 text-sm font-medium mb-1">{{ adquirente.nome }}</p>
            <p class="text-2xl font-bold">{{ formatCurrency(adquirente.valorTotal) }}</p>
            <div class="flex items-center mt-2">
              <span class="text-white/80 text-sm">
                {{ adquirente.quantidadeTransacoes }} transações
              </span>
            </div>
            <div class="flex items-center mt-1">
              <span class="text-white/70 text-xs">
                Média: {{ formatCurrency(adquirente.valorMedio) }}
              </span>
            </div>
          </div>
          <div class="ml-3">
            <!-- Ícone baseado na categoria -->
            <div v-if="adquirente.categoria === 'Cartão'" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
            </div>
            <div v-else class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumo Geral -->
    <div class="mt-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-md p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-sm text-gray-600">Total de Adquirentes</p>
          <p class="text-2xl font-bold text-gray-800">{{ adquirentesComTransacoes.length }}</p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600">Total de Transações</p>
          <p class="text-2xl font-bold text-blue-600">{{ totalTransacoes }}</p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600">Valor Total</p>
          <p class="text-2xl font-bold" :class="[
            valorTotalGeral >= 0 ? 'text-green-600' : 'text-red-600'
          ]">
            {{ formatCurrency(valorTotalGeral) }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600">Valor Médio</p>
          <p class="text-2xl font-bold text-purple-600">{{ formatCurrency(valorMedioGeral) }}</p>
        </div>
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

// Cores para cartões (tons de azul/verde/roxo)
const coresCartoes = {
  'TRIPAG': { cor: '#1E40AF', corSecundaria: '#3B82F6' },
  'UNICA': { cor: '#7C3AED', corSecundaria: '#A855F7' },
  'CIELO': { cor: '#0EA5E9', corSecundaria: '#38BDF8' },
  'CIEL': { cor: '#0EA5E9', corSecundaria: '#38BDF8' },
  'SIPAG': { cor: '#059669', corSecundaria: '#10B981' },
  'SICREDI': { cor: '#DC2626', corSecundaria: '#EF4444' },
  'REDE': { cor: '#EA580C', corSecundaria: '#F97316' },
  'STONE': { cor: '#374151', corSecundaria: '#6B7280' },
  'STON': { cor: '#374151', corSecundaria: '#6B7280' },
  'AZULZINHA': { cor: '#3B82F6', corSecundaria: '#60A5FA' }
}

// Cores para vouchers (tons de laranja/amarelo/rosa)
const coresVouchers = {
  'ALELO': { cor: '#F59E0B', corSecundaria: '#FBBF24' },
  'TICKET': { cor: '#EF4444', corSecundaria: '#F87171' },
  'VR BEN': { cor: '#10B981', corSecundaria: '#34D399' },
  'SODEXO': { cor: '#8B5CF6', corSecundaria: '#A78BFA' },
  'PLUXE': { cor: '#06B6D4', corSecundaria: '#22D3EE' },
  'COMPROCARD': { cor: '#F97316', corSecundaria: '#FB923C' },
  'LECARD': { cor: '#84CC16', corSecundaria: '#A3E635' },
  'LE CARD': { cor: '#84CC16', corSecundaria: '#A3E635' },
  'UP BRASIL': { cor: '#22C55E', corSecundaria: '#4ADE80' },
  'ECX CARD': { cor: '#A855F7', corSecundaria: '#C084FC' },
  'FN CARD': { cor: '#EC4899', corSecundaria: '#F472B6' },
  'BEN VISA': { cor: '#14B8A6', corSecundaria: '#2DD4BF' },
  'CREDSHOP': { cor: '#F472B6', corSecundaria: '#FB7185' },
  'RC CARD': { cor: '#FB7185', corSecundaria: '#FDA4AF' },
  'GOOD CARD': { cor: '#34D399', corSecundaria: '#6EE7B7' },
  'BIG CARD': { cor: '#FBBF24', corSecundaria: '#FCD34D' },
  'BK CARD': { cor: '#A78BFA', corSecundaria: '#C4B5FD' },
  'GREEN CARD': { cor: '#4ADE80', corSecundaria: '#86EFAC' },
  'BRASILCARD': { cor: '#F87171', corSecundaria: '#FCA5A5' },
  'BOLTCARD': { cor: '#60A5FA', corSecundaria: '#93C5FD' },
  'CABAL': { cor: '#FACC15', corSecundaria: '#FDE047' },
  'VEROCARD': { cor: '#C084FC', corSecundaria: '#DDD6FE' },
  'FACECARD': { cor: '#FB923C', corSecundaria: '#FDBA74' },
  'VALECARD': { cor: '#38BDF8', corSecundaria: '#7DD3FC' },
  'NAIP': { cor: '#FDE047', corSecundaria: '#FEF08A' }
}

// Cores combinadas
const coresAdquirentes = { ...coresCartoes, ...coresVouchers }

// Função para identificar adquirente
const identificarAdquirente = (descricao) => {
  if (!descricao) return null
  
  const descricaoUpper = descricao.toUpperCase()
  
  // Primeiro verifica cartões
  for (const adquirente of adquirentesCartoes) {
    if (descricaoUpper.includes(adquirente)) {
      return {
        nome: `${adquirente} (Cartão)`,
        nomeBase: adquirente,
        categoria: 'Cartão'
      }
    }
  }
  
  // Depois verifica vouchers
  for (const adquirente of adquirentesVouchers) {
    if (descricaoUpper.includes(adquirente)) {
      return {
        nome: `${adquirente} (Voucher)`,
        nomeBase: adquirente,
        categoria: 'Voucher'
      }
    }
  }
  
  return null
}

// Computed para agrupar transações por adquirente
const adquirentesComTransacoes = computed(() => {
  const grupos = {}
  
  props.transacoes.forEach(transacao => {
    const adquirenteInfo = identificarAdquirente(transacao.descricao)
    
    if (adquirenteInfo) {
      const nomeAdquirente = adquirenteInfo.nome
      
      if (!grupos[nomeAdquirente]) {
        const cores = coresAdquirentes[adquirenteInfo.nomeBase] || { cor: '#6B7280', corSecundaria: '#9CA3AF' }
        
        grupos[nomeAdquirente] = {
          nome: nomeAdquirente,
          nomeBase: adquirenteInfo.nomeBase,
          categoria: adquirenteInfo.categoria,
          cor: cores.cor,
          corSecundaria: cores.corSecundaria,
          transacoes: [],
          valorTotal: 0,
          quantidadeTransacoes: 0
        }
      }
      
      grupos[nomeAdquirente].transacoes.push(transacao)
      // Usar valorNumerico se disponível, senão usar valor
      const valorTransacao = transacao.valorNumerico !== undefined ? transacao.valorNumerico : (transacao.valor || 0)
      grupos[nomeAdquirente].valorTotal += valorTransacao
      grupos[nomeAdquirente].quantidadeTransacoes++
    }
  })
  
  // Converter para array e calcular valores médios
  return Object.values(grupos).map(adquirente => ({
    ...adquirente,
    valorMedio: adquirente.quantidadeTransacoes > 0 
      ? adquirente.valorTotal / adquirente.quantidadeTransacoes 
      : 0
  })).sort((a, b) => Math.abs(b.valorTotal) - Math.abs(a.valorTotal)) // Ordenar por valor absoluto
})

// Computed para totais gerais
const totalTransacoes = computed(() => {
  return adquirentesComTransacoes.value.reduce((total, adquirente) => 
    total + adquirente.quantidadeTransacoes, 0)
})

const valorTotalGeral = computed(() => {
  return adquirentesComTransacoes.value.reduce((total, adquirente) => 
    total + adquirente.valorTotal, 0)
})

const valorMedioGeral = computed(() => {
  return totalTransacoes.value > 0 ? valorTotalGeral.value / totalTransacoes.value : 0
})

// Função para formatar valores monetários
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>