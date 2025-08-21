<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">Importação de Vendas</h1>
    
    <!-- Componente Seletor de Operadora -->
    <SeletorOperadora 
      :model-value="operadoraSelecionada"
      @operadora-selecionada="handleOperadoraSelect"
    />

    <!-- Componente Upload de Arquivo -->
    <UploadArquivo 
      :operadora-selecionada="operadoraSelecionada"
      :arquivo="arquivo"
      @arquivo-selecionado="handleArquivoSelecionado"
      @arquivo-removido="handleArquivoRemovido"
    />

    <!-- Componente Status do Processamento -->
    <StatusProcessamento 
      :arquivo="arquivo"
      :status="status"
      :total-vendas="vendasProcessadas.length"
      :mensagem-erro="mensagemErro"
    />

    <!-- Componente Tabela de Vendas -->
    <TabelaVendas :vendas="vendasProcessadas" />

    <!-- Componente Botão Enviar Supabase -->
    <BotaoEnviarSupabase 
      :vendas="vendasProcessadas"
      :enviando="enviando"
      @enviar-vendas="enviarParaSupabase"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVendasOperadoraUnica } from '~/composables/importacao/vendas_operadora_unica'
import { useImportacao } from '~/composables/importacao/useImportacao'

// Importar componentes
import SeletorOperadora from '~/components/importacao/SeletorOperadora.vue'
import UploadArquivo from '~/components/importacao/UploadArquivo.vue'
import StatusProcessamento from '~/components/importacao/StatusProcessamento.vue'
import TabelaVendas from '~/components/importacao/TabelaVendas.vue'
import BotaoEnviarSupabase from '~/components/importacao/BotaoEnviarSupabase.vue'

// Estados
const operadoraSelecionada = ref(null)
const arquivo = ref(null)
const vendasProcessadas = ref([])
const status = ref('idle')
const mensagemErro = ref('')
const enviando = ref(false)

// Composables
const { processarArquivoComPython } = useVendasOperadoraUnica()
const { enviarVendasParaSupabase } = useImportacao()

// Métodos
const handleOperadoraSelect = (operadoraId) => {
  operadoraSelecionada.value = operadoraId
  // Reset ao trocar operadora
  arquivo.value = null
  vendasProcessadas.value = []
  status.value = 'idle'
}

const handleArquivoSelecionado = async (file) => {
  arquivo.value = file
  await processarArquivo()
}

const handleArquivoRemovido = () => {
  arquivo.value = null
  vendasProcessadas.value = []
  status.value = 'idle'
}

const processarArquivo = async () => {
  if (!arquivo.value || !operadoraSelecionada.value) return
  
  status.value = 'processando'
  
  try {
    console.log('=== INICIANDO PROCESSAMENTO ===')
    console.log('Operadora:', operadoraSelecionada.value)
    console.log('Arquivo:', arquivo.value.name)
    
    if (operadoraSelecionada.value === 'unica') {
      // Processar arquivo com Python
      const resultado = await processarArquivoComPython(arquivo.value, operadoraSelecionada.value)
      
      console.log('Resultado do processamento:', resultado)
      
      if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
        vendasProcessadas.value = resultado.registros
        status.value = 'sucesso'
        console.log('Vendas processadas com sucesso:', resultado.registros.length)
      } else {
        throw new Error(resultado.erro || 'Nenhuma venda válida foi encontrada no arquivo')
      }
    } else {
      throw new Error(`Processador para operadora ${operadoraSelecionada.value} ainda não implementado`)
    }
    
  } catch (error) {
    console.error('Erro no processamento:', error)
    status.value = 'erro'
    mensagemErro.value = error.message
  }
}

const enviarParaSupabase = async () => {
  enviando.value = true
  
  try {
    console.log('Enviando vendas para Supabase:', vendasProcessadas.value.length)
    await enviarVendasParaSupabase(vendasProcessadas.value)
    
    alert('Vendas enviadas com sucesso!')
    
    // Reset
    arquivo.value = null
    vendasProcessadas.value = []
    status.value = 'idle'
    operadoraSelecionada.value = null
    
  } catch (error) {
    console.error('Erro ao enviar vendas:', error)
    alert('Erro ao enviar vendas: ' + error.message)
  } finally {
    enviando.value = false
  }
}
</script>