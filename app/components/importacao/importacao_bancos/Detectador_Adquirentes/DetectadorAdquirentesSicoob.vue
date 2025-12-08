<template>
  <div v-if="Object.keys(resumoPorAdquirente).length > 0" class="bg-white rounded-lg shadow-md p-6 mt-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Adquirentes Detectados (Sicoob)</h3>
      <div class="text-sm text-gray-600">{{ Object.keys(resumoPorAdquirente).length }} adquirente(s)</div>
    </div>

    <div class="space-y-4">
      <div v-for="(dados, nome) in resumoPorAdquirente" :key="nome" class="border border-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
          <h4 class="text-md font-semibold text-gray-700 flex items-center">
            <span class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: obterCor(nome) }"></span>
            {{ nome }}
          </h4>
          <div class="text-right">
            <div class="text-sm text-gray-500">{{ dados.quantidade }} transação(ões)</div>
            <div class="text-lg font-bold" :class="[
              dados.total >= 0 ? 'text-green-600' : 'text-red-600'
            ]">
              {{ formatarValor(dados.total) }}
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(t, idx) in dados.transacoes" :key="idx">
                <td class="px-4 py-2 text-sm text-gray-700">{{ t.data_formatada || t.data || 'N/A' }}</td>
                <td class="px-4 py-2 text-sm text-gray-700">{{ t.descricao || 'N/A' }}</td>
                <td class="px-4 py-2 text-sm text-gray-700">{{ obterVoucherDescricao(t.descricao) || 'N/A' }}</td>
                <td class="px-4 py-2 text-sm text-right font-medium" :class="t.valorNumerico >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ formatarValor(t.valorNumerico || t.valor || 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-gray-200">
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-700">Total Geral:</span>
        <span class="text-lg font-bold" :class="[
          totalGeral >= 0 ? 'text-green-600' : 'text-red-600'
        ]">
          {{ formatarValor(totalGeral) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  transacoes: { type: Array, default: () => [] }
})

const normalizar = (texto) => {
  if (!texto) return ''
  return String(texto)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const coresCartoes = {
  'TRIPAG': '#1E40AF',
  'UNICA': '#7C3AED',
  'CIELO': '#0EA5E9',
  'SIPAG': '#059669',
  'SICREDI': '#DC2626',
  'REDE': '#EA580C',
  'STONE': '#374151',
  'AZULZINHA': '#3B82F6',
  'PAG SEGURO': '#0EA5E9'
}

const coresVouchers = {
  'TICKET SERVICOS SA': '#EF4444',
  'ALELO INSTITUICAO DE PAGAMENTO': '#F59E0B',
  'VR BENEFICIOS': '#10B981',
  'LE CARD ADMINISTRADORA': '#84CC16',
  'UP BRASIL ADMINISTRACAO': '#22C55E',
  'COMPROCARD': '#F97316',
  'ECX CARD': '#A855F7',
  'FN CARD': '#EC4899',
  'BEN VISA': '#14B8A6',
  'CREDSHOP': '#F472B6',
  'CRED SHOP': '#F472B6',
  'RC CARD': '#FB7185',
  'GOOD CARD': '#34D399',
  'BIG CARD': '#FBBF24',
  'BK CARD': '#A78BFA',
  'BRASILCARD': '#F87171',
  'BOLTCARD': '#60A5FA',
  'CABAL PRE': '#FACC15',
  'VEROCARD': '#C084FC',
  'VEROCHEQUE': '#C084FC',
  'FACECARD': '#FB923C',
  'VALE CARD': '#38BDF8',
  'NAIP': '#FDE047'
}

const configAliases = computed(() => {
  const base = {
    'TRIPAG': { categoria: 'Cartão', aliases: ['TRIPAG'] },
    'UNICA': { categoria: 'Cartão', aliases: ['UNICA'] },
    'CIELO': { categoria: 'Cartão', aliases: ['CIELO'] },
    'SIPAG': { categoria: 'Cartão', aliases: ['SIPAG'] },
    'SICREDI': { categoria: 'Cartão', aliases: ['SICREDI'] },
    'REDE': { categoria: 'Cartão', aliases: ['REDE', 'REDE_'] },
    'STONE': { categoria: 'Cartão', aliases: ['STONE', 'STON'] },
    'AZULZINHA': { categoria: 'Cartão', aliases: ['AZULZINHA'] },
    'PAG SEGURO': { categoria: 'Cartão', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },

    'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
    'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'] },
    'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF'] },
    'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'] },
    'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'] },
    'COMPROCARD': { categoria: 'Voucher', aliases: ['COMPROCARD'] },
    'ECX CARD': { categoria: 'Voucher', aliases: ['ECX CARD'] },
    'FN CARD': { categoria: 'Voucher', aliases: ['FN CARD'] },
    'BEN VISA': { categoria: 'Voucher', aliases: ['BEN VISA'] },
    'CREDSHOP': { categoria: 'Voucher', aliases: ['CREDSHOP'] },
    'CRED SHOP': { categoria: 'Voucher', aliases: ['CRED SHOP'] },
    'RC CARD': { categoria: 'Voucher', aliases: ['RC CARD'] },
    'GOOD CARD': { categoria: 'Voucher', aliases: ['GOOD CARD'] },
    'BIG CARD': { categoria: 'Voucher', aliases: ['BIG CARD'] },
    'BK CARD': { categoria: 'Voucher', aliases: ['BK CARD'] },
    'BRASILCARD': { categoria: 'Voucher', aliases: ['BRASILCARD'] },
    'BOLTCARD': { categoria: 'Voucher', aliases: ['BOLTCARD'] },
    'CABAL PRE': { categoria: 'Voucher', aliases: ['CABAL PRE', 'CREDENCIADOR CABAL PRE'] },
    'VEROCARD': { categoria: 'Voucher', aliases: ['VEROCARD'] },
    'VEROCHEQUE': { categoria: 'Voucher', aliases: ['VEROCHEQUE'] },
    'FACECARD': { categoria: 'Voucher', aliases: ['FACECARD'] },
    'VALE CARD': { categoria: 'Voucher', aliases: ['VALE CARD', 'VALECARD'] },
    'NAIP': { categoria: 'Voucher', aliases: ['NAIP'] }
  }
  return base
})

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.\?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  const regrasCartoes = [
    { nome: 'TRIPAG', re: /\bTRIPAG(?:[_\s-]|$)/i },
    { nome: 'UNICA', re: /\bUNICA(?:[_\s-]|$)/i },
    { nome: 'CIELO', re: /\bCIELO(?:[_\s-]|$)/i },
    { nome: 'SIPAG', re: /\bSIPAG(?:[_\s-]|$)/i },
    { nome: 'SICREDI', re: /\bSICREDI(?:[_\s-]|$)/i },
    { nome: 'REDE', re: /^REDE[_\s-]/i },
    { nome: 'STONE', re: /\bSTONE(?:[_\s-]|$)/i },
    { nome: 'AZULZINHA', re: /\bAZULZINHA(?:[_\s-]|$)/i },
    { nome: 'PAG SEGURO', re: /\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b/i }
  ]
  const podeDetectarCartao = !(isPix && !regrasCartoes[5].re.test(original))
  if (podeDetectarCartao) {
    if (/CR\s+CPS\s+VS\s+ELECTRON/i.test(upper)) {
      return { nome: 'SIPAG (Cartão)', base: 'SIPAG', categoria: 'Cartão' }
    }
    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (Cartão)`, base: r.nome, categoria: 'Cartão' }
      }
    }
  }
  const texto = normalizar(descricao)
  for (const [nomeCanonico, info] of Object.entries(configAliases.value)) {
    if (info.categoria !== 'Voucher') continue
    for (const alias of info.aliases) {
      const aliasNorm = normalizar(alias)
      if (texto.includes(aliasNorm)) {
        return { nome: `${nomeCanonico} (${info.categoria})`, base: nomeCanonico, categoria: info.categoria }
      }
    }
  }
  return null
}

const resumoPorAdquirente = computed(() => {
  const grupos = {}
  props.transacoes.forEach(t => {
    const det = detectarAdquirente(t.descricao)
    if (!det) return
    if (!grupos[det.nome]) {
      grupos[det.nome] = { transacoes: [], quantidade: 0, total: 0 }
    }
    grupos[det.nome].transacoes.push(t)
    grupos[det.nome].quantidade += 1
    const valor = Number(t.valorNumerico ?? t.valor ?? 0) || 0
    grupos[det.nome].total += valor
  })
  return grupos
})

const totalGeral = computed(() => {
  return Object.values(resumoPorAdquirente.value).reduce((acc, d) => acc + d.total, 0)
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((Cartão|Voucher)\)/, '')
  return coresCartoes[base] || coresVouchers[base] || '#6B7280'
}

const obterVoucherDescricao = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return ''
  for (const [nomeCanonico, info] of Object.entries(configAliases.value)) {
    if (info.categoria !== 'Voucher') continue
    for (const alias of info.aliases) {
      const aliasNorm = normalizar(alias)
      if (texto.includes(aliasNorm)) {
        return nomeCanonico
      }
    }
  }
  return ''
}

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}
</script>

<style scoped>
</style>
