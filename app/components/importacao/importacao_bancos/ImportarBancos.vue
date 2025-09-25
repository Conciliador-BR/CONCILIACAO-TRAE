<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Importação de Bancos</h2>
    
    <!-- Alerta se empresa não estiver selecionada -->
    <AlertaEmpresa v-if="!empresaSelecionadaGlobal" />

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
      @processar-arquivo="processarArquivo"
    />

    <!-- Status do Processamento -->
    <StatusProcessamentoBanco :status="statusProcessamento" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'

// Importar componentes
import AlertaEmpresa from './AlertaEmpresa.vue'
import SeletorBanco from './SeletorBanco.vue'
import SeletorFormato from './SeletorFormato.vue'
import UploadArquivoBanco from './UploadArquivoBanco.vue'
import StatusProcessamentoBanco from './StatusProcessamentoBanco.vue'

// Composables
const { filtrosGlobais } = useGlobalFilters()
const { empresas } = useEmpresas()

// Estados reativos
const bancoSelecionado = ref(null)
const formatoSelecionado = ref(null)
const arquivoSelecionado = ref(null)
const processando = ref(false)
const statusProcessamento = ref(null)

// Computed para empresa selecionada globalmente
const empresaSelecionadaGlobal = computed(() => {
  return filtrosGlobais.empresaSelecionada
})

const nomeEmpresaGlobal = computed(() => {
  if (!filtrosGlobais.empresaSelecionada) return ''
  const empresa = empresas.value.find(e => e.id == filtrosGlobais.empresaSelecionada)
  return empresa ? empresa.nome : ''
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
  statusProcessamento.value = null
}

const handleBancoSelecionado = (banco) => {
  bancoSelecionado.value = banco
  // Reset das seleções subsequentes
  formatoSelecionado.value = null
  arquivoSelecionado.value = null
  statusProcessamento.value = null
}

const handleFormatoSelecionado = (formato) => {
  formatoSelecionado.value = formato
  // Reset do arquivo
  arquivoSelecionado.value = null
  statusProcessamento.value = null
}

const handleArquivoSelecionado = (arquivo) => {
  arquivoSelecionado.value = arquivo
  statusProcessamento.value = null
}

const handleArquivoRemovido = () => {
  arquivoSelecionado.value = null
  statusProcessamento.value = null
}

const processarArquivo = async () => {
  if (!arquivoSelecionado.value) return
  
  processando.value = true
  statusProcessamento.value = {
    tipo: 'processando',
    mensagem: 'Processando arquivo...',
    detalhes: `Empresa: ${nomeEmpresaGlobal.value} | Banco: ${bancoSelecionado.value.nome} | Formato: ${formatoSelecionado.value.tipo}`
  }

  try {
    // Simular processamento (aqui você implementaria a lógica real)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    statusProcessamento.value = {
      tipo: 'sucesso',
      mensagem: 'Arquivo processado com sucesso!',
      detalhes: `${Math.floor(Math.random() * 100) + 1} transações importadas para ${nomeEmpresaGlobal.value}`
    }

    // Emitir evento para componente pai
    emit('arquivo-processado', {
      empresa: nomeEmpresaGlobal.value,
      banco: bancoSelecionado.value,
      formato: formatoSelecionado.value,
      arquivo: arquivoSelecionado.value
    })
  } catch (error) {
    statusProcessamento.value = {
      tipo: 'erro',
      mensagem: 'Erro ao processar arquivo',
      detalhes: error.message
    }

    // Emitir evento de erro
    emit('erro-processamento', error)
  } finally {
    processando.value = false
  }
}

// Emits para comunicação com componente pai
const emit = defineEmits(['arquivo-processado', 'erro-processamento'])
</script>