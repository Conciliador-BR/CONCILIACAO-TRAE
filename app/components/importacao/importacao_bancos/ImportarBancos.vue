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

    <!-- Tabela de Transações -->
    <TabelaTransacoesBanco :transacoes="transacoesProcessadas" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'

// Importar processadores de bancos
import { useItau } from '~/composables/importacao/importacao_bancos/useItau'
import { useBradesco } from '~/composables/importacao/importacao_bancos/useBradesco'
import { useSicoob } from '~/composables/importacao/importacao_bancos/useSicoob'
import { useTribanco } from '~/composables/importacao/importacao_bancos/useTribanco'
import { useSicredi } from '~/composables/importacao/importacao_bancos/useSicredi'
import { useCaixa } from '~/composables/importacao/importacao_bancos/useCaixa'

// Importar componentes
import AlertaEmpresa from './AlertaEmpresa.vue'
import SeletorBanco from './SeletorBanco.vue'
import SeletorFormato from './SeletorFormato.vue'
import UploadArquivoBanco from './UploadArquivoBanco.vue'
import StatusProcessamentoBanco from './StatusProcessamentoBanco.vue'
import TabelaTransacoesBanco from './TabelaTransacoesBanco.vue'

// Composables
const { filtrosGlobais } = useGlobalFilters()
const { empresas } = useEmpresas()

// Estados reativos
const bancoSelecionado = ref(null)
const formatoSelecionado = ref(null)
const arquivoSelecionado = ref(null)
const processando = ref(false)
const statusProcessamento = ref(null)
const transacoesProcessadas = ref([])

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
  transacoesProcessadas.value = []
}

const handleBancoSelecionado = (banco) => {
  bancoSelecionado.value = banco
  // Reset das seleções subsequentes
  formatoSelecionado.value = null
  arquivoSelecionado.value = null
  statusProcessamento.value = null
  transacoesProcessadas.value = []
}

const handleFormatoSelecionado = (formato) => {
  formatoSelecionado.value = formato
  // Reset do arquivo
  arquivoSelecionado.value = null
  statusProcessamento.value = null
  transacoesProcessadas.value = []
}

const handleArquivoSelecionado = (arquivo) => {
  arquivoSelecionado.value = arquivo
  statusProcessamento.value = null
  transacoesProcessadas.value = []
}

const handleArquivoRemovido = () => {
  arquivoSelecionado.value = null
  statusProcessamento.value = null
  transacoesProcessadas.value = []
}

const obterProcessadorBanco = (codigoBanco) => {
  const processadores = {
    'ITAU': useItau(),
    'BRADESCO': useBradesco(),
    'SICOOB': useSicoob(),
    'TRIBANCO': useTribanco(),
    'SICREDI': useSicredi(),
    'CAIXA': useCaixa()
  }
  
  return processadores[codigoBanco] || null
}

const processarArquivo = async () => {
  if (!arquivoSelecionado.value || !bancoSelecionado.value || !formatoSelecionado.value) return
  
  processando.value = true
  statusProcessamento.value = {
    tipo: 'processando',
    mensagem: 'Processando arquivo...',
    detalhes: `Empresa: ${nomeEmpresaGlobal.value} | Banco: ${bancoSelecionado.value.nome} | Formato: ${formatoSelecionado.value.tipo}`
  }

  try {
    const processador = obterProcessadorBanco(bancoSelecionado.value.codigo)
    
    if (!processador) {
      throw new Error(`Processador para ${bancoSelecionado.value.nome} ainda não implementado`)
    }

    let resultado = null

    // Processar baseado no formato
    if (formatoSelecionado.value.tipo === 'OFX') {
      resultado = await processador.processarOFX(arquivoSelecionado.value)
    } else if (formatoSelecionado.value.tipo === 'XLSX') {
      // Verificar se o processador suporta XLSX
      if (processador.processarXLSX) {
        resultado = await processador.processarXLSX(arquivoSelecionado.value)
      } else {
        throw new Error(`Formato XLSX ainda não implementado para ${bancoSelecionado.value.nome}`)
      }
    } else if (formatoSelecionado.value.tipo === 'CSV') {
      // Verificar se o processador suporta CSV
      if (processador.processarCSV) {
        resultado = await processador.processarCSV(arquivoSelecionado.value)
      } else {
        throw new Error(`Formato CSV ainda não implementado para ${bancoSelecionado.value.nome}`)
      }
    } else if (formatoSelecionado.value.tipo === 'PDF') {
      // Verificar se o processador suporta PDF
      if (processador.processarPDF) {
        resultado = await processador.processarPDF(arquivoSelecionado.value)
      } else {
        throw new Error(`Formato PDF ainda não implementado para ${bancoSelecionado.value.nome}`)
      }
    } else {
      throw new Error(`Formato ${formatoSelecionado.value.tipo} não reconhecido`)
    }

    if (resultado.sucesso) {
      transacoesProcessadas.value = resultado.transacoes
      statusProcessamento.value = {
        tipo: 'sucesso',
        mensagem: 'Arquivo processado com sucesso!',
        detalhes: `${resultado.total} transações importadas para ${nomeEmpresaGlobal.value}`
      }

      // Emitir evento para componente pai
      emit('arquivo-processado', {
        empresa: nomeEmpresaGlobal.value,
        banco: bancoSelecionado.value,
        formato: formatoSelecionado.value,
        arquivo: arquivoSelecionado.value,
        transacoes: resultado.transacoes
      })
    } else {
      throw new Error(resultado.erro)
    }
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