<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Importação de Bancos</h2>
    
    <!-- Alerta se empresa não estiver selecionada -->
    <AlertaEmpresa v-if="!empresaSelecionadaGlobal" />

    <!-- Etapas de Importação -->
    <EtapasImportacaoBanco 
      v-if="empresaSelecionadaGlobal"
      ref="etapasRef"
      @arquivo-processado="handleArquivoProcessado"
      @erro-processamento="handleErroProcessamento"
      @extrato-enviado="handleExtratoEnviado"
      @erro-envio="handleErroEnvio"
    />

    <!-- Tabela de Transações -->
    <TabelaTransacoesBanco 
      v-if="transacoesProcessadas.length > 0"
      :transacoes="transacoesProcessadas" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

// Importar componentes
import AlertaEmpresa from './AlertaEmpresa.vue'
import EtapasImportacaoBanco from './EtapasImportacaoBanco.vue'
import TabelaTransacoesBanco from './TabelaTransacoesBanco.vue'

// Composables
const { filtrosGlobais } = useGlobalFilters()

// Referência para o componente de etapas
const etapasRef = ref(null)

// Estados reativos
const transacoesProcessadas = ref([])

// Computed para empresa selecionada globalmente
const empresaSelecionadaGlobal = computed(() => {
  return filtrosGlobais.empresaSelecionada
})

// Watch para resetar quando empresa global mudar
watch(empresaSelecionadaGlobal, (novaEmpresa) => {
  if (!novaEmpresa) {
    resetarTudo()
  }
})

// Métodos
const resetarTudo = () => {
  transacoesProcessadas.value = []
  // Resetar também as etapas
  if (etapasRef.value) {
    etapasRef.value.resetarTudo()
  }
}

const handleArquivoProcessado = (dados) => {
  console.log('Arquivo processado:', dados)
  transacoesProcessadas.value = dados.transacoes
  
  // Emitir evento para componente pai
  emit('arquivo-processado', dados)
}

const handleErroProcessamento = (erro) => {
  console.error('Erro no processamento:', erro)
  transacoesProcessadas.value = []
  
  // Emitir evento de erro
  emit('erro-processamento', erro)
}

const handleExtratoEnviado = (dados) => {
  console.log('Extrato enviado com sucesso:', dados)
  
  // Emitir evento para componente pai
  emit('extrato-enviado', dados)
}

const handleErroEnvio = (erro) => {
  console.error('Erro ao enviar extrato:', erro)
  
  // Emitir evento de erro
  emit('erro-envio', erro)
}

// Emits para comunicação com componente pai
const emit = defineEmits(['arquivo-processado', 'erro-processamento', 'extrato-enviado', 'erro-envio'])
</script>