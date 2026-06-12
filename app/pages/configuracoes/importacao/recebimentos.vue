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
import { useRecebimentosOperadoraUnica } from '~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_unica_operadora'
import { useRecebimentosOperadoraStone } from '~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_stone_operadora'
import { useRecebimentosOperadoraSafra } from '~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_safra_operadora'
import { useRecebimentosOperadoraRede } from '~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_rede_operadora'
import { useRecebimentosOperadoraCielo } from '~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_cielo_operadora'
import { useRecebimentosOperadoraGetnet } from '~/composables/configuracoes/importacao/processor_recebimentos_operadoras/recebimento_getnet_operadora'
import { useProcessorRecebimentoVoucherAlelo } from '~/composables/configuracoes/importacao/processor_recebimentos_vouchers/recebimento_voucher_alelo'
import { useProcessorRecebimentoVoucherComprocard } from '~/composables/configuracoes/importacao/processor_recebimentos_vouchers/recebimento_voucher_comprocard'
import { useEnvioRecebimentos } from '~/composables/configuracoes/importacao/Envio_recebimentos/useEnvioRecebimentos'
import { useEnvioRecebimentosVouchers } from '~/composables/configuracoes/importacao/Envio_recebimentos/UseEnvioRecebimentosVouchers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'
import { useImportacaoAutomaticaRede_recebimentos } from '~/composables/configuracoes/importacao/processor_recebimentos_automaticos/rede/useImportacaoAutomaticaRede_recebimentos'

// Usa os componentes de RECEBIMENTOS
import SeletorOperadora from '~/components/configuracoes/importacao/importacao_recebimentos/SeletorOperadora.vue'
import SeletorModoImportacaoRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/SeletorModoImportacaoRecebimentos.vue'
import UploadArquivo from '~/components/configuracoes/importacao/importacao_recebimentos/UploadArquivo.vue'
import ImportacaoAutomaticaRedeRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/ImportacaoAutomaticaRedeRecebimentos.vue'
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

const { processarArquivoComPython: processarUnica } = useRecebimentosOperadoraUnica()
const { processarArquivoComPython: processarStone } = useRecebimentosOperadoraStone()
const { processarArquivoComPython: processarSafra } = useRecebimentosOperadoraSafra()
const { processarArquivoComPython: processarRede } = useRecebimentosOperadoraRede()
const { processarArquivoComPython: processarCielo } = useRecebimentosOperadoraCielo()
const { processarArquivoComPython: processarGetnet } = useRecebimentosOperadoraGetnet()
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
const confirmacaoEnvioAberta = ref(false)
const nomeTabelaConfirmacao = ref('')

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

const isRedeSelected = computed(() => operadoraSelecionada.value === 'rede')

const mostrarImportacaoApiRede = computed(() => {
  return isRedeSelected.value && modoImportacaoRede.value === 'api'
})

const mostrarUploadArquivo = computed(() => {
  return !isRedeSelected.value || modoImportacaoRede.value !== 'api'
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

  const construirTabela = isVoucherSelecionado.value
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
  return (registros || []).map((r) => ({
    ...r,
    empresa: r.empresa || empresa,
    matriz: ecSelecionada
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
}

watch(empresaSelecionadaGlobal, (novaEmpresa) => {
  if (!novaEmpresa) {
    operadoraSelecionada.value = null
    modoImportacaoRede.value = 'manual'
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
  resetarEstadoTela()
}

const handleModoImportacaoRede = (modo) => {
  modoImportacaoRede.value = modo === 'api' ? 'api' : 'manual'
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
    if (operadoraSelecionada.value === 'alelo') {
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }
      const { processarArquivo } = useProcessorRecebimentoVoucherAlelo()
      const resultado = await processarArquivo(
        arquivo.value,
        operadoraSelecionada.value,
        nomeEmpresaGlobal.value,
        ecEmpresaGlobal.value
      )
      dbg('processarArquivo:resultado', { sucesso: resultado?.sucesso, total: resultado?.total, erros: (resultado?.erros || []).slice(0, 5) })
      if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
        recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
        dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
        status.value = 'sucesso'
        return
      } else {
        throw new Error(resultado.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
      }
    }
    if (operadoraSelecionada.value === 'comprocard') {
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }
      const { processarArquivo } = useProcessorRecebimentoVoucherComprocard()
      const resultado = await processarArquivo(
        arquivo.value,
        operadoraSelecionada.value,
        nomeEmpresaGlobal.value,
        ecEmpresaGlobal.value
      )
      dbg('processarArquivo:resultado', { sucesso: resultado?.sucesso, total: resultado?.total, erros: (resultado?.erros || []).slice(0, 5) })
      if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
        recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
        dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
        status.value = 'sucesso'
        return
      } else {
        throw new Error(resultado.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
      }
    }
    if (operadoraSelecionada.value === 'unica') {
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }

      const resultado = await processarUnica(
        arquivo.value, 
        operadoraSelecionada.value,
        nomeEmpresaGlobal.value
      )

      dbg('processarArquivo:resultado', { 
        sucesso: resultado?.sucesso, 
        total: resultado?.total, 
        erros: (resultado?.erros || []).slice(0, 5) 
      })
      if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
        recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
        dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
        status.value = 'sucesso'
      } else {
        throw new Error(resultado.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
      }
    } else if (operadoraSelecionada.value === 'stone') {
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }

      const resultado = await processarStone(
        arquivo.value,
        operadoraSelecionada.value,
        nomeEmpresaGlobal.value
      )

      dbg('processarArquivo:resultado', { 
        sucesso: resultado?.sucesso, 
        total: resultado?.total, 
        erros: (resultado?.erros || []).slice(0, 5) 
      })
      if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
        recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
        dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
        status.value = 'sucesso'
      } else {
        throw new Error(resultado.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
      }
    } else {
      if (operadoraSelecionada.value === 'safra') {
        if (!empresas.value || empresas.value.length === 0) {
          await fetchEmpresas()
        }
        const resultado = await processarSafra(
          arquivo.value,
          operadoraSelecionada.value,
          nomeEmpresaGlobal.value
        )
        dbg('processarArquivo:resultado', { sucesso: resultado?.sucesso, total: resultado?.total, erros: (resultado?.erros || []).slice(0, 5) })
        if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
          recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
          dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
          status.value = 'sucesso'
        } else {
          throw new Error(resultado.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
        }
      } else if (operadoraSelecionada.value === 'rede') {
        if (!empresas.value || empresas.value.length === 0) {
          await fetchEmpresas()
        }
        const resultado = await processarRede(
          arquivo.value,
          operadoraSelecionada.value,
          nomeEmpresaGlobal.value
        )
        dbg('processarArquivo:resultado', { sucesso: resultado?.sucesso, total: resultado?.total, erros: (resultado?.erros || []).slice(0, 5) })
        if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
          recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
          dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
          status.value = 'sucesso'
        } else {
          throw new Error(resultado.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
        }
      } else if (operadoraSelecionada.value === 'cielo') {
        if (!empresas.value || empresas.value.length === 0) {
          await fetchEmpresas()
        }
        const resultado = await processarCielo(
          arquivo.value,
          operadoraSelecionada.value,
          nomeEmpresaGlobal.value
        )
        dbg('processarArquivo:resultado', { sucesso: resultado?.sucesso, total: resultado?.total, erros: (resultado?.erros || []).slice(0, 5) })
        if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
          recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
          dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
          status.value = 'sucesso'
        } else {
          throw new Error(resultado.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
        }
      } else if (operadoraSelecionada.value === 'getnet') {
        if (!empresas.value || empresas.value.length === 0) {
          await fetchEmpresas()
        }
        const resultado = await processarGetnet(
          arquivo.value,
          operadoraSelecionada.value,
          nomeEmpresaGlobal.value
        )
        dbg('processarArquivo:resultado', { sucesso: resultado?.sucesso, total: resultado?.total, erros: (resultado?.erros || []).slice(0, 5) })
        if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
          recebimentosProcessados.value = aplicarEmpresaEcSelecionada(resultado.registros)
          dbg('processarArquivo:set', { len: recebimentosProcessados.value.length, sample: recebimentosProcessados.value.slice(0, 2) })
          status.value = 'sucesso'
        } else {
          throw new Error(resultado.erro || 'Nenhum recebimento válido foi encontrado no arquivo')
        }
      } else {
        throw new Error(`Processador para operadora ${operadoraSelecionada.value} ainda não implementado`)
      }
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
    const enviarFn = isVoucherSelecionado.value ? enviarRecebimentosParaSupabaseVouchers : enviarRecebimentosParaSupabasePadrao

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
      operadoraSelecionada.value
    )
    recebimentosStatus.value = statusRecebimentos
    cruzamentoExecutado.value = true
  } catch (error) {
    alert('Erro no cruzamento com Supabase: ' + error.message)
  }
}
</script>
