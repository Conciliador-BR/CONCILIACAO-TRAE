<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">Importação</h1>
    
    <!-- Abas para alternar entre Vendas e Bancos -->
    <div class="mb-8">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="abaAtiva = 'vendas'"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm',
              abaAtiva === 'vendas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Importação de Vendas
          </button>
          <button
            @click="abaAtiva = 'bancos'"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm',
              abaAtiva === 'bancos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Importação de Bancos
          </button>
        </nav>
      </div>
    </div>

    <!-- Conteúdo da aba Vendas -->
    <div v-if="abaAtiva === 'vendas'">
      <!-- Componente Seletor de Operadora -->
      <SeletorOperadora 
        :model-value="operadoraSelecionada"
        :disabled="!empresaSelecionadaGlobal"
        @operadora-selecionada="handleOperadoraSelect"
      />

      <!-- Componente Upload de Arquivo -->
      <UploadArquivo 
        :operadora-selecionada="operadoraSelecionada"
        :arquivo="arquivo"
        :disabled="!empresaSelecionadaGlobal || !operadoraSelecionada"
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
        :disabled="!empresaSelecionadaGlobal"
        @enviar-vendas="enviarParaSupabase"
      />
    </div>

    <!-- Conteúdo da aba Bancos -->
    <div v-if="abaAtiva === 'bancos'">
      <ImportarBancos 
        @arquivo-processado="handleBancoProcessado"
        @erro-processamento="handleErroBanco"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useVendasOperadoraUnica } from '~/composables/importacao/vendas_operadora_unica'
import { useImportacao } from '~/composables/importacao/useImportacao'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'

// Importar componentes
import SeletorOperadora from '~/components/importacao/SeletorOperadora.vue'
import UploadArquivo from '~/components/importacao/UploadArquivo.vue'
import StatusProcessamento from '~/components/importacao/StatusProcessamento.vue'
import TabelaVendas from '~/components/importacao/TabelaVendas.vue'
import BotaoEnviarSupabase from '~/components/importacao/BotaoEnviarSupabase.vue'
import ImportarBancos from '~/components/importacao/importacao_bancos/ImportarBancos.vue'

// Estado da aba ativa
const abaAtiva = ref('vendas')

// Estados locais para vendas
const operadoraSelecionada = ref(null)
const arquivo = ref(null)
const vendasProcessadas = ref([])
const status = ref('idle')
const mensagemErro = ref('')
const enviando = ref(false)

// Composables
const { processarArquivoComPython } = useVendasOperadoraUnica()
const { enviarVendasParaSupabase } = useImportacao()
const { filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas } = useEmpresas()

// Computed para acessar o estado global da empresa
const empresaSelecionadaGlobal = computed(() => {
  console.log('Estado global da empresa:', filtrosGlobais.empresaSelecionada)
  return filtrosGlobais.empresaSelecionada
})

const nomeEmpresaGlobal = computed(() => {
  if (!filtrosGlobais.empresaSelecionada) return ''
  const empresa = empresas.value.find(e => e.id == filtrosGlobais.empresaSelecionada)
  const nome = empresa ? empresa.nome : ''
  console.log('Nome da empresa global:', nome)
  return nome
})

// Debug: Watch para monitorar mudanças no estado global
watch(filtrosGlobais, (novosValores) => {
  console.log('Filtros globais mudaram:', novosValores)
}, { deep: true })

// Carregar empresas ao montar (se ainda não carregadas)
onMounted(async () => {
  if (empresas.value.length === 0) {
    await fetchEmpresas()
  }
})

// Watch para reagir a mudanças na empresa selecionada globalmente
watch(empresaSelecionadaGlobal, (novaEmpresa) => {
  if (!novaEmpresa) {
    // Se a empresa foi desmarcada, reset tudo
    operadoraSelecionada.value = null
    arquivo.value = null
    vendasProcessadas.value = []
    status.value = 'idle'
  }
})

// Métodos para vendas
const handleOperadoraSelect = (operadoraId) => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  
  operadoraSelecionada.value = operadoraId
  // Reset ao trocar operadora
  arquivo.value = null
  vendasProcessadas.value = []
  status.value = 'idle'
}

const handleArquivoSelecionado = async (file) => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  
  arquivo.value = file
  await processarArquivo()
}

const handleArquivoRemovido = () => {
  arquivo.value = null
  vendasProcessadas.value = []
  status.value = 'idle'
}

const processarArquivo = async () => {
  if (!arquivo.value || !operadoraSelecionada.value || !empresaSelecionadaGlobal.value) return
  
  status.value = 'processando'
  
  try {
    console.log('=== INICIANDO PROCESSAMENTO ===')
    console.log('Empresa:', nomeEmpresaGlobal.value)
    console.log('Operadora:', operadoraSelecionada.value)
    console.log('Arquivo:', arquivo.value.name)
    
    if (operadoraSelecionada.value === 'unica') {
      console.log('=== INICIANDO PROCESSAMENTO ===')
      console.log('Empresa ID:', empresaSelecionadaGlobal.value)
      console.log('Nome da empresa:', nomeEmpresaGlobal.value)
      
      // Verificar se as empresas estão carregadas
      if (!empresas.value || empresas.value.length === 0) {
        console.log('Empresas não carregadas, carregando...')
        await fetchEmpresas()
      }
      
      console.log('Empresas disponíveis:', empresas.value)
      
      // Processar arquivo com Python, passando o nome da empresa
      const resultado = await processarArquivoComPython(
        arquivo.value, 
        operadoraSelecionada.value,
        nomeEmpresaGlobal.value  // Para KMC, isso deve ser 'KMC'
      )
      
      console.log('Resultado do processamento:', resultado)
      
      if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
        // Preencher a coluna empresa com o nome da empresa selecionada globalmente
        const vendasComEmpresa = resultado.registros.map(venda => ({
          ...venda,
          empresa: nomeEmpresaGlobal.value
        }))
        
        vendasProcessadas.value = vendasComEmpresa
        status.value = 'sucesso'
        console.log('Vendas processadas com sucesso:', resultado.registros.length)
        console.log('Empresa preenchida automaticamente:', nomeEmpresaGlobal.value)
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
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  
  enviando.value = true
  
  try {
    console.log('Enviando vendas para Supabase:', vendasProcessadas.value.length)
    console.log('Empresa das vendas:', nomeEmpresaGlobal.value)
    
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

// Métodos para bancos
const handleBancoProcessado = (dados) => {
  console.log('Banco processado:', dados)
  // Aqui você pode implementar a lógica para lidar com os dados do banco processado
}

const handleErroBanco = (erro) => {
  console.error('Erro no processamento do banco:', erro)
  // Aqui você pode implementar a lógica para lidar com erros
}
</script>