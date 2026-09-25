<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border border-gray-200 rounded-2xl">
      <h2 class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Importação de Downloads</h2>
      <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">
        Consulte e organize os arquivos das adquirentes antes de processar vendas e recebimentos.
      </p>
    </div>

    <AlertaEmpresa v-if="!empresaSelecionadaGlobal || isTodasEmpresasSelected" />

    <div class="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
      <div>
        <h4 class="text-base font-semibold text-gray-900">Vouchers</h4>
        <p class="mt-1 text-xs text-gray-600">Selecione o voucher para carregar o cadastro e fazer o download.</p>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <button
            v-for="opcao in operadorasDisponiveis"
            :key="opcao.id"
            type="button"
            :class="cardClass(operadoraSelecionada === opcao.id)"
            @click="handleSelecionarOperadora(opcao.id)"
          >
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2" :class="opcao.cor">
              {{ opcao.sigla }}
            </div>
            <div class="text-sm font-medium text-gray-800">{{ opcao.label }}</div>
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
      :carregando-empresas="loading"
      :status-data="status"
      :carregando-status="carregandoStatus"
      :baixando="baixando"
      :mensagem-erro="mensagemErro"
      @atualizar-status="handleAtualizarStatus"
      @baixar="handleBaixar"
    />

    <VoucherTxtDownloadCard
      v-else-if="operadoraSelecionada !== 'alelo'"
      :operadora-label="operadoraAtual?.label || ''"
      :empresas="empresas"
      :empresa-id="empresaSelecionadaGlobal"
      :empresa-selecionada="empresaAtual"
      :data-inicial="filtrosGlobais.dataInicial"
      :data-final="filtrosGlobais.dataFinal"
      :status-data="statusVoucherTxt"
      :carregando-status="carregandoStatusVoucherTxt"
      :baixando="baixandoVoucherTxt"
      :mensagem-erro="mensagemErroVoucherTxt"
      @atualizar-status="handleAtualizarStatus"
      @baixar="handleBaixar"
    />

    <AleloDownloadCard
      v-else
      :empresa-selecionada="empresaAtual"
      :status-data="statusAlelo"
      :carregando-status="carregandoStatusAlelo"
      :baixando="baixandoAlelo"
      :mensagem-erro="erroAlelo"
      @atualizar-status="handleAtualizarStatus"
      @baixar="handleBaixar"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import VrDownloadCard from '~/components/configuracoes/importacao/downloads/VrDownloadCard.vue'
import VoucherTxtDownloadCard from '~/components/configuracoes/importacao/downloads/VoucherTxtDownloadCard.vue'
import AleloDownloadCard from '~/components/configuracoes/importacao/downloads/AleloDownloadCard.vue'
import AlertaEmpresa from '~/components/configuracoes/importacao/importacao_bancos/AlertaEmpresa.vue'
import { useAleloDownloads } from '~/composables/configuracoes/importacao/downloads/useAleloDownloads'
import { useVrDownloads } from '~/composables/configuracoes/importacao/downloads/useVrDownloads'
import { useVoucherTxtDownloads } from '~/composables/configuracoes/importacao/downloads/useVoucherTxtDownloads'
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

const { empresas, empresaSelecionada: empresaSelecionadaAtiva, loading, fetchEmpresas, getEmpresaPorId } = useEmpresas()
const { filtrosGlobais } = useGlobalFilters()
const { status, erro, carregandoStatus, baixando, carregarStatus, baixarArquivos } = useVrDownloads()
const {
  status: statusVoucherTxt,
  erro: erroVoucherTxt,
  carregandoStatus: carregandoStatusVoucherTxt,
  baixando: baixandoVoucherTxt,
  carregarStatus: carregarStatusVoucherTxt,
  baixarArquivos: baixarArquivosVoucherTxt
} = useVoucherTxtDownloads()
const {
  status: statusAlelo,
  erro: erroAlelo,
  carregandoStatus: carregandoStatusAlelo,
  baixando: baixandoAlelo,
  carregarStatus: carregarStatusAlelo,
  baixarArquivos: baixarArquivosAlelo
} = useAleloDownloads()

const operadoraSelecionada = ref('vr')
const operadorasDisponiveis = [
  { id: 'vr', label: 'VR', sigla: 'VR', cor: 'bg-green-500' },
  { id: 'alelo', label: 'Alelo / NAIP', sigla: 'AL', cor: 'bg-yellow-500' },
  { id: 'comprocard', label: 'Comprocard', sigla: 'CC', cor: 'bg-orange-500' },
  { id: 'upbrasil', label: 'Up Brasil', sigla: 'UB', cor: 'bg-green-600' },
  { id: 'lecard', label: 'LeCard', sigla: 'LC', cor: 'bg-lime-500' }
]

const empresaSelecionadaGlobal = computed(() => empresaSelecionadaAtiva.value)
const isTodasEmpresasSelected = computed(() => empresaSelecionadaAtiva.value === '')
const empresaAtual = computed(() => getEmpresaPorId(empresaSelecionadaGlobal.value))
const operadoraAtual = computed(() => operadorasDisponiveis.find((item) => item.id === operadoraSelecionada.value) || operadorasDisponiveis[0])
const isVrSelecionada = computed(() => operadoraSelecionada.value === 'vr')
const isAleloSelecionada = computed(() => operadoraSelecionada.value === 'alelo')
const mensagemErro = computed(() => isVrSelecionada.value ? erro.value : erroVoucherTxt.value)
const mensagemErroVoucherTxt = computed(() => erroVoucherTxt.value)

const cardClass = (ativo) => [
  'border-2 rounded-lg px-4 py-4 transition-all duration-200 text-center flex flex-col items-center',
  ativo
    ? 'border-blue-500 bg-blue-50'
    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
]

const buildVrLookupPayload = () => ({
  adquirente: operadoraSelecionada.value,
  empresaNome: String(empresaAtual.value?.nome || '').trim(),
  ec: String(empresaAtual.value?.matriz || '').trim(),
  cnpj: String(empresaAtual.value?.cnpj || '').trim(),
  dataInicial: filtrosGlobais.dataInicial,
  dataFinal: filtrosGlobais.dataFinal
})

const handleAtualizarStatus = async () => {
  try {
    if (isVrSelecionada.value) {
      await carregarStatus(buildVrLookupPayload())
      return
    }

    if (isAleloSelecionada.value) {
      await carregarStatusAlelo(buildVrLookupPayload())
      return
    }

    await carregarStatusVoucherTxt(operadoraSelecionada.value, buildVrLookupPayload())
  } catch (error) {
    console.error('Falha ao atualizar status da adquirente:', error)
  }
}

const handleSelecionarOperadora = async (operadora) => {
  operadoraSelecionada.value = operadora
  await handleAtualizarStatus()
}

const handleBaixar = async () => {
  if (!empresaAtual.value) {
    alert(`Selecione uma empresa antes de consultar os arquivos da ${operadoraAtual.value?.label || ''}.`)
    return
  }

  try {
    const payload = {
      adquirente: operadoraSelecionada.value,
      empresaNome: String(empresaAtual.value?.nome || '').trim(),
      ec: String(empresaAtual.value?.matriz || '').trim(),
      cnpj: String(empresaAtual.value?.cnpj || ''),
      dataInicial: filtrosGlobais.dataInicial,
      dataFinal: filtrosGlobais.dataFinal
    }

    if (isVrSelecionada.value) {
      await baixarArquivos(payload)
      return
    }

    if (isAleloSelecionada.value) {
      await baixarArquivosAlelo(payload)
      return
    }

    await baixarArquivosVoucherTxt(operadoraSelecionada.value, payload)
  } catch (error) {
    console.error('Falha ao consultar arquivos da adquirente:', error)
  }
}

onMounted(async () => {
  try {
    if (!empresas.value.length) {
      await fetchEmpresas()
    }
    await handleAtualizarStatus()
  } catch (error) {
    console.error('Falha ao iniciar tela de downloads:', error)
  }
})

watch(empresaSelecionadaGlobal, async (novaEmpresa, empresaAnterior) => {
  if (novaEmpresa === empresaAnterior) return

  try {
    await handleAtualizarStatus()
  } catch (error) {
    console.error('Falha ao sincronizar os downloads com a empresa do filtro global:', error)
  }
})

watch(
  () => [filtrosGlobais.dataInicial, filtrosGlobais.dataFinal],
  async ([novaDataInicial, novaDataFinal], [dataInicialAnterior, dataFinalAnterior]) => {
    if (novaDataInicial === dataInicialAnterior && novaDataFinal === dataFinalAnterior) return

    try {
      await handleAtualizarStatus()
    } catch (error) {
      console.error('Falha ao sincronizar os downloads com o periodo do filtro global:', error)
    }
  }
)
</script>
