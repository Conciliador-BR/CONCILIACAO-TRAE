<template>
  <div v-if="registros.length > 0" class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
      <div>
        <h2 class="text-xl font-semibold">{{ titulo }}</h2>
        <p class="text-sm text-gray-600 mt-1">Consulta tecnica com os registros brutos de voucher retornados pela API da REDE.</p>
      </div>
      <div class="flex items-center gap-3 text-sm text-gray-600">
        <span>Total: {{ registros.length }} registros</span>
        <label class="flex items-center gap-2">
          <span>Mostrar</span>
          <select v-model.number="itemsPerPage" class="border border-gray-300 rounded px-2 py-1 bg-white">
            <option v-for="opcao in [10, 20, 50, 100, 200, 500, 1000, 5000]" :key="opcao" :value="opcao">{{ opcao }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Movimento</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Hora Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU Host</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Autorização</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Resumo Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">TID</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Tipo</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Bruto</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Status</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Parcelas</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Brand Code</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Bandeira Rede</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Issuer Voucher</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Brand Desc</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Kind</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Type</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Transaction Type</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Product Type</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Empresa</th>
            <th class="px-2 py-2 text-left text-xs font-medium">EC</th>
            <th class="px-2 py-2 text-left text-xs font-medium">JSON Bruto</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(registro, index) in registrosPaginados"
            :key="registro.__rawKey || index"
            :class="index % 2 === 0 ? 'bg-white align-top' : 'bg-gray-50 align-top'"
          >
            <td class="px-2 py-2 text-xs">{{ formatDate(getFirstDefined(registro, ['movementDate'])) }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(getFirstDefined(registro, ['saleDate', 'transactionDate', 'captureDate'])) }}</td>
            <td class="px-2 py-2 text-xs">{{ getFirstDefined(registro, ['saleHour', 'saleTime', 'transactionTime', 'captureTime']) || '-' }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ getFirstDefined(registro, ['nsu', 'transactionCode']) || '-' }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ getFirstDefined(registro, ['nsuHost']) || '-' }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ getFirstDefined(registro, ['authorizationCode']) || '-' }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ getFirstDefined(registro, ['saleSummaryNumber', 'salesSummaryNumber']) || '-' }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ getFirstDefined(registro, ['tid']) || '-' }}</td>
            <td class="px-2 py-2 text-xs font-semibold">{{ getVoucherType(registro) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(getFirstDefined(registro, ['amount', 'grossAmount', 'grossValue'])) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(getFirstDefined(registro, ['netAmount', 'netValue'])) }}</td>
            <td class="px-2 py-2 text-xs">{{ getFirstDefined(registro, ['status']) || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ getFirstDefined(registro, ['installments']) || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ getBrandCode(registro) || '-' }}</td>
            <td class="px-2 py-2 text-xs font-semibold">{{ getNetworkBrand(registro) }}</td>
            <td class="px-2 py-2 text-xs">{{ getVoucherIssuer(registro) }}</td>
            <td class="px-2 py-2 text-xs">{{ getFirstDefined(registro, ['brandCodeDescription', 'brandDescription', 'brandName', 'cardBrand.description', '__consultaRede.brandName']) || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ getFirstDefined(registro, ['kind', 'subType', 'cardType']) || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ getFirstDefined(registro, ['type']) || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ getFirstDefined(registro, ['transactionType.description', 'transactionType.name', 'transactionType.code', 'transactionType']) || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ getFirstDefined(registro, ['productType.description', 'productType.name', 'productType.code', 'productType']) || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ registro.empresa || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ registro.ec || registro.matriz || '-' }}</td>
            <td class="px-2 py-2 text-xs">
              <details>
                <summary class="cursor-pointer text-blue-600 hover:underline">Ver JSON</summary>
                <div class="mt-2 relative">
                  <pre class="whitespace-pre overflow-x-auto text-[11px] bg-gray-100 rounded p-3 max-w-2xl border border-gray-200 shadow-inner">{{ formatJson(registro) }}</pre>
                </div>
              </details>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>Mostrando {{ inicioIndice + 1 }} a {{ fimIndice }} de {{ totalItems }}</span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="currentPage === 1"
          @click="currentPage -= 1"
        >
          Anterior
        </button>
        <span>Pagina {{ currentPage }} de {{ totalPages }}</span>
        <button
          type="button"
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="currentPage === totalPages"
          @click="currentPage += 1"
        >
          Proxima
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  registros: {
    type: Array,
    default: () => []
  },
  titulo: {
    type: String,
    default: '4. Vouchers Brutos da API REDE'
  }
})

const NETWORK_BRAND_CODE_MAP = {
  '1': 'VISA',
  '2': 'MASTERCARD',
  '3': 'AMEX',
  '14': 'ELO',
  '15': 'HIPERCARD'
}

const VOUCHER_ISSUER_CODE_MAP = {
  '16': 'ALELO',
  '17': 'TICKET',
  '18': 'SODEXO',
  '19': 'VR',
  '20': 'BEN VISA VALE',
  '21': 'GREEN CARD',
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
  '52': 'TICKET'
}

const itemsPerPage = ref(20)
const currentPage = ref(1)

const totalItems = computed(() => props.registros.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)))
const inicioIndice = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const fimIndice = computed(() => Math.min(totalItems.value, inicioIndice.value + itemsPerPage.value))
const registrosPaginados = computed(() => props.registros.slice(inicioIndice.value, fimIndice.value))

watch(() => props.registros, () => {
  currentPage.value = 1
}, { deep: true })

watch(itemsPerPage, () => {
  currentPage.value = 1
})

const getValueByPath = (source, path) => {
  return String(path || '')
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), source)
}

const getFirstDefined = (source, paths = []) => {
  for (const path of paths) {
    const value = getValueByPath(source, path)
    if (value !== null && value !== undefined && value !== '') {
      return value
    }
  }

  return null
}

const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

const getBrandCode = (registro) => {
  return String(getFirstDefined(registro, [
    'cardBrand.code',
    'cardBrand.id',
    'brandCode',
    'brand.code',
    'brand.id',
    '__consultaRede.brandCode'
  ]) || '').trim()
}

const getNetworkBrand = (registro) => {
  const brandCode = getBrandCode(registro)
  if (NETWORK_BRAND_CODE_MAP[brandCode]) return NETWORK_BRAND_CODE_MAP[brandCode]

  const texto = normalizeText(getFirstDefined(registro, [
    'cardBrand.description',
    'cardBrand.name',
    'brandCodeDescription',
    'brandName',
    'brandDescription',
    '__consultaRede.brandName'
  ]))

  if (texto.includes('MASTER')) return 'MASTERCARD'
  if (texto.includes('VISA')) return 'VISA'
  if (texto.includes('AMEX') || texto.includes('AMERICAN')) return 'AMEX'
  if (texto.includes('ELO')) return 'ELO'
  if (texto.includes('HIPER')) return 'HIPERCARD'
  return '-'
}

const getVoucherIssuer = (registro) => {
  const brandCode = getBrandCode(registro)
  if (VOUCHER_ISSUER_CODE_MAP[brandCode]) return VOUCHER_ISSUER_CODE_MAP[brandCode]

  return getFirstDefined(registro, [
    'issuer',
    'issuerName',
    'issuer.description',
    'issuer.name',
    'brandName',
    'brandDescription',
    'brandCodeDescription'
  ]) || '-'
}

const getVoucherType = (registro) => {
  const texto = normalizeText(getFirstDefined(registro, [
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
    'modality.description',
    'modality.name',
    'modality.code',
    'modality',
    'type',
    'kind',
    'subType',
    'cardType'
  ]))

  if (
    texto.includes('VOUCHER')
    || texto.includes('BENEF')
    || texto.includes('MULTI BENEFICIO')
    || texto.includes('MULTI BENEF')
    || texto.includes('VCR')
  ) {
    return 'VOUCHER'
  }

  return texto || 'VOUCHER'
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
}

const formatDate = (value) => {
  const text = String(value || '').trim()
  if (!text) return '-'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text
  const isoDate = text.split(/[T\s]+/)[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }
  return text
}

const formatJson = (value) => {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value || '')
  }
}
</script>
