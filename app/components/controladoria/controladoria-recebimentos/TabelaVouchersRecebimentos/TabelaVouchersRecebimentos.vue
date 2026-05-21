<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 mt-6 overflow-hidden">
    <TabelaVouchersCabecalho
      :empresa-selecionada="empresaSelecionada"
      :loading="loading"
      :error="error"
      :success-message="successMessage"
      @recarregar="carregarTudo"
      @limpar-sucesso="successMessage = null"
    />

    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200">
        <TabelaVouchersTabelaHeader />
        <TabelaVouchersLinha
          v-for="(voucher, index) in linhasExibidas"
          :key="voucher.nome"
          :voucher="voucher"
          :index="index"
          :empresa-selecionada="empresaSelecionada"
          :handlers="handlers"
          :get-adquirente-color="getAdquirenteColor"
          :tem-alteracao="temAlteracao"
          :active-observation-index="activeObservationIndex"
          :current-observation="currentObservation"
        />
        <TabelaVouchersTotais :totais="totais" />
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRecebimentosVouchersManual } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual'
import { getOperadorasParaTabela } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/constants'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'
import { criarMapaPagamentosBanco } from '~/composables/PageControladoria/analise-de-recebimentos/pagamento_de_banco/usePagamentoDeBanco'
import TabelaVouchersCabecalho from './TabelaVouchersCabecalho.vue'
import TabelaVouchersLinha from './TabelaVouchersLinha.vue'
import TabelaVouchersTabelaHeader from './TabelaVouchersTabelaHeader.vue'
import TabelaVouchersTotais from './TabelaVouchersTotais.vue'

const emit = defineEmits(['totais-change'])

const round2 = (value) => {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const formatBRLNumber = (value) => {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(round2(value))
}

const parseBRL = (value) => {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const raw = String(value).trim()
  if (!raw) return 0
  const normalized = raw.replace(/\s/g, '').replace(/[^0-9,.-]/g, '')
  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return 0
  return round2(parsed)
}

const { filtrosGlobais } = useGlobalFilters()
const filtroAtivo = ref(null)

const { vouchersData, loading, error, successMessage, carregar, calcularValores, enviarRecebimento } = useRecebimentosVouchersManual(filtroAtivo)
const { transacoes, buscarTransacoesBancarias } = useExtratoDetalhado()
const { detectarAdquirente } = useAdquirenteDetector()

const empresaSelecionada = computed(() => Boolean(filtrosGlobais.empresaSelecionada))

const normalizarChaveAdquirente = (texto) => {
  if (!texto) return ''
  return String(texto)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const aliasesVoucherParaLinha = computed(() => {
  const mapa = {}
  ;(vouchersData.value || []).forEach((voucher) => {
    const nomeLinha = String(voucher?.nome || '').trim()
    if (!nomeLinha) return
    const candidatos = getOperadorasParaTabela(nomeLinha)
    candidatos.forEach((alias) => {
      const key = normalizarChaveAdquirente(alias)
      if (key && !mapa[key]) mapa[key] = nomeLinha
    })
  })
  return mapa
})

const resolverNomeVoucherLinha = (baseDetectado) => {
  const key = normalizarChaveAdquirente(baseDetectado)
  if (!key) return ''
  return aliasesVoucherParaLinha.value[key] || ''
}

const resolverNomeVoucherPorDescricao = (descricao) => {
  const texto = normalizarChaveAdquirente(descricao)
  if (!texto) return ''
  if (texto.includes('VR BENEFCIOS SERV') || texto.includes('VR BENEFICIOS SERV') || texto.includes('VR BENEF')) {
    return 'VR'
  }
  if (texto.includes('SICOOB CARTAO CREDITO') || texto.includes('SICOB CARTAO CREDITO')) {
    return 'CABAL'
  }
  return ''
}

const depositosVouchersMap = computed(() => {
  const map = {}
  const pagamentosBanco = criarMapaPagamentosBanco(transacoes.value || [], detectarAdquirente)
  ;(transacoes.value || []).forEach((t) => {
    const det = detectarAdquirente(t?.descricao, t?.banco)
    const categoriaDetectada = normalizarChaveAdquirente(t?.categoria_detectada)
    const categoriaPelaDescricao = normalizarChaveAdquirente(det?.categoria)

    const baseDetectado = t?.adquirente_detectado ? String(t.adquirente_detectado) : ''
    const base = baseDetectado || det?.base || t?.voucher || t?.adquirente
    const nomeVoucher = resolverNomeVoucherLinha(base) || resolverNomeVoucherPorDescricao(t?.descricao)
    const ehVoucher = categoriaDetectada === 'VOUCHER' || categoriaPelaDescricao === 'VOUCHER' || Boolean(nomeVoucher)
    if (!ehVoucher) return
    const key = normalizarChaveAdquirente(nomeVoucher)
    if (!key) return

    map[key] = Number(pagamentosBanco?.[key]?.total || 0)
  })
  return map
})

const aplicarDepositosNosVouchers = () => {
  const map = depositosVouchersMap.value || {}
  vouchersData.value.forEach((voucher) => {
    if (!voucher) return
    const key = normalizarChaveAdquirente(voucher.nome)
    const valorDetectado = round2(map[key] || 0)
    if (Number(voucher._pgto_banco_db || 0) === 0 && valorDetectado > 0) {
      voucher.pgto_banco = valorDetectado
      voucher._pgto_banco_db = valorDetectado
      voucher._pgto_banco_base_db = valorDetectado
      voucher._pgto_banco_input = formatBRLNumber(valorDetectado)
    }
    calcularValores(voucher)
  })
}

const carregarTudo = async () => {
  await carregar()
  await buscarTransacoesBancarias({
    bancoSelecionado: 'TODOS',
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  }, true)
  aplicarDepositosNosVouchers()
}

const linhasExibidas = computed(() => {
  if (!empresaSelecionada.value) return []
  return vouchersData.value.filter((v) => v?._table_exists === true && Boolean(v?._table_name))
})

const totais = computed(() => {
  return linhasExibidas.value.reduce((acc, v) => {
    acc.valor_bruto += Number(v.valor_bruto || 0)
    acc.despesa_mdr += Number(v.despesa_mdr || 0)
    acc.valor_liquido += Number(v.valor_liquido || 0)
    acc.despesa_antecipacao += Number(v.despesa_antecipacao || 0)
    acc.valor_previsto += Number(v.valor_previsto || 0)
    acc.pgto_banco += Number(v.pgto_banco || 0)
    return acc
  }, { valor_bruto: 0, despesa_mdr: 0, valor_liquido: 0, despesa_antecipacao: 0, valor_previsto: 0, pgto_banco: 0 })
})

watch(
  totais,
  (novosTotais) => {
    emit('totais-change', {
      valor_bruto: Number(novosTotais?.valor_bruto || 0),
      despesa_mdr: Number(novosTotais?.despesa_mdr || 0),
      valor_liquido: Number(novosTotais?.valor_liquido || 0)
    })
  },
  { immediate: true, deep: true }
)

const getAdquirenteColor = (index) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500']
  return colors[index % colors.length]
}

const onFocusBruto = (voucher, ev) => {
  voucher._editing_bruto = true
  ev?.target?.select?.()
}

const onInputBruto = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._bruto_input = v
  voucher.valor_bruto = parseBRL(v)
  calcularValores(voucher)
}

const onBlurBruto = (voucher) => {
  voucher._editing_bruto = false
  voucher._bruto_input = formatBRLNumber(voucher.valor_bruto)
  calcularValores(voucher)
}

const onFocusMdr = (voucher, ev) => {
  voucher._editing_mdr = true
  ev?.target?.select?.()
}

const onInputMdr = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._mdr_input = v
  voucher.despesa_mdr = parseBRL(v)
  calcularValores(voucher)
}

const onBlurMdr = (voucher) => {
  voucher._editing_mdr = false
  voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
  calcularValores(voucher)
}

const onFocusLiquido = (voucher, ev) => {
  voucher._editing_liquido = true
  ev?.target?.select?.()
}

const onInputLiquido = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._liquido_input = v
  voucher.valor_liquido = parseBRL(v)
  calcularValores(voucher)
}

const onBlurLiquido = (voucher) => {
  voucher._editing_liquido = false
  voucher._liquido_input = formatBRLNumber(voucher.valor_liquido)
  calcularValores(voucher)
}

const onFocusAntecipacao = (voucher, ev) => {
  voucher._editing_antecipacao = true
  ev?.target?.select?.()
}

const onInputAntecipacao = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._antecipacao_input = v
  voucher.despesa_antecipacao = parseBRL(v)
  calcularValores(voucher)
}

const onBlurAntecipacao = (voucher) => {
  voucher._editing_antecipacao = false
  voucher._antecipacao_input = formatBRLNumber(voucher.despesa_antecipacao)
  calcularValores(voucher)
}

const onFocusPrevisto = (voucher, ev) => {
  voucher._editing_previsto = true
  ev?.target?.select?.()
}

const onInputPrevisto = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._previsto_input = v
  voucher.valor_previsto = parseBRL(v)
  calcularValores(voucher)
}

const onBlurPrevisto = (voucher) => {
  voucher._editing_previsto = false
  voucher._previsto_input = formatBRLNumber(voucher.valor_previsto)
  calcularValores(voucher)
}

const onFocusPgtoBanco = (voucher, ev) => {
  voucher._editing_pgto_banco = true
  ev?.target?.select?.()
}

const onInputPgtoBanco = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._pgto_banco_input = v
  voucher.pgto_banco = parseBRL(v)
  calcularValores(voucher)
}

const onBlurPgtoBanco = (voucher) => {
  voucher._editing_pgto_banco = false
  voucher._pgto_banco_input = formatBRLNumber(voucher.pgto_banco)
  calcularValores(voucher)
}

const temAlteracao = (voucher) => {
  const alterouValores = [
    voucher._delta_bruto,
    voucher._delta_mdr,
    voucher._delta_liquido,
    voucher._delta_antecipacao,
    voucher._delta_previsto,
    voucher._delta_pgto_banco
  ].some((v) => Number(v || 0) !== 0)

  const observacaoAtual = String(voucher.observacoes || '').trim()
  const observacaoOriginal = String(voucher._observacoes_db || '').trim()

  return alterouValores || observacaoAtual !== observacaoOriginal
}

const activeObservationIndex = ref(-1)
const currentObservation = ref('')

const toggleEditor = (voucher, index) => {
  if (activeObservationIndex.value === index) {
    closeEditor()
    return
  }
  currentObservation.value = voucher?.observacoes || ''
  activeObservationIndex.value = index
}

const closeEditor = () => {
  currentObservation.value = ''
  activeObservationIndex.value = -1
}

const saveObservationLocally = (voucher, index) => {
  if (activeObservationIndex.value !== index || !voucher) return
  voucher.observacoes = currentObservation.value
  closeEditor()
}

const setCurrentObservation = (value) => {
  currentObservation.value = String(value || '')
}

const temObservacao = (voucher) => {
  return Boolean(String(voucher?.observacoes || '').trim())
}

const handlers = {
  onFocusBruto,
  onInputBruto,
  onBlurBruto,
  onFocusMdr,
  onInputMdr,
  onBlurMdr,
  onFocusLiquido,
  onInputLiquido,
  onBlurLiquido,
  onFocusAntecipacao,
  onInputAntecipacao,
  onBlurAntecipacao,
  onFocusPrevisto,
  onInputPrevisto,
  onBlurPrevisto,
  onFocusPgtoBanco,
  onInputPgtoBanco,
  onBlurPgtoBanco,
  toggleEditor,
  closeEditor,
  saveObservationLocally,
  setCurrentObservation,
  temObservacao,
  enviarRecebimento
}

onMounted(async () => {
  if (empresaSelecionada.value) {
    await carregarTudo()
  }
})

watch(
  () => [filtrosGlobais.empresaSelecionada, filtrosGlobais.dataInicial, filtrosGlobais.dataFinal],
  async () => {
    if (empresaSelecionada.value) {
      await carregarTudo()
    }
  }
)
</script>
