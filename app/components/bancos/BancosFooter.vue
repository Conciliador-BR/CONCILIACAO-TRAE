<template>
  <div class="bg-gray-50 border-t border-gray-200 px-4 py-2">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
      <!-- Total de registros -->
      <div class="text-gray-600">
        <span class="font-medium">Total:</span>
        <span class="ml-1 font-bold text-gray-900">{{ totalMovimentacoes.toLocaleString('pt-BR') }}</span>
      </div>
      
      <!-- Total Créditos -->
      <div class="text-gray-600">
        <span class="font-medium">Créditos:</span>
        <span class="ml-1 font-bold text-green-600">{{ formatCurrency(totalCreditos) }}</span>
      </div>
      
      <!-- Total Débitos -->
      <div class="text-gray-600">
        <span class="font-medium">Débitos:</span>
        <span class="ml-1 font-bold text-red-600">{{ formatCurrency(totalDebitos) }}</span>
      </div>
      
      <!-- Saldo Total -->
      <div class="text-gray-600">
        <span class="font-medium">Saldo:</span>
        <span class="ml-1 font-bold" :class="saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ formatCurrency(saldoTotal) }}
        </span>
      </div>
      
      <!-- Média Créditos -->
      <div class="text-gray-600">
        <span class="font-medium">Média Créd.:</span>
        <span class="ml-1 font-bold text-blue-600">{{ formatCurrency(mediaCreditos) }}</span>
      </div>
      
      <!-- Previsto Total (nova seção) -->
      <div v-if="previstoTotal" class="text-gray-600">
        <span class="font-medium">Previsto:</span>
        <span class="ml-1 font-bold text-purple-600">{{ formatCurrency(previstoTotal) }}</span>
      </div>
      
      <!-- Dias com Previsão -->
      <div v-if="totalDiasComPrevisao" class="text-gray-600">
        <span class="font-medium">Dias Prev.:</span>
        <span class="ml-1 font-bold text-indigo-600">{{ totalDiasComPrevisao }}</span>
      </div>
      
      <!-- Vendas Previstas -->
      <div v-if="totalVendasPrevistas" class="text-gray-600">
        <span class="font-medium">Vendas Prev.:</span>
        <span class="ml-1 font-bold text-orange-600">{{ formatCurrency(totalVendasPrevistas) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalMovimentacoes: {
    type: Number,
    default: 0
  },
  totalCreditos: {
    type: Number,
    default: 0
  },
  totalDebitos: {
    type: Number,
    default: 0
  },
  saldoTotal: {
    type: Number,
    default: 0
  },
  mediaCreditos: {
    type: Number,
    default: 0
  },
  previstoTotal: {
    type: Number,
    default: 0
  },
  totalDiasComPrevisao: {
    type: Number,
    default: 0
  },
  totalVendasPrevistas: {
    type: Number,
    default: 0
  }
})

// Função para formatar valor monetário
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
</script>

<style scoped>
.bg-gray-50 {
  background-color: #f9fafb;
}

.border-t {
  border-top-width: 1px;
}

.border-gray-200 {
  border-color: #e5e7eb;
}

.grid {
  display: grid;
}

.gap-2 {
  gap: 0.5rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.font-medium {
  font-weight: 500;
}

.font-bold {
  font-weight: 700;
}

@media (min-width: 768px) {
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>