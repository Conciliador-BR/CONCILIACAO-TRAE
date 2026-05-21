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
      :adquirente="operadoraSelecionada"
    />
    <TabelaVendasVoucher 
      v-else-if="(['pluxe','pluxee'].includes(operadoraSelecionada)) && status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
      :adquirente="operadoraSelecionada"
    />
    <TabelaVendasVoucher 
      v-else-if="operadoraSelecionada === 'ticket' && status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
      :adquirente="operadoraSelecionada"
    />
    <TabelaVendasVoucher 
      v-else-if="operadoraSelecionada === 'vr' && status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
      :adquirente="operadoraSelecionada"
    />
    <TabelaVendasVoucher 
      v-else-if="operadoraSelecionada === 'comprocard' && status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
      :adquirente="operadoraSelecionada"
    />
    <TabelaVendasVoucher 
      v-else-if="operadoraSelecionada === 'lecard' && status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
      :adquirente="operadoraSelecionada"
    />
    <TabelaVendasVoucher 
      v-else-if="operadoraSelecionada === 'upbrasil' && status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
      :adquirente="operadoraSelecionada"
    />
    <TabelaVendas 
      v-else-if="status === 'sucesso' && vendasProcessadas.length > 0" 
      :vendas="vendasProcessadas" 
      :adquirente="operadoraSelecionada"
    />

    <TabelaStatusVendas
      :vendas="vendasProcessadas"
      :vendas-status="vendasStatus"
      :cruzamento-executado="cruzamentoExecutado"
      :cruzando="cruzando"
      @executar-cruzamento="executarCruzamento"
    />

    <BotaoEnviarSupabase
      v-if="cruzamentoExecutado"
      :vendas="vendasPendentesEnvio"
      :enviando="enviando"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @enviar-vendas="enviarParaSupabase"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useVendasOperadoraUnica } from '~/composables/configuracoes/importacao/Processor_vendas_operadoras/vendas_operadora_unica'
import { useVendasOperadoraStone } from '~/composables/configuracoes/importacao/Processor_vendas_operadoras/vendas_operadora_stone'
import { useVendasOperadoraSafra } from '~/composables/configuracoes/importacao/Processor_vendas_operadoras/vendas_operadora_safra'
import { useVendasOperadoraRede } from '~/composables/configuracoes/importacao/Processor_vendas_operadoras/vendas_operadora_rede'
import { useVendasOperadoraCielo } from '~/composables/configuracoes/importacao/Processor_vendas_operadoras/vendas_operadora_cielo'
import { useVendasOperadoraGetnet } from '~/composables/configuracoes/importacao/Processor_vendas_operadoras/vendas_operadora_getnet'
import { useImportacao } from '~/composables/configuracoes/importacao/Envio_vendas/useImportacao'
import { useProcessorVendasVoucherAlelo } from '~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_alelo.js'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useProcessorVendasVoucherPluxee } from '~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_pluxee.js'
import { useProcessorVendasVoucherTicket } from '~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_ticket.js'
import { useEmpresas } from '~/composables/useEmpresas'
import { useProcessorVendasVoucherVR } from '~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_vr.js'
import { useProcessorVendasVoucherComprocard } from '~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_comprocard.js'
import { useProcessorVendasVoucherLecard } from '~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_lecard.js'
import { useProcessorVendasVoucherUpBrasil } from '~/composables/configuracoes/importacao/procesor_vendas_vouchers/vendas_voucher_upbrasil.js'

import SeletorOperadora from '~/components/configuracoes/importacao/importacao_vendas/SeletorOperadora.vue'
import UploadArquivo from '~/components/configuracoes/importacao/importacao_vendas/UploadArquivo.vue'
import StatusProcessamento from '~/components/configuracoes/importacao/importacao_vendas/StatusProcessamento.vue'
import TabelaVendas from '~/components/configuracoes/importacao/importacao_vendas/TabelaVendas.vue'
import TabelaVendasVoucher from '~/components/configuracoes/importacao/importacao_vendas/TabelaVendasVoucher.vue'
import BotaoEnviarSupabase from '~/components/configuracoes/importacao/importacao_vendas/BotaoEnviarSupabase.vue'
import TabelaStatusVendas from '~/components/configuracoes/importacao/importacao_vendas/TabelaStatusVendas.vue'
import { useCruzamentoVendasSupabase } from '~/composables/configuracoes/importacao/Envio_vendas/useCruzamentoVendasSupabase'

const operadoraSelecionada = ref(null)
const arquivo = ref(null)
const vendasProcessadas = ref([])
const status = ref('idle')
const mensagemErro = ref('')
const enviando = ref(false)
const vendasStatus = ref([])
const cruzamentoExecutado = ref(false)

const { processarArquivoComPython: processarArquivoUnica } = useVendasOperadoraUnica()
const { processarArquivoComPython: processarArquivoStone } = useVendasOperadoraStone()
const { processarArquivoComPython: processarArquivoSafra } = useVendasOperadoraSafra()
const { processarArquivoComPython: processarArquivoRede } = useVendasOperadoraRede()
const { processarArquivoComPython: processarArquivoCielo } = useVendasOperadoraCielo()
const { processarArquivoComPython: processarArquivoGetnet } = useVendasOperadoraGetnet()
const { enviarVendasParaSupabase } = useImportacao()
const { cruzando, cruzarVendasComSupabase } = useCruzamentoVendasSupabase()
const { filtrosGlobais } = useGlobalFilters()
const { empresas, empresaSelecionada: empresaSelecionadaAtiva, fetchEmpresas } = useEmpresas()

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

const vendasPendentesEnvio = computed(() => {
  return vendasStatus.value.filter(v => v.status_envio === 'pendente_envio')
})

const ecEmpresaGlobal = computed(() => {
  if (!empresaSelecionadaAtiva.value) return ''
  const empresa = empresas.value.find(e => e.id == empresaSelecionadaAtiva.value)
  return empresa ? (empresa.matriz || '') : ''
})

const normalizarEc = (valor) => String(valor ?? '').replace(/[^\d]/g, '')
const parseNumero = (valor) => {
  const n = Number(valor ?? 0)
  return Number.isFinite(n) ? n : 0
}

const normalizarTexto = (valor) => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase()

const isLinhaAluguelMaquina = (item = {}) => {
  const texto = normalizarTexto([
    item?.modalidade,
    item?.bandeira,
    item?.tipo_lancamento,
    item?.lancamento,
    item?.descricao,
    item?.observacoes,
    item?.motivo
  ].filter(Boolean).join(' '))

  const hasAluguel = (
    texto.includes('ALUGUEL') ||
    texto.includes('DESPESA DE ALUGUEL') ||
    texto.includes('ALUGUEL DE MAQUINA')
  )
  const hasMensalidadePinpad = (
    (texto.includes('MENSALIDADE') && (texto.includes('PINPAD') || texto.includes('PIN PAD'))) ||
    texto.includes('MENSALIDADE PIN PAD') ||
    texto.includes('MENSALIDADE PINPAD')
  )
  const hasAjusteMensalidade = (
    texto.includes('AJUSTES/MENSALIDADE PINPAD') ||
    (texto.includes('AJUSTES') && hasMensalidadePinpad)
  )

  return hasAluguel || hasMensalidadePinpad || hasAjusteMensalidade
}

const normalizarAluguelEmDespesaMdr = (registros = []) => {
  return (registros || []).map((item) => {
    if (!isLinhaAluguelMaquina(item)) return item

    const brutoAbs = Math.abs(parseNumero(item?.valor_bruto))
    const liquidoAbs = Math.abs(parseNumero(item?.valor_liquido))
    const mdrAbs = Math.abs(parseNumero(item?.despesa_mdr))
    const antecipacaoAbs = Math.abs(parseNumero(item?.despesa_antecipacao))
    const fallbackAbs = Math.abs(brutoAbs - liquidoAbs)
    const despesaAluguel = mdrAbs || brutoAbs || liquidoAbs || antecipacaoAbs || fallbackAbs

    return {
      ...item,
      valor_bruto: 0,
      valor_liquido: 0,
      taxa_mdr: 0,
      despesa_mdr: despesaAluguel,
      valor_antecipacao: 0,
      despesa_antecipacao: 0,
      valor_liquido_antecipacao: 0
    }
  })
}

const aplicarContextoEmpresaNosRegistros = (registros = []) => {
  const empresaAtual = String(nomeEmpresaGlobal.value || '').trim()
  const ecAtual = normalizarEc(ecEmpresaGlobal.value)
  return (registros || []).map((item) => {
    const matrizItem = normalizarEc(item?.matriz)
    const ecItem = normalizarEc(item?.ec)
    return {
      ...item,
      empresa: empresaAtual || item?.empresa || '',
      matriz: ecAtual || matrizItem || ecItem || '',
      ec: ecAtual || ecItem || matrizItem || ''
    }
  })
}

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
  vendasStatus.value = []
  cruzamentoExecutado.value = false
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
  vendasStatus.value = []
  cruzamentoExecutado.value = false
  status.value = 'idle'
  mensagemErro.value = ''
}

const processarArquivo = async () => {
  if (!arquivo.value || !operadoraSelecionada.value || !empresaSelecionadaGlobal.value) return
  status.value = 'processando'
  vendasStatus.value = []
  cruzamentoExecutado.value = false

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
    resultado = await processarArquivo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value, ecEmpresaGlobal.value)
  } else if (operadoraSelecionada.value === 'pluxe' || operadoraSelecionada.value === 'pluxee') {
    const { processarArquivo } = useProcessorVendasVoucherPluxee()
    resultado = await processarArquivo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value, ecEmpresaGlobal.value)
  } else if (operadoraSelecionada.value === 'ticket') {
    const { processarArquivo } = useProcessorVendasVoucherTicket()
    resultado = await processarArquivo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value, ecEmpresaGlobal.value)
  } else if (operadoraSelecionada.value === 'vr') {
    const { processarArquivo } = useProcessorVendasVoucherVR()
    resultado = await processarArquivo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value, ecEmpresaGlobal.value)
  } else if (operadoraSelecionada.value === 'comprocard') {
    const { processarArquivo } = useProcessorVendasVoucherComprocard()
    resultado = await processarArquivo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value, ecEmpresaGlobal.value)
  } else if (operadoraSelecionada.value === 'lecard') {
    const { processarArquivo } = useProcessorVendasVoucherLecard()
    resultado = await processarArquivo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value, ecEmpresaGlobal.value)
  } else if (operadoraSelecionada.value === 'upbrasil') {
    const { processarArquivo } = useProcessorVendasVoucherUpBrasil()
    resultado = await processarArquivo(arquivo.value, operadoraSelecionada.value, nomeEmpresaGlobal.value, ecEmpresaGlobal.value)
  } else {
      throw new Error(`Processador para operadora ${operadoraSelecionada.value} ainda não implementado`)
    }

    if (resultado.sucesso && resultado.registros && resultado.registros.length > 0) {
      vendasProcessadas.value = normalizarAluguelEmDespesaMdr(
        aplicarContextoEmpresaNosRegistros(resultado.registros)
      )
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
  if (!cruzamentoExecutado.value) {
    alert('Execute o cruzamento com o Supabase antes de finalizar a importação.')
    return
  }

  const vendasParaEnviar = vendasStatus.value.filter(v => v.status_envio === 'pendente_envio')
  if (vendasParaEnviar.length === 0) {
    alert('Não há vendas pendentes para envio.')
    return
  }

  enviando.value = true

  try {
    await enviarVendasParaSupabase(
      vendasParaEnviar,
      nomeEmpresaGlobal.value,
      operadoraSelecionada.value
    )

    const chavesEnviadas = new Set(vendasParaEnviar.map(v => `${v.nsu}|${v.data_venda}|${v.valor_bruto}`))
    vendasStatus.value = vendasStatus.value.map(venda => {
      const chave = `${venda.nsu}|${venda.data_venda}|${venda.valor_bruto}`
      if (venda.status_envio === 'pendente_envio' && chavesEnviadas.has(chave)) {
        return { ...venda, status_envio: 'enviada', motivo_status: 'Enviada com sucesso' }
      }
      return venda
    })
    alert(`Envio concluído! ${vendasParaEnviar.length} vendas enviadas.`)
  } catch (error) {
    alert('Erro ao enviar vendas: ' + error.message)
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
  if (!vendasProcessadas.value.length) {
    alert('Não há vendas processadas para cruzar.')
    return
  }

  try {
    const { vendasStatus: statusVendas } = await cruzarVendasComSupabase(
      vendasProcessadas.value,
      nomeEmpresaGlobal.value,
      operadoraSelecionada.value
    )
    vendasStatus.value = statusVendas
    cruzamentoExecutado.value = true
  } catch (error) {
    alert('Erro no cruzamento com Supabase: ' + error.message)
  }
}
</script>
