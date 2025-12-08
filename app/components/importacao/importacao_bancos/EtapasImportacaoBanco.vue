<template>
  <div class="space-y-6">
    <!-- Etapa 1: Seleção de Banco -->
    <SeletorBanco 
      v-if="empresaSelecionadaGlobal"
      :banco-selecionado="bancoSelecionado"
      @banco-selecionado="handleBancoSelecionado"
    />

    <!-- Etapa 2: Seleção de Formato -->
    <SeletorFormato 
      v-if="bancoSelecionado && empresaSelecionadaGlobal"
      :formato-selecionado="formatoSelecionado"
      @formato-selecionado="handleFormatoSelecionado"
    />

    <!-- Etapa 3: Upload de Arquivo -->
    <UploadArquivoBanco 
      v-if="formatoSelecionado && empresaSelecionadaGlobal"
      :formato-selecionado="formatoSelecionado"
      :arquivo-selecionado="arquivoSelecionado"
      :processando="processando"
      @arquivo-selecionado="handleArquivoSelecionado"
      @arquivo-removido="handleArquivoRemovido"
      @processar-arquivo="handleProcessarArquivo"
    />

    <!-- Status do Processamento -->
    <StatusProcessamentoBanco :status="statusProcessamento" />

    <!-- Etapa 4: Resumo e Envio do Extrato -->
    <ResumoEnvioExtrato 
      v-if="transacoesProcessadas.length > 0 && statusProcessamento?.tipo === 'sucesso'"
      :nome-empresa="nomeEmpresaGlobal"
      :banco-selecionado="bancoSelecionado"
      :formato-selecionado="formatoSelecionado"
      :nome-arquivo="arquivoSelecionado?.name || ''"
      :total-transacoes="transacoesProcessadas.length"
      :transacoes="transacoesProcessadas"
      @extrato-enviado="handleExtratoEnviado"
      @erro-envio="handleErroEnvio"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'
import { useProcessamentoBancos } from '~/composables/importacao/importacao_bancos/useProcessamentoBancos'

// Importar componentes
import SeletorBanco from './SeletorBanco.vue'
import SeletorFormato from './SeletorFormato.vue'
import UploadArquivoBanco from './UploadArquivoBanco.vue'
import StatusProcessamentoBanco from './StatusProcessamentoBanco.vue'
import ResumoEnvioExtrato from './ResumoEnvioExtrato.vue'

// Composables
const { filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas } = useEmpresas()
const { processando, statusProcessamento, processarArquivo, resetarStatus } = useProcessamentoBancos()

// Estados reativos
const bancoSelecionado = ref(null)
const formatoSelecionado = ref(null)
const arquivoSelecionado = ref(null)
const transacoesProcessadas = ref([])

// Computed para empresa selecionada globalmente
const empresaSelecionadaGlobal = computed(() => {
  return filtrosGlobais.empresaSelecionada
})

const nomeEmpresaGlobal = computed(() => {
  if (!filtrosGlobais.empresaSelecionada) return ''
  const empresa = empresas.value.find(e => e.id == filtrosGlobais.empresaSelecionada)
  console.log('🏢 [DEBUG] Empresa encontrada:', empresa)
  console.log('🏢 [DEBUG] Nome da empresa:', empresa ? empresa.nome : 'Não encontrada')
  console.log('🏢 [DEBUG] ID da empresa selecionada:', filtrosGlobais.empresaSelecionada)
  console.log('🏢 [DEBUG] Todas as empresas disponíveis:', empresas.value.map(e => ({ id: e.id, nome: e.nome })))
  return empresa ? empresa.nome : ''
})

// Carregar empresas ao montar o componente
onMounted(async () => {
  console.log('Carregando empresas no EtapasImportacaoBanco...')
  await fetchEmpresas()
  console.log('Empresas carregadas:', empresas.value)
})

// Watch para resetar quando empresa global mudar
watch(empresaSelecionadaGlobal, (novaEmpresa) => {
  if (!novaEmpresa) {
    resetarTudo()
  }
})

// Métodos
const resetarTudo = () => {
  bancoSelecionado.value = null
  formatoSelecionado.value = null
  arquivoSelecionado.value = null
  transacoesProcessadas.value = []
  resetarStatus()
}

const handleBancoSelecionado = (banco) => {
  bancoSelecionado.value = banco
  // Reset das seleções subsequentes
  formatoSelecionado.value = null
  arquivoSelecionado.value = null
  transacoesProcessadas.value = []
  resetarStatus()
}

const handleFormatoSelecionado = (formato) => {
  formatoSelecionado.value = formato
  // Reset do arquivo
  arquivoSelecionado.value = null
  transacoesProcessadas.value = []
  resetarStatus()
}

const handleArquivoSelecionado = (arquivo) => {
  arquivoSelecionado.value = arquivo
  transacoesProcessadas.value = []
  resetarStatus()
}

const handleArquivoRemovido = () => {
  arquivoSelecionado.value = null
  transacoesProcessadas.value = []
  resetarStatus()
  emit('arquivo-removido')
}

const handleProcessarArquivo = async () => {
  try {
    const resultado = await processarArquivo(
      arquivoSelecionado.value,
      bancoSelecionado.value,
      formatoSelecionado.value,
      nomeEmpresaGlobal.value
    )

    if (resultado.sucesso) {
      transacoesProcessadas.value = resultado.transacoes

      // Emitir evento para componente pai
      emit('arquivo-processado', {
        empresa: nomeEmpresaGlobal.value,
        banco: bancoSelecionado.value,
        formato: formatoSelecionado.value,
        arquivo: arquivoSelecionado.value,
        transacoes: resultado.transacoes
      })
    }
  } catch (error) {
    // Emitir evento de erro
    emit('erro-processamento', error)
  }
}

const handleExtratoEnviado = (dados) => {
  console.log('Extrato enviado com sucesso:', dados)
  emit('extrato-enviado', dados)
}

const handleErroEnvio = (erro) => {
  console.error('Erro ao enviar extrato:', erro)
  emit('erro-envio', erro)
}

// Expor dados para o componente pai
defineExpose({
  transacoesProcessadas,
  resetarTudo
})

// Emits para comunicação com componente pai
const emit = defineEmits(['arquivo-processado', 'erro-processamento', 'extrato-enviado', 'erro-envio', 'arquivo-removido'])
</script>
