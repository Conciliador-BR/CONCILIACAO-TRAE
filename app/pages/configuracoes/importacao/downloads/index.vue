<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border border-gray-200 rounded-2xl">
      <h2 class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Importação de Downloads</h2>
      <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">
        Baixe arquivos da VR no Oracle antes de processar vendas e recebimentos.
      </p>
    </div>

    <AlertaEmpresa v-if="!empresaSelecionadaGlobal || isTodasEmpresasSelected" />

    <div class="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
      <div>
        <h4 class="text-base font-semibold text-gray-900">Vouchers</h4>
        <p class="mt-1 text-xs text-gray-600">Selecione o voucher para carregar o cadastro e fazer o download.</p>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <button
            type="button"
            :class="cardClass(operadoraSelecionada === 'vr')"
            @click="handleSelecionarOperadora('vr')"
          >
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2 bg-green-500">
              VR
            </div>
            <div class="text-sm font-medium text-gray-800">VR</div>
          </button>
        </div>
      </div>
    </div>

    <VrDownloadCard
      v-if="operadoraSelecionada === 'vr'"
      :empresas="empresas"
      :empresa-id="empresaSelecionadaGlobal"
      :empresa-selecionada="empresaAtual"
      :data-inicial="filtrosGlobais.dataInicial"
      :data-final="filtrosGlobais.dataFinal"
      :overwrite="overwrite"
      :carregando-empresas="loading"
      :status-data="status"
      :carregando-status="carregandoStatus"
      :baixando="baixando"
      :mensagem-erro="mensagemErro"
      @update:overwrite="overwrite = $event"
      @atualizar-status="handleAtualizarStatus"
      @baixar="handleBaixar"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import VrDownloadCard from '~/components/configuracoes/importacao/downloads/VrDownloadCard.vue'
import AlertaEmpresa from '~/components/configuracoes/importacao/importacao_bancos/AlertaEmpresa.vue'
import { useVrDownloads } from '~/composables/configuracoes/importacao/downloads/useVrDownloads'
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

const { empresas, empresaSelecionada: empresaSelecionadaAtiva, loading, fetchEmpresas, getEmpresaPorId } = useEmpresas()
const { filtrosGlobais } = useGlobalFilters()
const { status, erro, carregandoStatus, baixando, carregarStatus, baixarArquivos } = useVrDownloads()

const overwrite = ref(false)
const operadoraSelecionada = ref('vr')

const empresaSelecionadaGlobal = computed(() => empresaSelecionadaAtiva.value)
const isTodasEmpresasSelected = computed(() => empresaSelecionadaAtiva.value === '')
const empresaAtual = computed(() => getEmpresaPorId(empresaSelecionadaGlobal.value))
const mensagemErro = computed(() => erro.value)

const cardClass = (ativo) => [
  'border-2 rounded-lg px-4 py-4 transition-all duration-200 text-center flex flex-col items-center',
  ativo
    ? 'border-blue-500 bg-blue-50'
    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
]

const buildVrLookupPayload = () => ({
  adquirente: operadoraSelecionada.value,
  empresaNome: String(empresaAtual.value?.nome || '').trim(),
  ec: String(empresaAtual.value?.matriz || '').trim()
})

const handleAtualizarStatus = async () => {
  try {
    await carregarStatus(buildVrLookupPayload())
  } catch (error) {
    console.error('Falha ao atualizar status da VR:', error)
  }
}

const handleSelecionarOperadora = async (operadora) => {
  operadoraSelecionada.value = operadora
  await handleAtualizarStatus()
}

const handleBaixar = async () => {
  if (!empresaAtual.value) {
    alert('Selecione uma empresa antes de baixar os arquivos da VR.')
    return
  }

  try {
    await baixarArquivos({
      adquirente: operadoraSelecionada.value,
      empresaNome: String(empresaAtual.value?.nome || '').trim(),
      ec: String(empresaAtual.value?.matriz || '').trim(),
      cnpj: String(empresaAtual.value?.cnpj || ''),
      dataInicial: filtrosGlobais.dataInicial,
      dataFinal: filtrosGlobais.dataFinal,
      overwrite: overwrite.value
    })
  } catch (error) {
    console.error('Falha ao baixar arquivos da VR:', error)
  }
}

onMounted(async () => {
  try {
    if (!empresas.value.length) {
      await fetchEmpresas()
    }
    await handleAtualizarStatus()
  } catch (error) {
    console.error('Falha ao iniciar tela de downloads da VR:', error)
  }
})

watch(empresaSelecionadaGlobal, async (novaEmpresa, empresaAnterior) => {
  if (novaEmpresa === empresaAnterior) return

  try {
    await handleAtualizarStatus()
  } catch (error) {
    console.error('Falha ao sincronizar a VR com a empresa do filtro global:', error)
  }
})
</script>
