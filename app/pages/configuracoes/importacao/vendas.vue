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

    <SeletorModoImportacao
      :visivel="mostrarSeletorModoImportacao"
      :modo-selecionado="modoImportacao"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @modo-selecionado="handleModoImportacaoSelect"
    />

    <ImportacaoAutomaticaRede
      :visivel="mostrarImportacaoApiRede"
      :carregando="carregandoImportacaoApiRedeAtual"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      :data-inicial="filtrosGlobais.dataInicial"
      :data-final="filtrosGlobais.dataFinal"
      :nome-empresa="nomeEmpresaGlobal"
      :ec-empresa="ecEmpresaGlobal"
      :integracao="integracaoApiRedeAtual"
      :mensagem-erro="erroImportacaoApiRedeAtual"
      :tipo-consulta="tipoConsultaApiRede"
      @update:tipo-consulta="handleTipoConsultaApiRede"
      @executar="handleImportacaoAutomaticaRede"
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

    <StatusProcessamento 
      :arquivo="arquivo"
      :fonte-descricao="fonteProcessamentoDescricao"
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
    <div
      v-else-if="status === 'sucesso' && vendasProcessadas.length > 0 && isImportacaoApiRedeVoucher"
      class="space-y-6"
    >
      <TabelaVendasRedeVoucherBruto
        v-for="grupoVoucher in gruposTabelasVoucherPorBandeiraModalidade"
        :key="grupoVoucher.key"
        :registros="grupoVoucher.registros"
        :titulo="grupoVoucher.titulo"
      />
    </div>
    <TabelaVendas
      v-else-if="status === 'sucesso' && vendasProcessadas.length > 0 && isImportacaoApiRedePix"
      :vendas="vendasProcessadas"
      :adquirente="operadoraSelecionada"
      titulo="4. Vendas PIX via API da Rede"
    />
    <div
      v-else-if="status === 'sucesso' && vendasProcessadas.length > 0 && usarTabelasAgrupadas"
      class="space-y-6"
    >
      <TabelaVendas
        v-for="grupoTabela in gruposTabelasVendas"
        :key="grupoTabela.key"
        :vendas="grupoTabela.vendas"
        :adquirente="operadoraSelecionada"
        :titulo="grupoTabela.titulo"
      />
      <TabelaVendas
        :vendas="vendasProcessadas"
        :adquirente="operadoraSelecionada"
        titulo="5. Consolidado Geral das Vendas Processadas"
      />
    </div>
    <TabelaVendas
      v-else-if="status === 'sucesso' && vendasProcessadas.length > 0"
      :vendas="vendasProcessadas"
      :adquirente="operadoraSelecionada"
    />

    <TabelaStatusVendas
      v-if="!isImportacaoApiRedeVoucher"
      :vendas="vendasProcessadas"
      :vendas-status="vendasStatus"
      :cruzamento-executado="cruzamentoExecutado"
      :cruzando="cruzando"
      @executar-cruzamento="executarCruzamento"
    />

    <BotaoEnviarSupabase
      v-if="cruzamentoExecutado && !isImportacaoApiRedeVoucher"
      :vendas="vendasPendentesEnvio"
      :enviando="enviando"
      :disabled="!empresaSelecionadaGlobal || isTodasEmpresasSelected"
      @abrir-confirmacao="abrirConfirmacaoEnvio"
    />

    <ConfirmacaoEnvioFlutuante
      v-if="!isImportacaoApiRedeVoucher"
      :open="confirmacaoEnvioAberta"
      tipo="vendas"
      :empresa="nomeEmpresaGlobal"
      :ec="ecEmpresaGlobal"
      :tipo-unidade="tipoUnidadeGlobal"
      :adquirente="String(operadoraSelecionada || '').toUpperCase()"
      :total-registros="vendasPendentesEnvio.length"
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
import { useImportacaoAutomaticaRede } from '~/composables/configuracoes/importacao/processor_vendas_automaticas/rede/useImportacaoAutomaticaRede'
import { useImportacaoAutomaticaRede_vouchers } from '~/composables/configuracoes/importacao/processor_vendas_automaticas/rede/useImportacaoAutomaticaRede_vouchers'

import SeletorOperadora from '~/components/configuracoes/importacao/importacao_vendas/SeletorOperadora.vue'
import SeletorModoImportacao from '~/components/configuracoes/importacao/importacao_vendas/SeletorModoImportacao.vue'
import ImportacaoAutomaticaRede from '~/components/configuracoes/importacao/importacao_vendas/ImportacaoAutomaticaRede.vue'
import UploadArquivo from '~/components/configuracoes/importacao/importacao_vendas/UploadArquivo.vue'
import StatusProcessamento from '~/components/configuracoes/importacao/importacao_vendas/StatusProcessamento.vue'
import TabelaVendas from '~/components/configuracoes/importacao/importacao_vendas/TabelaVendas.vue'
import TabelaVendasRedeVoucherBruto from '~/components/configuracoes/importacao/importacao_vendas/TabelaVendasRedeVoucherBruto.vue'
import TabelaVendasVoucher from '~/components/configuracoes/importacao/importacao_vendas/TabelaVendasVoucher.vue'
import BotaoEnviarSupabase from '~/components/configuracoes/importacao/importacao_vendas/BotaoEnviarSupabase.vue'
import TabelaStatusVendas from '~/components/configuracoes/importacao/importacao_vendas/TabelaStatusVendas.vue'
import ConfirmacaoEnvioFlutuante from '~/components/configuracoes/importacao/card_confirmacao_envio/ConfirmacaoEnvioFlutuante.vue'
import { useCruzamentoVendasSupabase } from '~/composables/configuracoes/importacao/Envio_vendas/useCruzamentoVendasSupabase'
import { useConfirmacaoEnvioSupabase } from '~/composables/configuracoes/importacao/useConfirmacaoEnvioSupabase'

const operadoraSelecionada = ref(null)
const modoImportacao = ref('')
const arquivo = ref(null)
const vendasProcessadas = ref([])
const status = ref('idle')
const mensagemErro = ref('')
const enviando = ref(false)
const vendasStatus = ref([])
const cruzamentoExecutado = ref(false)
const fonteProcessamentoDescricao = ref('')
const tipoConsultaApiRede = ref('debito_credito')

const { processarArquivoComPython: processarArquivoUnica } = useVendasOperadoraUnica()
const { processarArquivoComPython: processarArquivoStone } = useVendasOperadoraStone()
const { processarArquivoComPython: processarArquivoSafra } = useVendasOperadoraSafra()
const { processarArquivoComPython: processarArquivoRede } = useVendasOperadoraRede()
const { processarArquivoComPython: processarArquivoCielo } = useVendasOperadoraCielo()
const { processarArquivoComPython: processarArquivoGetnet } = useVendasOperadoraGetnet()
const { enviarVendasParaSupabase, construirNomeTabela } = useImportacao()
const { cruzando, cruzarVendasComSupabase } = useCruzamentoVendasSupabase()
const { filtrosGlobais } = useGlobalFilters()
const { empresas, empresaSelecionada: empresaSelecionadaAtiva, fetchEmpresas } = useEmpresas()
const { verificandoTabela, tabelaExiste, erroTabela, verificarTabelaExiste, resetarVerificacaoTabela } = useConfirmacaoEnvioSupabase()
const {
  carregando: carregandoImportacaoApiRede,
  erro: erroImportacaoApiRede,
  integracaoEncontrada: integracaoApiRedeEncontrada,
  limparEstado: limparImportacaoAutomaticaRede,
  importarVendas: importarVendasAutomaticasRede
} = useImportacaoAutomaticaRede()
const {
  carregando: carregandoImportacaoApiRedeVouchers,
  erro: erroImportacaoApiRedeVouchers,
  integracaoEncontrada: integracaoApiRedeVouchersEncontrada,
  limparEstado: limparImportacaoAutomaticaRedeVouchers,
  importarVouchers: importarVouchersAutomaticosRede
} = useImportacaoAutomaticaRede_vouchers()
const confirmacaoEnvioAberta = ref(false)
const nomeTabelaConfirmacao = ref('')

const empresaSelecionadaGlobal = computed(() => {
  return empresaSelecionadaAtiva.value
})

const isTodasEmpresasSelected = computed(() => {
  return empresaSelecionadaAtiva.value === ''
})

const isRedeSelected = computed(() => {
  return operadoraSelecionada.value === 'rede'
})

const mostrarSeletorModoImportacao = computed(() => {
  return !!operadoraSelecionada.value && isRedeSelected.value
})

const modoImportacaoEfetivo = computed(() => {
  if (!operadoraSelecionada.value) return ''
  if (!isRedeSelected.value) return 'manual'
  return modoImportacao.value
})

const mostrarUploadArquivo = computed(() => {
  if (!operadoraSelecionada.value) return false
  if (isRedeSelected.value) {
    return modoImportacaoEfetivo.value === 'manual'
  }
  return true
})

const mostrarImportacaoApiRede = computed(() => {
  return isRedeSelected.value && modoImportacaoEfetivo.value === 'api'
})

const isImportacaoApiRedeVoucher = computed(() => {
  return mostrarImportacaoApiRede.value && tipoConsultaApiRede.value === 'vouchers'
})

const isImportacaoApiRedePix = computed(() => {
  return mostrarImportacaoApiRede.value && tipoConsultaApiRede.value === 'pix'
})

const carregandoImportacaoApiRedeAtual = computed(() => {
  return isImportacaoApiRedeVoucher.value
    ? carregandoImportacaoApiRedeVouchers.value
    : carregandoImportacaoApiRede.value
})

const erroImportacaoApiRedeAtual = computed(() => {
  return isImportacaoApiRedeVoucher.value
    ? erroImportacaoApiRedeVouchers.value
    : erroImportacaoApiRede.value
})

const integracaoApiRedeAtual = computed(() => {
  return isImportacaoApiRedeVoucher.value
    ? integracaoApiRedeVouchersEncontrada.value
    : integracaoApiRedeEncontrada.value
})

const usarTabelasAgrupadas = computed(() => {
  return isRedeSelected.value
    && modoImportacaoEfetivo.value === 'api'
    && !isImportacaoApiRedeVoucher.value
    && !isImportacaoApiRedePix.value
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

const vendasPendentesEnvio = computed(() => {
  return vendasStatus.value.filter(v => v.status_envio === 'pendente_envio')
})

const gruposTabelasVendas = computed(() => {
  const registros = Array.isArray(vendasProcessadas.value) ? vendasProcessadas.value : []
  const gruposMap = new Map()

  registros.forEach((item, index) => {
    const tituloBase = String(item?.grupo_importacao || `${item?.bandeira || 'SEM BANDEIRA'} ${item?.modalidade || 'SEM MODALIDADE'}`)
      .trim()
      .toUpperCase()
    const ordem = Number(item?.grupo_importacao_ordem)
    const grupoAtual = gruposMap.get(tituloBase) || {
      tituloBase,
      ordem: Number.isFinite(ordem) ? ordem : Number.MAX_SAFE_INTEGER,
      primeiroIndice: index,
      vendas: []
    }

    grupoAtual.vendas.push(item)
    grupoAtual.primeiroIndice = Math.min(grupoAtual.primeiroIndice, index)
    if (Number.isFinite(ordem)) {
      grupoAtual.ordem = Math.min(grupoAtual.ordem, ordem)
    }

    gruposMap.set(tituloBase, grupoAtual)
  })

  const gruposOrdenados = Array.from(gruposMap.values()).sort((a, b) => {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem
    if (a.primeiroIndice !== b.primeiroIndice) return a.primeiroIndice - b.primeiroIndice
    return a.tituloBase.localeCompare(b.tituloBase)
  })

  return gruposOrdenados.map((grupo) => {
    return {
      key: grupo.tituloBase,
      titulo: `4. Vendas Processadas - ${grupo.tituloBase}`,
      vendas: grupo.vendas
    }
  })
})

const getVoucherValueByPath = (source, path) => {
  return String(path || '')
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), source)
}

const getVoucherFirstDefined = (source, paths = []) => {
  for (const path of paths) {
    const value = getVoucherValueByPath(source, path)
    if (value !== null && value !== undefined && value !== '') {
      return value
    }
  }

  return null
}

const VOUCHER_BRAND_CODE_LABELS = {
  '1': 'VISA',
  '2': 'MASTERCARD',
  '3': 'AMEX',
  '14': 'ELO',
  '15': 'HIPERCARD',
  '16': 'ALELO',
  '17': 'TICKET',
  '18': 'SODEXO',
  '19': 'VR',
  '20': 'PLUXEE',
  '21': 'VR',
  '22': 'VEROCHEQUE',
  '23': 'COOPERCARD',
  '24': 'PERSONAL CARD',
  '25': 'POLICARD',
  '26': 'VALECARD',
  '27': 'UP BRASIL',
  '28': 'SENFF',
  '29': 'TRICARD',
  '30': 'FORTBRASIL',
  '31': 'CALCARD',
  '32': 'BNB CLUBE',
  '33': 'GOOD CARD',
  '37': 'LECARD',
  '52': 'TICKET'
}

const getVoucherBrandCode = (item) => {
  return String(
    item?.cardBrand?.code
    || item?.cardBrand?.id
    || item?.brandCode
    || item?.brand?.code
    || item?.brand?.id
    || item?.__consultaRede?.brandCode
    || ''
  ).trim()
}

const resolverBandeiraVoucher = (item) => {
  const brandCode = getVoucherBrandCode(item)
  const cardBrandName = normalizarTexto(getVoucherFirstDefined(item, [
    'cardBrand.description',
    'cardBrand.name',
    'brandCodeDescription',
    'brandName',
    'brandDescription',
    'brand.description',
    'brand.name',
    '__consultaRede.brandName'
  ]))

  if (cardBrandName && cardBrandName !== '[OBJECT OBJECT]' && !/^\d+$/.test(cardBrandName)) {
    if (cardBrandName.includes('MASTER')) return 'MASTERCARD'
    if (cardBrandName.includes('VISA')) return 'VISA'
    if (cardBrandName.includes('AMEX') || cardBrandName.includes('AMERICAN')) return 'AMEX'
    if (cardBrandName.includes('ELO')) return 'ELO'
    if (cardBrandName.includes('HIPER')) return 'HIPERCARD'
    return cardBrandName
  }

  return VOUCHER_BRAND_CODE_LABELS[brandCode] || brandCode || 'SEM BANDEIRA'
}

const resolverEmissorVoucher = (item) => {
  const issuerName = normalizarTexto(getVoucherFirstDefined(item, [
    'issuer',
    'issuerName',
    'issuer.description',
    'issuer.name'
  ]))

  if (issuerName && issuerName !== '[OBJECT OBJECT]' && !/^\d+$/.test(issuerName)) {
    if (issuerName.includes('ALELO')) return 'ALELO'
    if (issuerName.includes('TICKET')) return 'TICKET'
    if (issuerName.includes('VR')) return 'VR'
    if (issuerName.includes('SODEXO')) return 'SODEXO'
    if (issuerName.includes('UP BRASIL')) return 'UP BRASIL'
    if (issuerName.includes('PLUXEE') || issuerName.includes('PLUXE')) return 'PLUXEE'
    if (issuerName.includes('LECARD') || issuerName.includes('LE CARD')) return 'LECARD'
    if (issuerName.includes('COMPROCARD')) return 'COMPROCARD'
    return issuerName
  }

  const brandText = normalizarTexto(getVoucherFirstDefined(item, [
    'brandName',
    'brandDescription',
    'brand.description',
    'brand.name',
    'brandCodeDescription',
    '__consultaRede.brandName'
  ]))

  if (brandText && brandText !== '[OBJECT OBJECT]' && !/^\d+$/.test(brandText)) {
    if (brandText.includes('ALELO')) return 'ALELO'
    if (brandText.includes('TICKET')) return 'TICKET'
    if (brandText.includes('VR')) return 'VR'
    if (brandText.includes('SODEXO')) return 'SODEXO'
    if (brandText.includes('UP BRASIL')) return 'UP BRASIL'
    if (brandText.includes('PLUXEE') || brandText.includes('PLUXE')) return 'PLUXEE'
    if (brandText.includes('LECARD') || brandText.includes('LE CARD')) return 'LECARD'
    if (brandText.includes('COMPROCARD')) return 'COMPROCARD'
    if (
      brandText.includes('BENEF')
      || brandText.includes('VOUCHER')
      || brandText.includes('GREEN CARD')
      || brandText.includes('VALECARD')
      || brandText.includes('POLICARD')
      || brandText.includes('GOOD CARD')
      || brandText.includes('PERSONAL CARD')
      || brandText.includes('COOPERCARD')
    ) {
      return brandText
    }
  }

  const brandCode = getVoucherBrandCode(item)
  if (VOUCHER_BRAND_CODE_LABELS[brandCode] && Number(brandCode) >= 16) {
    return VOUCHER_BRAND_CODE_LABELS[brandCode]
  }

  return 'SEM VOUCHER'
}

const resolverModalidadeVoucher = (item) => {
  const valorBruto = getVoucherFirstDefined(item, [
    'modality.description',
    'modality.name',
    'modality.code',
    'modality',
    'transactionType.description',
    'transactionType.name',
    'transactionType.code',
    'transactionType',
    'productType.description',
    'productType.name',
    'productType.code',
    'productType',
    'captureType.description',
    'captureType.name',
    'captureType.code',
    'captureType',
    'kind',
    'type',
    'subType',
    'cardType',
    '__consultaRede.modalidade'
  ])

  const texto = normalizarTexto(valorBruto)

  if (!texto || texto === '[OBJECT OBJECT]') return 'SEM MODALIDADE'
  if (texto === '1') return 'DEBITO'
  if (texto === '2' || texto === '3') return 'CREDITO'
  if (texto.includes('DEBIT')) return 'DEBITO'
  if (texto.includes('PARCEL')) return 'PARCELADO'
  if (texto.includes('INSTALLMENT')) return 'PARCELADO'
  if (texto.includes('CRED')) return 'CREDITO'
  if (texto.includes('VOUCHER') || texto.includes('BENEF')) return 'VOUCHER'

  return texto
}

const gruposTabelasVoucherPorBandeiraModalidade = computed(() => {
  const registros = Array.isArray(vendasProcessadas.value) ? vendasProcessadas.value : []
  const gruposMap = new Map()

  registros.forEach((item, index) => {
    const voucher = resolverEmissorVoucher(item)
    const modalidade = resolverModalidadeVoucher(item)
    const bandeira = resolverBandeiraVoucher(item)
    const chaveGrupo = voucher
    const grupoAtual = gruposMap.get(chaveGrupo) || {
      chaveGrupo,
      voucher,
      bandeira,
      modalidade,
      primeiroIndice: index,
      registros: []
    }

    grupoAtual.registros.push(item)
    grupoAtual.primeiroIndice = Math.min(grupoAtual.primeiroIndice, index)
    gruposMap.set(chaveGrupo, grupoAtual)
  })

  return Array.from(gruposMap.values())
    .sort((a, b) => {
      if (a.primeiroIndice !== b.primeiroIndice) return a.primeiroIndice - b.primeiroIndice
      return String(a.chaveGrupo).localeCompare(String(b.chaveGrupo))
    })
    .map((grupo, index) => {
      return {
        key: `${grupo.chaveGrupo}-${index}`,
        titulo: `4. Dados Brutos da API REDE - ${grupo.voucher}`,
        registros: grupo.registros
      }
    })
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
  if (vendasPendentesEnvio.value.length === 0) {
    alert('Não há vendas pendentes para envio.')
    return
  }

  nomeTabelaConfirmacao.value = construirNomeTabela(
    nomeEmpresaGlobal.value,
    operadoraSelecionada.value
  )
  confirmacaoEnvioAberta.value = true
  await verificarTabelaExiste(nomeTabelaConfirmacao.value)
}

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

watch(empresaSelecionadaGlobal, (novaEmpresa, empresaAnterior) => {
  if (novaEmpresa === empresaAnterior) return

  fecharConfirmacaoEnvio()
  resetarEstadoProcessamento()

  if (!novaEmpresa) {
    operadoraSelecionada.value = null
    modoImportacao.value = ''
  }
})

const resetarEstadoProcessamento = () => {
  arquivo.value = null
  vendasProcessadas.value = []
  vendasStatus.value = []
  cruzamentoExecutado.value = false
  status.value = 'idle'
  mensagemErro.value = ''
  fonteProcessamentoDescricao.value = ''
  limparImportacaoAutomaticaRede()
  limparImportacaoAutomaticaRedeVouchers()
}

const handleOperadoraSelect = (operadoraId) => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  operadoraSelecionada.value = operadoraId
  modoImportacao.value = operadoraId === 'rede' ? '' : 'manual'
  resetarEstadoProcessamento()
}

const handleModoImportacaoSelect = (modo) => {
  modoImportacao.value = modo
  resetarEstadoProcessamento()
}

const handleTipoConsultaApiRede = (tipo) => {
  if (tipo === 'vouchers' || tipo === 'pix') {
    tipoConsultaApiRede.value = tipo
  } else {
    tipoConsultaApiRede.value = 'debito_credito'
  }
  resetarEstadoProcessamento()
}

const handleArquivoSelecionado = async (file) => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  mensagemErro.value = ''
  fonteProcessamentoDescricao.value = ''
  arquivo.value = file
  status.value = 'processando'
  await nextTick()
  await processarArquivo()
}

const handleArquivoRemovido = () => {
  resetarEstadoProcessamento()
}

const processarArquivo = async () => {
  if (!arquivo.value || !operadoraSelecionada.value || !empresaSelecionadaGlobal.value) return
  status.value = 'processando'
  vendasStatus.value = []
  cruzamentoExecutado.value = false
  mensagemErro.value = ''
  fonteProcessamentoDescricao.value = ''

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

const handleImportacaoAutomaticaRede = async () => {
  if (!empresaSelecionadaGlobal.value) {
    alert('Selecione uma empresa primeiro!')
    return
  }
  if (isTodasEmpresasSelected.value) {
    alert('Selecione uma empresa especifica para usar a importacao via API.')
    return
  }
  if (!filtrosGlobais.dataInicial || !filtrosGlobais.dataFinal) {
    alert('Selecione o periodo no filtro de data antes de puxar as vendas.')
    return
  }

  resetarEstadoProcessamento()
  status.value = 'processando'
  fonteProcessamentoDescricao.value = isImportacaoApiRedeVoucher.value
    ? 'Importacao via API da Rede - Dados Brutos Completos'
    : isImportacaoApiRedePix.value
      ? 'Importacao via API da Rede - PIX'
      : 'Importacao via API da Rede - Debito e Credito'

  try {
    const resultadoOriginal = isImportacaoApiRedeVoucher.value
      ? await importarVouchersAutomaticosRede({
        nomeEmpresa: nomeEmpresaGlobal.value,
        ecEmpresa: ecEmpresaGlobal.value,
        dataInicial: filtrosGlobais.dataInicial,
        dataFinal: filtrosGlobais.dataFinal
      })
      : await importarVendasAutomaticasRede({
        nomeEmpresa: nomeEmpresaGlobal.value,
        ecEmpresa: ecEmpresaGlobal.value,
        dataInicial: filtrosGlobais.dataInicial,
        dataFinal: filtrosGlobais.dataFinal
      })

    const registros = Array.isArray(resultadoOriginal?.registros)
      ? resultadoOriginal.registros
      : []

    const registrosFiltrados = isImportacaoApiRedeVoucher.value
      ? registros
      : isImportacaoApiRedePix.value
        ? registros.filter(item => String(item?.modalidade || '').toUpperCase() === 'PIX')
        : registros.filter((item) => {
          const modalidade = String(item?.modalidade || '').toUpperCase()
          return modalidade === 'DEBITO' || modalidade === 'CREDITO'
        })

    if (registrosFiltrados.length === 0) {
      throw new Error(
        isImportacaoApiRedeVoucher.value
          ? 'A API da Rede respondeu sem vouchers para o periodo selecionado.'
          : isImportacaoApiRedePix.value
            ? 'A API da Rede respondeu sem registros PIX para o periodo selecionado.'
            : 'A API da Rede respondeu sem vendas de debito/credito para o periodo selecionado.'
      )
    }

    vendasProcessadas.value = isImportacaoApiRedeVoucher.value
      ? aplicarContextoEmpresaNosRegistros(registrosFiltrados)
      : normalizarAluguelEmDespesaMdr(
        aplicarContextoEmpresaNosRegistros(registrosFiltrados)
      )
    status.value = 'sucesso'
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
    fecharConfirmacaoEnvio()
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
