<template>
  <div>
    <div v-if="isTodasEmpresasSelected" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
      <p class="font-medium">⚠️ Por favor, selecione uma empresa específica para fazer a importação.</p>
    </div>

    <SeletorOperadora 
      :model-value="operadoraSelecionada"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      titulo-direita="Importação de Recebimentos"
      @operadora-selecionada="handleOperadoraSelect"
    />

    <SeletorModoImportacaoRecebimentos
      :visivel="isRedeSelected"
      :modo-selecionado="modoImportacaoRede"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @modo-selecionado="handleModoImportacaoRede"
    />

    <SeletorModoImportacaoVrRecebimentos
      :visivel="isVrSelected"
      :modo-selecionado="modoImportacaoVr"
      :operadora-label="operadoraArquivoServidorAtual.label"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @modo-selecionado="handleModoImportacaoVr"
    />

    <SeletorModeloArquivoSafraRecebimentos
      :visivel="mostrarSeletorModeloArquivoSafra"
      :modelo-selecionado="modeloArquivoSafra"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @modelo-selecionado="handleModeloArquivoSafra"
    />

    <SeletorTipoArquivoSafraRecebimentos
      :visivel="mostrarSeletorTipoArquivoSafra"
      :tipo-selecionado="tipoArquivoSafra"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @tipo-selecionado="handleTipoArquivoSafra"
    />

    <UploadArquivo 
      v-if="mostrarUploadArquivo"
      :operadora-selecionada="operadoraSelecionada"
      :arquivo="arquivo"
      :status="status"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected || !operadoraSelecionada"
      @arquivo-selecionado="handleArquivoSelecionado"
      @arquivo-removido="handleArquivoRemovido"
    />

    <ImportacaoAutomaticaRedeRecebimentos
      :visivel="mostrarImportacaoApiRede"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected || !operadoraSelecionada"
      :carregando="carregandoImportacaoApiRede"
      :erro="erroImportacaoApiRede"
      :integracao-encontrada="integracaoApiRedeEncontrada"
      :criterio-busca="criterioBuscaIntegracaoApiRede"
      :data-inicial="filtrosGlobais.dataInicial"
      :data-final="filtrosGlobais.dataFinal"
      @importar="handleImportacaoAutomaticaRedeRecebimentos"
    />

    <ImportacaoAutomaticaVrRecebimentos
      :visivel="mostrarImportacaoApiVr"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected || !operadoraSelecionada"
      :carregando-arquivos="carregandoArquivosArquivoServidorAtual"
      :carregando="carregandoImportacaoArquivoServidorAtual"
      :mensagem-erro="erroImportacaoArquivoServidorAtual"
      :arquivos-disponiveis="arquivosDisponiveisArquivoServidorFiltrados"
      :nome-empresa="nomeEmpresaGlobal"
      :cnpj="cnpjEmpresaGlobal"
      :data-inicial="filtrosGlobais.dataInicial"
      :data-final="filtrosGlobais.dataFinal"
      :operadora-label="operadoraArquivoServidorAtual.label"
      :diretorio-exibicao="operadoraArquivoServidorAtual.diretorio"
      @atualizar-arquivos="handleAtualizarArquivosVr"
      @executar="handleImportacaoAutomaticaVrRecebimentos"
    />

    <StatusProcessamento 
      v-if="mostrarUploadArquivo"
      :arquivo="arquivo"
      :status="status"
      :total-recebimentos="recebimentosProcessados.length"
      :mensagem-erro="mensagemErro"
    />

    <TabelaRecebimentosVouchers 
      v-if="operadoraSelecionada === 'alelo' || operadoraSelecionada === 'ticket' || operadoraSelecionada === 'vr' || operadoraSelecionada === 'pluxe' || operadoraSelecionada === 'pluxee' || operadoraSelecionada === 'sodexo' || operadoraSelecionada === 'comprocard' || operadoraSelecionada === 'lecard' || operadoraSelecionada === 'upbrasil'" 
      :recebimentos="recebimentosProcessados" 
      :adquirente="operadoraSelecionada" 
    />
    <TabelaRecebimentos 
      v-else 
      :recebimentos="recebimentosProcessados" 
      :adquirente="operadoraSelecionada" 
    />

    <TabelaStatusRecebimentos
      :recebimentos="recebimentosProcessados"
      :recebimentos-status="recebimentosStatus"
      :cruzamento-executado="cruzamentoExecutado"
      :cruzando="cruzando"
      @executar-cruzamento="executarCruzamento"
    />

    <BotaoEnviarSupabase 
      v-if="cruzamentoExecutado"
      :recebimentos="recebimentosPendentesEnvio"
      :enviando="enviando"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @abrir-confirmacao="abrirConfirmacaoEnvio"
    />

    <ConfirmacaoEnvioFlutuante
      :open="confirmacaoEnvioAberta"
      tipo="recebimentos"
      :empresa="nomeEmpresaGlobal"
      :ec="ecEmpresaGlobal"
      :tipo-unidade="tipoUnidadeGlobal"
      :adquirente="String(operadoraSelecionada || '').toUpperCase()"
      :total-registros="recebimentosPendentesEnvio.length"
      :nome-tabela="nomeTabelaConfirmacao"
      :tabela-existe="tabelaExiste"
      :verificando-tabela="verificandoTabela"
      :erro-tabela="erroTabela"
      :loading="enviando"
      @cancel="fecharConfirmacaoEnvio"
      @confirm="enviarParaSupabase"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useEnvioRecebimentos } from '~/composables/configuracoes/importacao/Envio_recebimentos/useEnvioRecebimentos'
import { useEnvioRecebimentosVouchers } from '~/composables/configuracoes/importacao/Envio_recebimentos/UseEnvioRecebimentosVouchers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'
import { useImportacaoAutomaticaRede_recebimentos } from '~/composables/configuracoes/importacao/processor_recebimentos_automaticos/rede/useImportacaoAutomaticaRede_recebimentos'
import { useImportacaoAutomaticaVrRecebimentos } from '~/composables/configuracoes/importacao/processor_recebimentos_automaticos/vr/useImportacaoAutomaticaVr_recebimentos'
import { useImportacaoAutomaticaVoucherTxtRecebimentos } from '~/composables/configuracoes/importacao/processor_recebimentos_automaticos/voucher_txt/useImportacaoAutomaticaVoucherTxt_recebimentos'

// Usa os componentes de RECEBIMENTOS
import SeletorOperadora from '~/components/configuracoes/importacao/importacao_recebimentos/SeletorOperadora.vue'
import SeletorModoImportacaoRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/SeletorModoImportacaoRecebimentos.vue'
import SeletorModoImportacaoVrRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/SeletorModoImportacaoVrRecebimentos.vue'
import SeletorModeloArquivoSafraRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/SeletorModeloArquivoSafraRecebimentos.vue'
import SeletorTipoArquivoSafraRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/SeletorTipoArquivoSafraRecebimentos.vue'
import UploadArquivo from '~/components/configuracoes/importacao/importacao_recebimentos/UploadArquivo.vue'
import ImportacaoAutomaticaRedeRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/ImportacaoAutomaticaRedeRecebimentos.vue'
import ImportacaoAutomaticaVrRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/ImportacaoAutomaticaVrRecebimentos.vue'
import StatusProcessamento from '~/components/configuracoes/importacao/importacao_recebimentos/StatusProcessamento.vue'
import TabelaRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/TabelaRecebimentos.vue'
import TabelaRecebimentosVouchers from '~/components/configuracoes/importacao/importacao_recebimentos/TabelaRecebimentosVouchers.vue'
import BotaoEnviarSupabase from '~/components/configuracoes/importacao/importacao_recebimentos/BotaoEnviarSupabase.vue'
import TabelaStatusRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/TabelaStatusRecebimentos.vue'
import ConfirmacaoEnvioFlutuante from '~/components/configuracoes/importacao/card_confirmacao_envio/ConfirmacaoEnvioFlutuante.vue'
import { useCruzamentoRecebimentosSupabase } from '~/composables/configuracoes/importacao/Envio_recebimentos/useCruzamentoRecebimentosSupabase'
import { useConfirmacaoEnvioSupabase } from '~/composables/configuracoes/importacao/useConfirmacaoEnvioSupabase'

const operadoraSelecionada = ref(null)
const arquivo = ref(null)
const recebimentosProcessados = ref([])
const status = ref('idle')
const mensagemErro = ref('')
const enviando = ref(false)
const recebimentosStatus = ref([])
const cruzamentoExecutado = ref(false)
const modoImportacaoRede = ref('manual')
const modoImportacaoVr = ref('manual')
const modeloArquivoSafra = ref('')
const tipoArquivoSafra = ref('')
const recebimentosProcessorCache = new Map()
const recebimentosProcessorLoaders = {
  unica: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_unica_operadora')).useRecebimentosOperadoraUnica,
  stone: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_stone_operadora')).useRecebimentosOperadoraStone,
  safra: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_safra_operadora')).useRecebimentosOperadoraSafra,
  rede: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_rede_operadora')).useRecebimentosOperadoraRede,
  cielo: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_cielo_operadora')).useRecebimentosOperadoraCielo,
  getnet: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_getnet_operadora')).useRecebimentosOperadoraGetnet,
  sipag: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_sipag_operadora')).useRecebimentosOperadoraSipag,
  azulzinha: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_azulzinha_operadora')).useRecebimentosOperadoraAzulzinha,
  sicredi: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_sicredi_operadora')).useRecebimentosOperadoraSicredi,
  alelo: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_vouchers/recebimento_voucher_alelo')).useProcessorRecebimentoVoucherAlelo,
  comprocard: async () => (await import('~/composables/configuracoes/importacao/processor_recebimentos_vouchers/recebimento_voucher_comprocard')).useProcessorRecebimentoVoucherComprocard
}

const obterProcessadorRecebimentos = async (operadora) => {
  const loader = recebimentosProcessorLoaders[operadora]

  if (!loader) {
    throw new Error(`Processador para operadora ${operadora} ainda não implementado`)
  }

  if (!recebimentosProcessorCache.has(operadora)) {
    const factory = await loader()
    recebimentosProcessorCache.set(operadora, factory())
  }

  return recebimentosProcessorCache.get(operadora)
}
// REMOVER: const { enviarVendasParaSupabase } = useImportacao()
const { enviarRecebimentosParaSupabase: enviarRecebimentosParaSupabasePadrao, construirNomeTabela: construirNomeTabelaRecebimentos } = useEnvioRecebimentos()
const { enviarRecebimentosParaSupabase: enviarRecebimentosParaSupabaseVouchers, construirNomeTabela: construirNomeTabelaRecebimentosVouchers } = useEnvioRecebimentosVouchers()
const { cruzando, cruzarRecebimentosComSupabase } = useCruzamentoRecebimentosSupabase()
const { filtrosGlobais } = useGlobalFilters()
const { empresas, empresaSelecionada: empresaSelecionadaAtiva, fetchEmpresas } = useEmpresas()
const { verificandoTabela, tabelaExiste, erroTabela, verificarTabelaExiste, resetarVerificacaoTabela } = useConfirmacaoEnvioSupabase()
const {
  carregando: carregandoImportacaoApiRede,
  erro: erroImportacaoApiRede,
  integracaoEncontrada: integracaoApiRedeEncontrada,
  criterioBusca: criterioBuscaIntegracaoApiRede,
  limparEstado: limparImportacaoApiRede,
  importarRecebimentos
} = useImportacaoAutomaticaRede_recebimentos()
const {
  carregandoArquivos: carregandoArquivosVr,
  carregando: carregandoImportacaoApiVr,
  erro: erroImportacaoApiVr,
  arquivosDisponiveis: arquivosDisponiveisVr,
  carregarArquivosDisponiveis: carregarArquivosDisponiveisVr,
  importarRecebimentos: importarRecebimentosVr
} = useImportacaoAutomaticaVrRecebimentos()
const {
  carregandoArquivos: carregandoArquivosVoucherTxt,
  carregando: carregandoImportacaoApiVoucherTxt,
  erro: erroImportacaoApiVoucherTxt,
  arquivosDisponiveis: arquivosDisponiveisVoucherTxt,
  carregarArquivosDisponiveis: carregarArquivosDisponiveisVoucherTxt,
  importarRecebimentos: importarRecebimentosVoucherTxt
} = useImportacaoAutomaticaVoucherTxtRecebimentos()
const confirmacaoEnvioAberta = ref(false)
const nomeTabelaConfirmacao = ref('')
const OPERADORAS_ARQUIVO_SERVIDOR = {
  vr: { label: 'VR', diretorio: '/opt/conciliadora/vr/downloads/cnpj/<cnpj>' },
  alelo: { label: 'Alelo/NAIP', diretorio: '/opt/conciliadora/Alelo/processados/cnpj/<cnpj>' },
  comprocard: { label: 'Comprocard', diretorio: '/opt/conciliadora/Comprocard/processados/cnpj/<cnpj>' },
  upbrasil: { label: 'Up Brasil', diretorio: '/opt/conciliadora/UpBrasil/processados/cnpj/<cnpj>' },
  lecard: { label: 'LeCard', diretorio: '/opt/conciliadora/Lecard/processados/cnpj/<cnpj>' }
}

const empresaSelecionadaGlobal = computed(() => {
  return empresaSelecionadaAtiva.value
})

const isTodasEmpresasSelected = computed(() => {
  return empresaSelecionadaAtiva.value === ''
})

const nomeEmpresaGlobal = computed(() => {
  if (!empresaSelecionadaAtiva.value) return ''
  const empresa = empresas.value.find(e => e.id == empresaSelecionadaAtiva.value)
  const nome = empresa ? empresa.nome : ''
  return nome
})

const tipoUnidadeGlobal = computed(() => {
  if (!empresaSelecionadaAtiva.value) return ''
  const empresa = empresas.value.find(e => e.id == empresaSelecionadaAtiva.value)
  const nomeUnidade = String(empresa?.nomeMatriz || '').trim()
  if (!nomeUnidade) return 'Matriz'
  const nomeEmpresa = String(empresa?.nome || '').trim().toUpperCase()
  const nomeUnidadeNorm = nomeUnidade.toUpperCase()
  if (nomeUnidadeNorm === 'MATRIZ' || nomeUnidadeNorm === nomeEmpresa) return 'Matriz'
  return 'Filial'
})

const ecEmpresaGlobal = computed(() => {
  if (!empresaSelecionadaAtiva.value) return ''
  const empresa = empresas.value.find(e => e.id == empresaSelecionadaAtiva.value)
  return empresa ? (empresa.matriz || '') : ''
})

const cnpjEmpresaGlobal = computed(() => {
  if (!empresaSelecionadaAtiva.value) return ''
  const empresa = empresas.value.find(e => e.id == empresaSelecionadaAtiva.value)
  return empresa ? (empresa.cnpj || '') : ''
})

const isVoucherSelecionado = computed(() => {
  return operadoraSelecionada.value === 'alelo' ||
    operadoraSelecionada.value === 'ticket' ||
    operadoraSelecionada.value === 'vr' ||
    operadoraSelecionada.value === 'pluxe' ||
    operadoraSelecionada.value === 'pluxee' ||
    operadoraSelecionada.value === 'sodexo' ||
    operadoraSelecionada.value === 'comprocard' ||
    operadoraSelecionada.value === 'lecard' ||
    operadoraSelecionada.value === 'upbrasil'
})

const isVrPersistenciaPadrao = computed(() => operadoraSelecionada.value === 'vr')

const isRedeSelected = computed(() => operadoraSelecionada.value === 'rede')
const isVrSelected = computed(() => Object.prototype.hasOwnProperty.call(OPERADORAS_ARQUIVO_SERVIDOR, operadoraSelecionada.value || ''))
const isSafraSelected = computed(() => operadoraSelecionada.value === 'safra')
const isVrLegadoSelected = computed(() => operadoraSelecionada.value === 'vr')

const mostrarImportacaoApiRede = computed(() => {
  return isRedeSelected.value && modoImportacaoRede.value === 'api'
})

const mostrarImportacaoApiVr = computed(() => {
  return isVrSelected.value && modoImportacaoVr.value === 'api'
})

const operadoraArquivoServidorAtual = computed(() => {
  return OPERADORAS_ARQUIVO_SERVIDOR[operadoraSelecionada.value] || OPERADORAS_ARQUIVO_SERVIDOR.vr
})

const carregandoArquivosArquivoServidorAtual = computed(() => {
  return isVrLegadoSelected.value ? carregandoArquivosVr.value : carregandoArquivosVoucherTxt.value
})

const carregandoImportacaoArquivoServidorAtual = computed(() => {
  return isVrLegadoSelected.value ? carregandoImportacaoApiVr.value : carregandoImportacaoApiVoucherTxt.value
})

const erroImportacaoArquivoServidorAtual = computed(() => {
  return isVrLegadoSelected.value ? erroImportacaoApiVr.value : erroImportacaoApiVoucherTxt.value
})

const arquivosDisponiveisArquivoServidorFiltrados = computed(() => {
  const cnpjDigits = String(cnpjEmpresaGlobal.value || '').replace(/\D/g, '')
  const cnpj = operadoraSelecionada.value === 'alelo' && cnpjDigits
    ? cnpjDigits.padStart(14, '0')
    : cnpjDigits
  const dataInicial = String(filtrosGlobais.dataInicial || '').replace(/-/g, '')
  const dataFinal = String(filtrosGlobais.dataFinal || '').replace(/-/g, '')
  const source = isVrLegadoSelected.value ? arquivosDisponiveisVr.value : arquivosDisponiveisVoucherTxt.value

  return (source || []).filter((item) => {
    const fileName = String(item?.fileName || '')
    const cnpjFolder = String(item?.cnpjFolder || '').replace(/\D/g, '')
    const originalStem = String(item?.originalStem || '')
    const referenceDate = String(item?.referenceDate || '')

    if (operadoraSelecionada.value !== 'alelo' && !fileName.toLowerCase().endsWith('.txt')) return false
    if (cnpj && cnpjFolder && cnpjFolder !== cnpj) return false
    if (cnpj && !cnpjFolder && !originalStem.includes(cnpj)) return false
    if (dataInicial && referenceDate && referenceDate < dataInicial) return false
    if (dataFinal && referenceDate && referenceDate > dataFinal) return false
    if ((dataInicial || dataFinal) && !referenceDate) return false
    return true
  })
})

const mostrarSeletorModeloArquivoSafra = computed(() => {
  return isSafraSelected.value
})

const mostrarSeletorTipoArquivoSafra = computed(() => {
  return isSafraSelected.value && modeloArquivoSafra.value === 'novo'
})

const mostrarUploadArquivo = computed(() => {
  if (isRedeSelected.value) return modoImportacaoRede.value !== 'api'
  if (isVrSelected.value) return modoImportacaoVr.value !== 'api'
  if (isSafraSelected.value) {
    if (!modeloArquivoSafra.value) return false
    if (modeloArquivoSafra.value === 'novo') return !!tipoArquivoSafra.value
    return true
  }
  return true
})

const recebimentosPendentesEnvio = computed(() => {
  return recebimentosStatus.value.filter(r => r.status_envio === 'pendente_envio')
})

const fecharConfirmacaoEnvio = () => {
  confirmacaoEnvioAberta.value = false
  nomeTabelaConfirmacao.value = ''
  resetarVerificacaoTabela()
}

const abrirConfirmacaoEnvio = async () => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  if (!operadoraSelecionada.value) {
    alert('Selecione uma operadora primeiro!')
    return
  }
  if (!cruzamentoExecutado.value) {
    alert('Execute o cruzamento com o Supabase antes de finalizar a importação.')
    return
  }
  if (recebimentosPendentesEnvio.value.length === 0) {
    alert('Não há recebimentos pendentes para envio.')
    return
  }

  const construirTabela = isVoucherSelecionado.value && !isVrPersistenciaPadrao.value
    ? construirNomeTabelaRecebimentosVouchers
    : construirNomeTabelaRecebimentos

  nomeTabelaConfirmacao.value = construirTabela(
    nomeEmpresaGlobal.value,
    operadoraSelecionada.value
  )
  confirmacaoEnvioAberta.value = true
  await verificarTabelaExiste(nomeTabelaConfirmacao.value)
}

const aplicarEmpresaEcSelecionada = (registros = []) => {
  const empresa = nomeEmpresaGlobal.value || ''
  const ecSelecionada = ecEmpresaGlobal.value || ''
  const tipoUnidade = tipoUnidadeGlobal.value || 'Matriz'
  return (registros || []).map((r) => ({
    ...r,
    empresa: r.empresa || empresa,
    matriz: ecSelecionada,
    _tipo_unidade_importacao: tipoUnidade
  }))
}

watch(filtrosGlobais, () => {}, { deep: true })

onMounted(async () => {
  if (empresas.value.length === 0) {
    await fetchEmpresas()
  }
})

const resetarEstadoTela = () => {
  fecharConfirmacaoEnvio()
  arquivo.value = null
  recebimentosProcessados.value = []
  recebimentosStatus.value = []
  cruzamentoExecutado.value = false
  status.value = 'idle'
  mensagemErro.value = ''
  limparImportacaoApiRede()
  erroImportacaoApiVr.value = ''
  erroImportacaoApiVoucherTxt.value = ''
}

watch(empresaSelecionadaGlobal, (novaEmpresa) => {
  if (!novaEmpresa) {
    operadoraSelecionada.value = null
    modoImportacaoRede.value = 'manual'
    modoImportacaoVr.value = 'manual'
    modeloArquivoSafra.value = ''
    tipoArquivoSafra.value = ''
    resetarEstadoTela()
  }
})

const dbg = (...args) => console.log('🟩 [RECEBIMENTOS:PAGE]', ...args)

const handleOperadoraSelect = (operadoraId) => {
  dbg('Operadora selecionada', operadoraId)
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  operadoraSelecionada.value = operadoraId
  modoImportacaoRede.value = operadoraId === 'rede' ? modoImportacaoRede.value : 'manual'
  modoImportacaoVr.value = operadoraId === 'vr' ? modoImportacaoVr.value : 'manual'
  modeloArquivoSafra.value = operadoraId === 'safra' ? '' : ''
  tipoArquivoSafra.value = operadoraId === 'safra' ? '' : ''
  resetarEstadoTela()
}

const handleModoImportacaoRede = (modo) => {
  modoImportacaoRede.value = modo === 'api' ? 'api' : 'manual'
  resetarEstadoTela()
}

const handleModoImportacaoVr = async (modo) => {
  modoImportacaoVr.value = modo === 'api' ? 'api' : 'manual'
  resetarEstadoTela()

  if (modoImportacaoVr.value === 'api') {
    if (isVrLegadoSelected.value) {
      await carregarArquivosDisponiveisVr({
        cnpj: cnpjEmpresaGlobal.value,
        dataInicial: filtrosGlobais.dataInicial,
        dataFinal: filtrosGlobais.dataFinal
      })
    } else if (isVrSelected.value) {
      await carregarArquivosDisponiveisVoucherTxt(operadoraSelecionada.value, {
        empresaNome: nomeEmpresaGlobal.value,
        ec: ecEmpresaGlobal.value,
        cnpj: cnpjEmpresaGlobal.value,
        dataInicial: filtrosGlobais.dataInicial,
        dataFinal: filtrosGlobais.dataFinal
      })
    }
  }
}

const handleModeloArquivoSafra = (modelo) => {
  modeloArquivoSafra.value = modelo === 'novo' ? 'novo' : 'antigo'
  tipoArquivoSafra.value = modeloArquivoSafra.value === 'novo' ? '' : 'recebimento'
  resetarEstadoTela()
}

const handleTipoArquivoSafra = (tipo) => {
  tipoArquivoSafra.value = tipo === 'ajustes' ? 'ajustes' : 'recebimento'
  resetarEstadoTela()
}

const handleArquivoSelecionado = async (file) => {
  dbg('Arquivo selecionado', { name: file?.name, size: file?.size })
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  arquivo.value = file
  status.value = 'processando'
  await nextTick()
  await processarArquivo()
}

const handleArquivoRemovido = () => {
  resetarEstadoTela()
}

const handleImportacaoAutomaticaRedeRecebimentos = async () => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }

  if (!isRedeSelected.value) {
    alert('A importacao via API esta disponivel apenas para a Rede.')
    return
  }

  resetarEstadoTela()
  status.value = 'processando'

  try {
    const resultado = await importarRecebimentos({
      nomeEmpresa: nomeEmpresaGlobal.value,
      ecEmpresa: ecEmpresaGlobal.value,
      dataInicial: filtrosGlobais.dataInicial,
      dataFinal: filtrosGlobais.dataFinal
    })

    if (!resultado.registros || resultado.registros.length === 0) {
      throw new Error('A API da Rede respondeu sem recebimentos para o periodo selecionado.')
    }

    recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
    status.value = 'sucesso'
  } catch (error) {
    status.value = 'erro'
    mensagemErro.value = error.message
  }
}

const handleAtualizarArquivosVr = async () => {
  if (isVrLegadoSelected.value) {
    await carregarArquivosDisponiveisVr({
      cnpj: cnpjEmpresaGlobal.value,
      dataInicial: filtrosGlobais.dataInicial,
      dataFinal: filtrosGlobais.dataFinal
    })
    return
  }

  await carregarArquivosDisponiveisVoucherTxt(operadoraSelecionada.value, {
    empresaNome: nomeEmpresaGlobal.value,
    ec: ecEmpresaGlobal.value,
    cnpj: cnpjEmpresaGlobal.value,
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  })
}

const handleImportacaoAutomaticaVrRecebimentos = async () => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }

  if (!isVrSelected.value) {
    alert('A importacao via API nao esta disponivel para a operadora atual nesta tela.')
    return
  }

  resetarEstadoTela()
  status.value = 'processando'

  try {
    const payload = {
      empresa: nomeEmpresaGlobal.value,
      ec: ecEmpresaGlobal.value,
      cnpj: cnpjEmpresaGlobal.value,
      dataInicial: filtrosGlobais.dataInicial,
      dataFinal: filtrosGlobais.dataFinal
    }

    const resultado = isVrLegadoSelected.value
      ? await importarRecebimentosVr(payload)
      : await importarRecebimentosVoucherTxt(operadoraSelecionada.value, payload)

    if (!Array.isArray(resultado?.registros) || resultado.registros.length === 0) {
      throw new Error(`Os arquivos selecionados da ${operadoraArquivoServidorAtual.value.label} nao retornaram recebimentos para importar.`)
    }

    recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
    status.value = 'sucesso'
    await handleAtualizarArquivosVr()
  } catch (error) {
    status.value = 'erro'
    mensagemErro.value = error.message
  }
}

const processarArquivo = async () => {
  dbg('processarArquivo:start', { 
    hasArquivo: !!arquivo.value, 
    operadora: operadoraSelecionada.value, 
    empresaId: empresaSelecionadaAtiva.value 
  })
  if (!arquivo.value || !operadoraSelecionada.value || !empresaSelecionadaGlobal.value) return
  status.value = 'processando'
  recebimentosStatus.value = []
  cruzamentoExecutado.value = false

  try {
    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }

    let resultado

    if (operadoraSelecionada.value === 'alelo' || operadoraSelecionada.value === 'comprocard') {
      const { processarArquivo } = await obterProcessadorRecebimentos(operadoraSelecionada.value)
      resultado = await processarArquivo(
        arquivo.value,
        operadoraSelecionada.value,
        nomeEmpresaGlobal.value,
        ecEmpresaGlobal.value
      )
    } else {
      const { processarArquivoComPython } = await obterProcessadorRecebimentos(operadoraSelecionada.value)
      const opcoesProcessamento = operadoraSelecionada.value === 'safra'
        ? {
            modeloArquivo: modeloArquivoSafra.value,
            tipoArquivo: tipoArquivoSafra.value || 'recebimento'
          }
        : undefined

      resultado = await processarArquivoComPython(
        arquivo.value,
        operadoraSelecionada.value,
        nomeEmpresaGlobal.value,
        opcoesProcessamento
      )
    }

    dbg('processarArquivo:resultado', {
      sucesso: resultado?.sucesso,
      total: resultado?.total,
      erros: (resultado?.erros || []).slice(0, 5)
    })

    if (resultado?.sucesso && Array.isArray(resultado?.registros) && resultado.registros.length > 0) {
      recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
      dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
      status.value = 'sucesso'
    } else {
      throw new Error(resultado?.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
    }
  } catch (error) {
    dbg('processarArquivo:erro', error)
    status.value = 'erro'
    mensagemErro.value = error.message
  }
}

const enviarParaSupabase = async () => {
  dbg('enviarParaSupabase:start', { 
    total: recebimentosProcessados.value.length, 
    empresa: nomeEmpresaGlobal.value, 
    operadora: operadoraSelecionada.value 
  })
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  if (!operadoraSelecionada.value) {
    alert('Selecione uma operadora primeiro!')
    return
  }
  if (!cruzamentoExecutado.value) {
    alert('Execute o cruzamento com o Supabase antes de finalizar a importação.')
    return
  }

  const recebimentosParaEnviar = recebimentosPendentesEnvio.value
  if (recebimentosParaEnviar.length === 0) {
    alert('Não há recebimentos pendentes para envio.')
    return
  }

  enviando.value = true

  try {
    const enviarFn = isVoucherSelecionado.value && !isVrPersistenciaPadrao.value
      ? enviarRecebimentosParaSupabaseVouchers
      : enviarRecebimentosParaSupabasePadrao

    await enviarFn(
      recebimentosParaEnviar,
      nomeEmpresaGlobal.value,
      operadoraSelecionada.value
    )

    const chavesEnviadas = new Set(
      recebimentosParaEnviar.map(r =>
        `${r.nsu}|${r.data_venda}|${r.data_recebimento || r.data_pgto || ''}|${r.valor_bruto}|${r.modalidade || ''}`
      )
    )
    recebimentosStatus.value = recebimentosStatus.value.map(r => {
      const chave = `${r.nsu}|${r.data_venda}|${r.data_recebimento || r.data_pgto || ''}|${r.valor_bruto}|${r.modalidade || ''}`
      if (r.status_envio === 'pendente_envio' && chavesEnviadas.has(chave)) {
        return { ...r, status_envio: 'enviada', motivo_status: 'Enviado com sucesso' }
      }
      return r
    })
    fecharConfirmacaoEnvio()
    alert(`Envio concluído! ${recebimentosParaEnviar.length} recebimentos enviados.`)
  } catch (error) {
    alert('Erro ao enviar recebimentos: ' + error.message)
  } finally {
    enviando.value = false
  }
}

const executarCruzamento = async () => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  if (!operadoraSelecionada.value) {
    alert('Selecione uma operadora primeiro!')
    return
  }
  if (!recebimentosProcessados.value.length) {
    alert('Não há recebimentos processados para cruzar.')
    return
  }
  try {
    const { recebimentosStatus: statusRecebimentos } = await cruzarRecebimentosComSupabase(
      recebimentosProcessados.value,
      nomeEmpresaGlobal.value,
      operadoraSelecionada.value,
      { tipoUnidade: tipoUnidadeGlobal.value }
    )
    recebimentosStatus.value = statusRecebimentos
    cruzamentoExecutado.value = true
  } catch (error) {
    alert('Erro no cruzamento com Supabase: ' + error.message)
  }
}
</script>
