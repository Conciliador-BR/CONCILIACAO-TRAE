<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border border-gray-200 rounded-2xl">
      <h2 class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Importação de Downloads</h2>
      <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">
        Baixe arquivos da VR no Oracle antes de processar vendas e recebimentos.
      </p>
    </div>

    <VrDownloadCard
      :empresas="empresas"
      :empresa-id="empresaSelecionada"
      :empresa-selecionada="empresaAtual"
      :data-inicial="dataInicial"
      :data-final="dataFinal"
      :overwrite="overwrite"
      :fixed-remote-name="fixedRemoteName"
      :carregando-empresas="loading"
      :status-data="status"
      :carregando-status="carregandoStatus"
      :baixando="baixando"
      :mensagem-erro="mensagemErro"
      @update:empresa-id="empresaSelecionada = $event"
      @update:data-inicial="dataInicial = $event"
      @update:data-final="dataFinal = $event"
      @update:overwrite="overwrite = $event"
      @atualizar-status="handleAtualizarStatus"
      @baixar="handleBaixar"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import VrDownloadCard from '~/components/configuracoes/importacao/downloads/VrDownloadCard.vue'
import { useVrDownloads } from '~/composables/configuracoes/importacao/downloads/useVrDownloads'
import { useEmpresas } from '~/composables/useEmpresas'

const { empresas, empresaSelecionada, loading, fetchEmpresas, getEmpresaPorId } = useEmpresas()
const { status, erro, carregandoStatus, baixando, carregarStatus, baixarArquivos } = useVrDownloads()

const dataInicial = ref('')
const dataFinal = ref('')
const overwrite = ref(false)

const empresaAtual = computed(() => getEmpresaPorId(empresaSelecionada.value))
const fixedRemoteName = computed(() => String(status.value?.config?.fixedRemoteName || 'VR_ECONOMICCARD_10478994000100.txt'))
const mensagemErro = computed(() => erro.value)

const handleAtualizarStatus = async () => {
  try {
    await carregarStatus()
  } catch (error) {
    console.error('Falha ao atualizar status da VR:', error)
  }
}

const handleBaixar = async () => {
  if (!empresaAtual.value) {
    alert('Selecione uma empresa antes de baixar os arquivos da VR.')
    return
  }

  try {
    await baixarArquivos({
      cnpj: String(empresaAtual.value?.cnpj || ''),
      dataInicial: dataInicial.value,
      dataFinal: dataFinal.value,
      overwrite: overwrite.value,
      fixedRemoteName: fixedRemoteName.value
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
    await carregarStatus()
  } catch (error) {
    console.error('Falha ao iniciar tela de downloads da VR:', error)
  }
})
</script>
