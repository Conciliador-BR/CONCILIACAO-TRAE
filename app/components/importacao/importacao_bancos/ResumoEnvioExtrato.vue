<template>
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-4">
      4. Enviar Extrato
    </label>
    
    <div class="bg-gray-50 rounded-lg p-6 space-y-4">
      <!-- Informações da Empresa -->
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="flex items-center mb-2">
          <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M9 7h6m-6 4h6m-2 4h2M9 15h4"></path>
          </svg>
          <span class="font-medium text-gray-900">Empresa:</span>
        </div>
        <p class="text-gray-700 ml-7 text-lg">{{ nomeEmpresa }}</p>
      </div>

      <!-- Informações do Banco -->
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="flex items-center mb-2">
          <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
          <span class="font-medium text-gray-900">Banco:</span>
        </div>
        <div class="ml-7 flex items-center">
          <div :class="['w-8 h-8 rounded-full flex items-center justify-center mr-3', bancoSelecionado.cor]">
            <span class="text-white font-bold text-sm">{{ bancoSelecionado.sigla }}</span>
          </div>
          <span class="text-gray-700 text-lg">{{ bancoSelecionado.nome }}</span>
        </div>
      </div>

      <!-- Resumo das Transações -->
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="flex items-center mb-2">
          <svg class="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span class="font-medium text-gray-900">Resumo:</span>
        </div>
        <div class="ml-7 space-y-1">
          <p class="text-gray-700">{{ totalTransacoes }} transação(ões) processada(s)</p>
          <p class="text-gray-700">Formato: {{ formatoSelecionado.descricao }}</p>
          <p class="text-gray-700">Arquivo: {{ nomeArquivo }}</p>
        </div>
      </div>

      <!-- Botão de Enviar -->
      <div class="flex justify-center pt-4">
        <button 
          @click="enviarExtrato"
          :disabled="enviando"
          :class="[
            'px-8 py-3 rounded-lg font-medium text-lg transition-all duration-200 flex items-center space-x-2',
            enviando 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
          ]"
        >
          <svg v-if="enviando" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
          <span>{{ enviando ? 'Enviando...' : 'Enviar Extrato' }}</span>
        </button>
      </div>

      <!-- Mensagem de Status -->
      <div v-if="mensagemStatus" class="mt-4">
        <div :class="[
          'p-4 rounded-lg border',
          tipoStatus === 'sucesso' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        ]">
          <div class="flex items-center">
            <svg v-if="tipoStatus === 'sucesso'" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-medium">{{ mensagemStatus }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  nomeEmpresa: {
    type: String,
    required: true
  },
  bancoSelecionado: {
    type: Object,
    required: true
  },
  formatoSelecionado: {
    type: Object,
    required: true
  },
  nomeArquivo: {
    type: String,
    required: true
  },
  totalTransacoes: {
    type: Number,
    required: true
  },
  transacoes: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['extrato-enviado', 'erro-envio'])

// Estados locais
const enviando = ref(false)
const mensagemStatus = ref('')
const tipoStatus = ref('')

// Métodos
const enviarExtrato = async () => {
  enviando.value = true
  mensagemStatus.value = ''
  tipoStatus.value = ''

  try {
    // Simular envio do extrato
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Aqui você implementaria a lógica real de envio
    // Por exemplo, salvar no Supabase, enviar por email, etc.
    
    mensagemStatus.value = 'Extrato enviado com sucesso!'
    tipoStatus.value = 'sucesso'
    
    // Emitir evento de sucesso
    emit('extrato-enviado', {
      empresa: props.nomeEmpresa,
      banco: props.bancoSelecionado,
      formato: props.formatoSelecionado,
      arquivo: props.nomeArquivo,
      transacoes: props.transacoes,
      total: props.totalTransacoes
    })
    
  } catch (error) {
    mensagemStatus.value = 'Erro ao enviar extrato: ' + error.message
    tipoStatus.value = 'erro'
    
    // Emitir evento de erro
    emit('erro-envio', error)
  } finally {
    enviando.value = false
  }
}
</script>