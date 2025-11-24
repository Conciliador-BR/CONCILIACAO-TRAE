<template>
  <div>
    <div v-if="isTodasEmpresasSelected" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
      <p class="font-medium">⚠️ Por favor, selecione uma empresa específica para fazer a importação.</p>
    </div>

    <SeletorOperadora 
      :model-value="operadoraSelecionada"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      titulo-direita="Importação de Vendas"
      @operadora-selecionada="handleOperadoraSelect"
    />

    <UploadArquivo 
      :operadora-selecionada="operadoraSelecionada"
      :arquivo="arquivo"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected || !operadoraSelecionada"
      @arquivo-selecionado="handleArquivoSelecionado"
      @arquivo-removido="handleArquivoRemovido"
    />

    <StatusProcessamento 
      :arquivo="arquivo"
      :status="status"
      :total-vendas="vendasProcessadas.length"
      :mensagem-erro="mensagemErro"
    />

    <TabelaVendasVoucher 
      v-if="operadoraSelecionada === 'alelo' && status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
    />
    <TabelaVendas 
      v-else-if="status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
    />

    <BotaoEnviarSupabase 
      :vendas="vendasProcessadas"
      :enviando="enviando"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @enviar-vendas="enviarParaSupabase"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useVendasOperadoraUnica } from '~/composables/importacao/Processor_vendas_operadoras/vendas_operadora_unica'
import { useVendasOperadoraStone } from '~/composables/importacao/Processor_vendas_operadoras/vendas_operadora_stone'
import { useVendasOperadoraSafra } from '~/composables/importacao/Processor_vendas_operadoras/vendas_operadora_safra'
import { useVendasOperadoraRede } from '~/composables/importacao/Processor_vendas_operadoras/vendas_operadora_rede'
import { useVendasOperadoraCielo } from '~/composables/importacao/Processor_vendas_operadoras/vendas_operadora_cielo'
import { useVendasOperadoraGetnet } from '~/composables/importacao/Processor_vendas_operadoras/vendas_operadora_getnet'
import { useImportacao } from '~/composables/importacao/Envio_vendas/useImportacao'
import { useProcessorVendasVoucherAlelo } from '~/composables/importacao/procesor_vendas_vouchers/vendas_voucher_alelo.js'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'

import SeletorOperadora from '~/components/importacao/importacao_vendas/SeletorOperadora.vue'
import UploadArquivo from '~/components/importacao/importacao_vendas/UploadArquivo.vue'
import StatusProcessamento from '~/components/importacao/importacao_vendas/StatusProcessamento.vue'
import TabelaVendas from '~/components/importacao/importacao_vendas/TabelaVendas.vue'
import TabelaVendasVoucher from '~/components/importacao/importacao_vendas/TabelaVendasVoucher.vue'
import BotaoEnviarSupabase from '~/components/importacao/importacao_vendas/BotaoEnviarSupabase.vue'

const operadoraSelecionada = ref(null)
const arquivo = ref(null)
const vendasProcessadas = ref([])
const status = ref('idle')
const mensagemErro = ref('')
const enviando = ref(false)

const { processarArquivoComPython: processarArquivoUnica } = useVendasOperadoraUnica()
const { processarArquivoComPython: processarArquivoStone } = useVendasOperadoraStone()
const { processarArquivoComPython: processarArquivoSafra } = useVendasOperadoraSafra()
const { processarArquivoComPython: processarArquivoRede } = useVendasOperadoraRede()
const { processarArquivoComPython: processarArquivoCielo } = useVendasOperadoraCielo()
const { processarArquivoComPython: processarArquivoGetnet } = useVendasOperadoraGetnet()
const { enviarVendasParaSupabase } = useImportacao()
const { filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas } = useEmpresas()

const empresaSelecionadaGlobal = computed(() => {
  return filtrosGlobais.empresaSelecionada
})

const isTodasEmpresasSelected = computed(() => {
  return filtrosGlobais.empresaSelecionada === ''
})

const nomeEmpresaGlobal = computed(() => {
  if (!filtrosGlobais.empresaSelecionada) return ''
  const empresa = empresas.value.find(e => e.id == filtrosGlobais.empresaSelecionada)
  const nome = empresa ? empresa.nome : ''
  return nome
})

watch(filtrosGlobais, () => {}, { deep: true })

onMounted(async () => {
  if (empresas.value.length === 0) {
    await fetchEmpresas()
  }
})

watch(empresaSelecionadaGlobal, (novaEmpresa) => {
  if (!novaEmpresa) {
    operadoraSelecionada.value = null
    arquivo.value = null
    vendasProcessadas.value = []
    status.value = 'idle'
  }
})

const handleOperadoraSelect = (operadoraId) => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  operadoraSelecionada.value = operadoraId
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
  mensagemErro.value = ''
}

const processarArquivo = async () => {
  if (!arquivo.value || !operadoraSelecionada.value || !empresaSelecionadaGlobal.value) return
  status.value = 'processando'

  try {
    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }

    let resultado
    if (operadoraSelecionada.value === 'unica') {
      resultado = await processarArquivoUnica(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value)
    } else if (operadoraSelecionada.value === 'stone') {
      resultado = await processarArquivoStone(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value)
    } else if (operadoraSelecionada.value === 'safra') {
      resultado = await processarArquivoSafra(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value)
    } else if (operadoraSelecionada.value === 'rede') {
      resultado = await processarArquivoRede(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value)
    } else if (operadoraSelecionada.value === 'cielo') {
      resultado = await processarArquivoCielo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value)
    } else if (operadoraSelecionada.value === 'getnet') {
      resultado = await processarArquivoGetnet(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value)
    } else if (operadoraSelecionada.value === 'alelo') {
      const { processarArquivo } = useProcessorVendasVoucherAlelo()
      resultado = await processarArquivo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value)
    } else {
      throw new Error(`Processador para operadora ${operadoraSelecionada.value} ainda não implementado`)
    }

    if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
      vendasProcessadas.value = resultado.registros
      status.value = 'sucesso'
    } else {
      throw new Error(resultado.erro || 'Nenhuma venda válida foi encontrada no arquivo')
    }
  } catch (error) {
    status.value = 'erro'
    mensagemErro.value = error.message
  }
}

const enviarParaSupabase = async () => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  if (!operadoraSelecionada.value) {
    alert('Selecione uma operadora primeiro!')
    return
  }
  enviando.value = true

  try {
    await enviarVendasParaSupabase(
      vendasProcessadas.value, 
      nomeEmpresaGlobal.value,
      operadoraSelecionada.value
    )
    alert('Vendas enviadas com sucesso!')
    arquivo.value = null
    vendasProcessadas.value = []
    status.value = 'idle'
    operadoraSelecionada.value = null
  } catch (error) {
    alert('Erro ao enviar vendas: ' + error.message)
  } finally {
    enviando.value = false
  }
}
</script>