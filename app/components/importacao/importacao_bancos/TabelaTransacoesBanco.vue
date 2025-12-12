<template>
  <div v-if="transacoes && transacoes.length > 0" class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800">
        Transações Processadas
      </h3>
      <div class="text-sm text-gray-600">
        Total: {{ calcularTotal() }}
      </div>
    </div>

    <!-- Abas -->
    <div class="border-b border-gray-200 mb-4">
      <nav class="-mb-px flex space-x-8">
        <button
          @click="abaAtiva = 'todas'"
          :class="[
            'py-2 px-1 border-b-2 font-medium text-sm',
            abaAtiva === 'todas'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          Todas as Transações ({{ transacoes.length }})
        </button>
        <button
          @click="abaAtiva = 'resumidas'"
          :class="[
            'py-2 px-1 border-b-2 font-medium text-sm',
            abaAtiva === 'resumidas'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          Transações Resumidas
        </button>
      </nav>
    </div>

    <!-- Conteúdo das Abas -->
    <div v-if="abaAtiva === 'todas'">
      <TransacoesTodasAjustavel :transacoes="transacoes" />
      
      <!-- Resumo Geral -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{{ transacoes.length }}</div>
          <div class="text-sm text-gray-500">Total de Transações</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ contarCreditos() }}</div>
          <div class="text-sm text-gray-500">Créditos</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ contarDebitos() }}</div>
          <div class="text-sm text-gray-500">Débitos</div>
        </div>
      </div>
    </div>

    <div v-if="abaAtiva === 'resumidas'">
      <!-- Container que delega para o detector apropriado -->
      <DetectadorAdquirentesSicoob v-if="bancoDetectado === 'sicoob'" :transacoes="transacoes" />
      <DetectadorAdquirentesBradesco v-else-if="bancoDetectado === 'bradesco'" :transacoes="transacoes" />
      <DetectadorAdquirentesTribanco v-else-if="bancoDetectado === 'tribanco'" :transacoes="transacoes" />
      <DetectadorAdquirentesBancoDoBrasil v-else-if="bancoDetectado === 'bb'" :transacoes="transacoes" />
      <DetectadorAdquirentesItau v-else-if="bancoDetectado === 'itau'" :transacoes="transacoes" />
      <DetectadorAdquirentesSafra v-else-if="bancoDetectado === 'safra'" :transacoes="transacoes" />
      
      <!-- Fallback ou mensagem caso não haja detector específico -->
      <div v-else class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <p class="text-lg font-medium">Visualização resumida não disponível para este banco.</p>
        <p class="text-sm mt-1">Banco detectado: {{ bancoOriginal || 'Desconhecido' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TransacoesTodasAjustavel from './TransacoesTodasAjustavel.vue'
import DetectadorAdquirentesSicoob from './Detectador_Adquirentes/DetectadorAdquirentesSicoob.vue'
import DetectadorAdquirentesBradesco from './Detectador_Adquirentes/DetectadorAdquirentesBradesco.vue'
import DetectadorAdquirentesTribanco from './Detectador_Adquirentes/DetectadorAdquirentesTribanco.vue'
import DetectadorAdquirentesBancoDoBrasil from './Detectador_Adquirentes/DetectadorAdquirentesBancoDoBrasil.vue'
import DetectadorAdquirentesItau from './Detectador_Adquirentes/DetectadorAdquirentesItau.vue'
import DetectadorAdquirentesSafra from './Detectador_Adquirentes/DetectadorAdquirentesSafra.vue'

const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const abaAtiva = ref('todas')

const bancoOriginal = computed(() => {
  if (!props.transacoes.length) return ''
  // Tenta pegar do primeiro item, assumindo homogeneidade
  return props.transacoes[0].banco || ''
})

const bancoDetectado = computed(() => {
  const banco = (bancoOriginal.value || '').toLowerCase()
  if (banco.includes('sicoob')) return 'sicoob'
  if (banco.includes('bradesco')) return 'bradesco'
  if (banco.includes('tribanco')) return 'tribanco'
  if (banco.includes('banco do brasil') || banco.includes('brasil')) return 'bb'
  if (banco.includes('itaú') || banco.includes('itau')) return 'itau'
  if (banco.includes('safra')) return 'safra'
  return null
})

const calcularTotal = () => {
  const total = props.transacoes.reduce((acc, transacao) => acc + transacao.valorNumerico, 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(total)
}

const contarCreditos = () => {
  return props.transacoes.filter(t => t.valorNumerico > 0).length
}

const contarDebitos = () => {
  return props.transacoes.filter(t => t.valorNumerico < 0).length
}
</script>
