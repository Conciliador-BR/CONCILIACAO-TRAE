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
      :total-recebimentos="recebimentosProcessados.length"
      :mensagem-erro="mensagemErro"
    />

    <TabelaRecebimentosVouchers v-if="operadoraSelecionada === 'alelo' || operadoraSelecionada === 'ticket' || operadoraSelecionada === 'vr' || operadoraSelecionada === 'pluxe' || operadoraSelecionada === 'pluxee' || operadoraSelecionada === 'sodexo' || operadoraSelecionada === 'comprocard' || operadoraSelecionada === 'lecard' || operadoraSelecionada === 'upbrasil'" :recebimentos="recebimentosProcessados" />
    <TabelaRecebimentos v-else :recebimentos="recebimentosProcessados" />

    <BotaoEnviarSupabase 
      :recebimentos="recebimentosProcessados"
      :enviando="enviando"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @enviar-recebimentos="enviarParaSupabase"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRecebimentosOperadoraUnica } from '~/composables/importacao/processor_recebimentos_operadoras/recebimento_unica_operadora'
import { useRecebimentosOperadoraStone } from '~/composables/importacao/processor_recebimentos_operadoras/recebimento_stone_operadora'
import { useRecebimentosOperadoraSafra } from '~/composables/importacao/processor_recebimentos_operadoras/recebimento_safra_operadora'
import { useRecebimentosOperadoraRede } from '~/composables/importacao/processor_recebimentos_operadoras/recebimento_rede_operadora'
import { useRecebimentosOperadoraCielo } from '~/composables/importacao/processor_recebimentos_operadoras/recebimento_cielo_operadora'
import { useRecebimentosOperadoraGetnet } from '~/composables/importacao/processor_recebimentos_operadoras/recebimento_getnet_operadora'
import { useProcessorRecebimentoVoucherAlelo } from '~/composables/importacao/processor_recebimentos_vouchers/recebimento_voucher_alelo'
import { useProcessorRecebimentoVoucherComprocard } from '~/composables/importacao/processor_recebimentos_vouchers/recebimento_voucher_comprocard'
import { useEnvioRecebimentos } from '~/composables/importacao/Envio_recebimentos/useEnvioRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'

// Usa os componentes de RECEBIMENTOS
import SeletorOperadora from '~/components/importacao/importacao_recebimentos/SeletorOperadora.vue'
import UploadArquivo from '~/components/importacao/importacao_recebimentos/UploadArquivo.vue'
import StatusProcessamento from '~/components/importacao/importacao_recebimentos/StatusProcessamento.vue'
import TabelaRecebimentos from '~/components/importacao/importacao_recebimentos/TabelaRecebimentos.vue'
import TabelaRecebimentosVouchers from '~/components/importacao/importacao_recebimentos/TabelaRecebimentosVouchers.vue'
import BotaoEnviarSupabase from '~/components/importacao/importacao_recebimentos/BotaoEnviarSupabase.vue'

const operadoraSelecionada = ref(null)
const arquivo = ref(null)
const recebimentosProcessados = ref([])
const status = ref('idle')
const mensagemErro = ref('')
const enviando = ref(false)

const { processarArquivoComPython: processarUnica } = useRecebimentosOperadoraUnica()
const { processarArquivoComPython: processarStone } = useRecebimentosOperadoraStone()
const { processarArquivoComPython: processarSafra } = useRecebimentosOperadoraSafra()
const { processarArquivoComPython: processarRede } = useRecebimentosOperadoraRede()
const { processarArquivoComPython: processarCielo } = useRecebimentosOperadoraCielo()
const { processarArquivoComPython: processarGetnet } = useRecebimentosOperadoraGetnet()
// REMOVER: const { enviarVendasParaSupabase } = useImportacao()
const { enviarRecebimentosParaSupabase } = useEnvioRecebimentos()
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

const ecEmpresaGlobal = computed(() => {
  if (!filtrosGlobais.empresaSelecionada) return ''
  const empresa = empresas.value.find(e => e.id == filtrosGlobais.empresaSelecionada)
  return empresa ? (empresa.matriz || '') : ''
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
    recebimentosProcessados.value = []
    status.value = 'idle'
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
  arquivo.value = null
  recebimentosProcessados.value = []
  status.value = 'idle'
}

const handleArquivoSelecionado = async (file) => {
  dbg('Arquivo selecionado', { name: file?.name, size: file?.size })
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  arquivo.value = file
  await processarArquivo()
}

const handleArquivoRemovido = () => {
  arquivo.value = null
  recebimentosProcessados.value = []
  status.value = 'idle'
  mensagemErro.value = ''
}

const processarArquivo = async () => {
  dbg('processarArquivo:start', { 
    hasArquivo: !!arquivo.value, 
    operadora: operadoraSelecionada.value, 
    empresaId: filtrosGlobais.empresaSelecionada 
  })
  if (!arquivo.value || !operadoraSelecionada.value || !empresaSelecionadaGlobal.value) return
  status.value = 'processando'

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
        recebimentosProcessados.value = resultado.registros
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
        recebimentosProcessados.value = resultado.registros
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
        recebimentosProcessados.value = resultado.registros
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
        recebimentosProcessados.value = resultado.registros
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
          recebimentosProcessados.value = resultado.registros
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
          recebimentosProcessados.value = resultado.registros
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
          recebimentosProcessados.value = resultado.registros
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
          recebimentosProcessados.value = resultado.registros
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
  enviando.value = true

  try {
    await enviarRecebimentosParaSupabase(
      recebimentosProcessados.value, 
      nomeEmpresaGlobal.value,
      operadoraSelecionada.value
    )
    alert('Recebimentos enviados com sucesso!')
    arquivo.value = null
    recebimentosProcessados.value = []
    status.value = 'idle'
    operadoraSelecionada.value = null
  } catch (error) {
    alert('Erro ao enviar recebimentos: ' + error.message)
  } finally {
    enviando.value = false
  }
}
</script>
