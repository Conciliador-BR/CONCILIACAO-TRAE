<!--
  Componente de Importação de Extratos Bancários
  
  Este componente permite importar extratos de TODOS os bancos disponíveis:
  - Itaú
  - Bradesco  
  - Sicoob
  - Tribanco
  - Sicredi
  - Caixa
  
  Funcionamento:
  1. Selecione uma empresa específica (obrigatório)
  2. Escolha o banco desejado
  3. Selecione o formato do arquivo (OFX, PDF, XLSX, CSV)
  4. Faça upload do arquivo
  5. Clique em "Enviar Extrato" para enviar para o Supabase
  
  O sistema criará automaticamente uma tabela com o padrão:
  banco_[codigo_banco]_[nome_empresa]
  
  Exemplo: banco_itau_kmc, banco_bradesco_norte_atacado, etc.
-->
<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Importação de Extratos Bancários</h2>
    <p class="text-gray-600 mb-6">Importe extratos de todos os bancos disponíveis: Itaú, Bradesco, Sicoob, Tribanco, Sicredi e Caixa</p>
    
    <!-- Alerta se 'Todas as Empresas' estiver selecionado -->
    <div v-if="isTodasEmpresasSelected" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
      <p class="font-medium">⚠️ Por favor, selecione uma empresa específica para fazer a importação.</p>
    </div>

    <!-- Alerta se nenhuma empresa estiver selecionada -->
    <AlertaEmpresa v-if="!empresaSelecionadaGlobal && !isTodasEmpresasSelected" />

    <!-- Etapas de Importação -->
    <EtapasImportacaoBanco 
      v-if="empresaSelecionadaGlobal && !isTodasEmpresasSelected"
      ref="etapasRef"
      @arquivo-processado="handleArquivoProcessado"
      @erro-processamento="handleErroProcessamento"
      @extrato-enviado="handleExtratoEnviado"
      @erro-envio="handleErroEnvio"
      @arquivo-removido="handleArquivoRemovidoPai"
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

const isTodasEmpresasSelected = computed(() => {
  return filtrosGlobais.empresaSelecionada === ''
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
  console.log('✅ Extrato enviado com sucesso:', dados)
  
  // Mostrar notificação de sucesso
  if (dados.banco && dados.empresa) {
    console.log(`🎉 Extrato do ${dados.banco.nome || dados.banco} enviado com sucesso para a empresa ${dados.empresa}!`)
    console.log(`📋 Tabela: ${dados.tabela}`)
    console.log(`📊 Registros inseridos: ${dados.registrosInseridos || dados.total}`)
  }
  
  // Emitir evento para componente pai
  emit('extrato-enviado', dados)
}

const handleErroEnvio = (erro) => {
  console.error('❌ Erro ao enviar extrato:', erro)
  
  // Emitir evento de erro
  emit('erro-envio', erro)
}

const handleArquivoRemovidoPai = () => {
  transacoesProcessadas.value = []
}

// Emits para comunicação com componente pai
const emit = defineEmits(['arquivo-processado', 'erro-processamento', 'extrato-enviado', 'erro-envio'])
</script>
