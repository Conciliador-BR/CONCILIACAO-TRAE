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
        <tbody class="bg-white divide-y divide-gray-100">
          <TabelaVouchersLinha
            v-for="(voucher, index) in linhasExibidas"
            :key="voucher.nome"
            :voucher="voucher"
            :index="index"
            :empresa-selecionada="empresaSelecionada"
            :handlers="handlers"
            :get-adquirente-color="getAdquirenteColor"
            :tem-alteracao="temAlteracao"
          />
        </tbody>
        <TabelaVouchersTotais :totais="totais" />
      </table>
    </div>

    <ObservacoesModal
      :is-open="isModalOpen"
      :initial-value="currentObservation"
      @close="closeModal"
      @save="saveObservation"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRecebimentosVouchersManual } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual'
import { getOperadorasParaTabela } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/constants'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'
import ObservacoesModal from '../ObservacoesModal.vue'
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

const parseValorExtrato = (transacao) => {
  const raw = transacao?.valorNumerico ?? transacao?.valor ?? 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  const input = String(raw).trim()
  if (!input) return 0

  const normalized = input.replace(/\s/g, '').replace(/[^0-9,.-]/g, '')
  if (!normalized) return 0

  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)

  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

const depositosVouchersMap = computed(() => {
  const map = {}
  ;(transacoes.value || []).forEach((t) => {
    const valor = parseValorExtrato(t)
    if (!valor || valor <= 0) return

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

    map[key] = (map[key] || 0) + valor
  })
  return map
})

const aplicarDepositosNosVouchers = () => {
  const map = depositosVouchersMap.value || {}
  vouchersData.value.forEach((voucher) => {
    if (!voucher) return
    if (voucher._editing_depositado) return
    const key = normalizarChaveAdquirente(voucher.nome)
    const valorExtrato = round2(map[key] || 0)

    voucher.valor_depositado = valorExtrato
    voucher._depositado_input = formatBRLNumber(valorExtrato)
    voucher._depositado_db = valorExtrato
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
    acc.valor_depositado += Number(v.valor_depositado || 0)
    return acc
  }, { valor_bruto: 0, despesa_mdr: 0, valor_liquido: 0, despesa_antecipacao: 0, valor_previsto: 0, valor_depositado: 0 })
})

watch(
  totais,
  (novosTotais) => {
    emit('totais-change', {
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

const onFocusDepositado = (voucher, ev) => {
  voucher._editing_depositado = true
  ev?.target?.select?.()
}

const onInputDepositado = (voucher, ev) => {
  const v = ev?.target?.value ?? ''
  voucher._depositado_input = v
  voucher.valor_depositado = parseBRL(v)
  calcularValores(voucher)
}

const onBlurDepositado = (voucher) => {
  voucher._editing_depositado = false
  voucher._depositado_input = formatBRLNumber(voucher.valor_depositado)
  calcularValores(voucher)
}

const temAlteracao = (voucher) => {
  const alterouValores = [
    voucher._delta_bruto,
    voucher._delta_mdr,
    voucher._delta_liquido,
    voucher._delta_antecipacao,
    voucher._delta_previsto,
    voucher._delta_depositado
  ].some((v) => Number(v || 0) !== 0)

  const observacaoAtual = String(voucher.observacoes || '').trim()
  const observacaoOriginal = String(voucher._observacoes_db || '').trim()

  return alterouValores || observacaoAtual !== observacaoOriginal
}

const isModalOpen = ref(false)
const currentObservation = ref('')
const activeVoucher = ref(null)

const openModal = (voucher) => {
  currentObservation.value = voucher.observacoes || ''
  activeVoucher.value = voucher
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  currentObservation.value = ''
  activeVoucher.value = null
}

const saveObservation = (newObservation) => {
  if (activeVoucher.value) {
    activeVoucher.value.observacoes = newObservation
  }
  closeModal()
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
  onFocusDepositado,
  onInputDepositado,
  onBlurDepositado,
  openModal,
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
