<template>
  <div>
    <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Recebimentos</h2>
        <p class="text-sm text-gray-600 mt-1">Adquirente de Cartões</p>
      </div>
      <NuxtLink to="/Pagamentos/Recebimentos" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Ir para Recebimentos</NuxtLink>
    </div>
    <ControladoriaRecebimentosTableComplete 
      :recebimentos-data="recebimentosAgrupados"
      :totais="totaisGerais"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import ControladoriaRecebimentosTableComplete from './ControladoriaRecebimentosTableComplete.vue'
import { useControladoriaVendas } from '~/composables/PageControladoria/useControladoriaVendas'

const { screenSize, windowWidth, initializeResponsive, getResponsiveColumnWidths } = useResponsiveColumns()

const { recebimentos, fetchRecebimentos } = useRecebimentos()
const { filtrosGlobais } = useGlobalFilters()
const { classificarBandeira, determinarModalidade } = useControladoriaVendas()

const ordemBandeiras = [
  'VISA',
  'VISA ELECTRON',
  'MASTERCARD',
  'MAESTRO',
  'ELO CRÉDITO',
  'ELO DÉBITO',
  'AMEX',
  'HIPERCARD',
  'BRADESCO DÉBITO',
  'TRICARD',
  'OUTROS'
]

const recebimentosAgrupados = computed(() => {
  const map = new Map()
  ;(recebimentos.value || []).forEach(r => {
    const key = classificarBandeira(r.bandeira || r.adquirente || '', r.modalidade || '') || 'OUTROS'
    const entry = map.get(key) || {
      adquirente: key,
      debito: 0,
      credito: 0,
      credito2x: 0,
      credito3x: 0,
      credito4x5x6x: 0,
      voucher: 0,
      despesa_mdr_total: 0,
      valor_bruto_total: 0,
      valor_liquido_total: 0
    }

    const modalidadePagamento = determinarModalidade(r.modalidade || '', r.numeroParcelas || 1)
    const liquido = parseFloat(r.valorLiquido || r.valorRecebido) || 0
    const bruto = parseFloat(r.valorBruto) || 0
    const despesa = parseFloat(r.despesaMdr) || 0

    if (modalidadePagamento === 'debito') entry.debito += liquido
    else if (modalidadePagamento === 'voucher') entry.voucher += liquido
    else if (modalidadePagamento === 'credito') entry.credito += liquido
    else if (modalidadePagamento === 'credito2x') entry.credito2x += liquido
    else if (modalidadePagamento === 'credito3x') entry.credito3x += liquido
    else if (modalidadePagamento === 'credito4x5x6x') entry.credito4x5x6x += liquido

    entry.valor_bruto_total += bruto
    entry.valor_liquido_total += liquido
    entry.despesa_mdr_total += despesa

    map.set(key, entry)
  })
  const arr = Array.from(map.values())
  return arr.sort((a, b) => {
    const ia = ordemBandeiras.indexOf(a.adquirente)
    const ib = ordemBandeiras.indexOf(b.adquirente)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1 && ib === -1) return -1
    if (ia === -1 && ib !== -1) return 1
    return a.adquirente.localeCompare(b.adquirente)
  })
})

const totaisGerais = computed(() => {
  return recebimentosAgrupados.value.reduce((acc, it) => {
    acc.debito += it.debito
    acc.credito += it.credito
    acc.credito2x += it.credito2x
    acc.credito3x += it.credito3x
    acc.credito4x5x6x += it.credito4x5x6x
    acc.voucher += it.voucher
    acc.despesaMdr += it.despesa_mdr_total
    acc.vendaBruta += it.valor_bruto_total
    acc.vendaLiquida += it.valor_liquido_total
    return acc
  }, {
    debito: 0,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    despesaMdr: 0,
    vendaBruta: 0,
    vendaLiquida: 0
  })
})

onMounted(async () => {
  initializeResponsive()
  await fetchRecebimentos()
})
</script>
