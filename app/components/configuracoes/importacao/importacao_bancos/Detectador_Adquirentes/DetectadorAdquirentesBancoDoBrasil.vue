<template>
  <div>
    <div v-if="resumoRede.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-orange-600">
            R
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">REDE</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Brasil
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transações</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoRede.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoRede.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoRede.subgrupos" :key="nome" class="bg-white">
          <div
            @click="toggleExpandir(nome)"
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-8 rounded-full" :style="{ backgroundColor: obterCor(nome) }"></div>
              <span class="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{{ nome }}</span>
            </div>

            <div class="flex items-center gap-6">
              <div class="text-right">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Qtd</span>
                <span class="text-sm font-bold text-gray-700">{{ subgrupo.quantidade }}</span>
              </div>
              <div class="text-right w-24">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Total</span>
                <span class="text-sm font-bold text-emerald-600">{{ formatarValor(subgrupo.total) }}</span>
              </div>
              <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <ChevronDownIcon v-if="!expandidos[nome]" class="w-4 h-4" />
                <ChevronUpIcon v-else class="w-4 h-4" />
              </div>
            </div>
          </div>

          <div v-show="expandidos[nome]" class="px-4 pb-4 bg-gray-50 border-t border-gray-100/50 shadow-inner">
            <div class="pt-4">
              <TransacoesResumidasAjustavel
                :transacoes="subgrupo.transacoes"
                :resolver-voucher="obterVoucherDescricao"
                :titulo="''"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <CardResumoAdquirente
      v-for="(grupo, nome) in resumoOutros"
      :key="nome"
      :adquirente="nome"
      :banco="grupo.transacoes[0]?.banco || 'Banco do Brasil'"
      :quantidade="grupo.quantidade"
      :total="grupo.total"
      :cor="obterCor(nome)"
      :transacoes="grupo.transacoes"
      :resolver-voucher="obterVoucherDescricao"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import CardResumoAdquirente from '../CardResumoAdquirente.vue'
import TransacoesResumidasAjustavel from '../TransacoesResumidasAjustavel.vue'
import { BuildingLibraryIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  transacoes: { type: Array, default: () => [] }
})

const expandidos = ref({})

const toggleExpandir = (nome) => {
  expandidos.value[nome] = !expandidos.value[nome]
}

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

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
  'PAG SEGURO': '#0EA5E9',
  'VISA ELECTRON': '#1E40AF',
  'ELO DEBITO': '#FBBF24',
  'MAESTRO': '#3B82F6',
  'CABAL DEBITO': '#B45309',
  'VISA': '#1E3A8A',
  'CABAL CREDITO': '#92400E',
  'ELO CREDITO': '#D97706',
  'MASTERCARD': '#DC2626',
  'AMEX CREDITO': '#22C55E',
  'HIPERCARD CREDITO': '#EF4444'
}

const coresVouchers = {
  'TICKET SERVICOS SA': '#EF4444',
  'PLUXEE BENEFICIOS BR': '#EF4444',
  'ALELO INSTITUICAO DE PAGAMENTO': '#F59E0B',
  'VR BENEFICIOS': '#10B981',
  'LE CARD ADMINISTRADORA': '#84CC16',
  'UP BRASIL ADMINISTRACAO': '#22C55E',
  'COMPROCARD': '#F97316',
  'ECX CARD': '#A855F7',
  'FN CARD': '#EC4899',
  'BEN VISA': '#14B8A6',
  'CREDISHOP': '#F472B6',
  'CREDI SHOP': '#F472B6',
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
    'TRIANGULO': { categoria: 'Cartão', aliases: ['TRIANGULO'] },
    'UNICA': { categoria: 'Cartão', aliases: ['UNICA'] },
    'CIELO': { categoria: 'Cartão', aliases: ['CIELO'] },
    'SIPAG': { categoria: 'Cartão', aliases: ['SIPAG'] },
    'SICREDI': { categoria: 'Cartão', aliases: ['SICREDI'] },
    'REDE': { categoria: 'Cartão', aliases: ['REDE', 'REDE_'] },
    'STONE': { categoria: 'Cartão', aliases: ['STONE', 'STON'] },
    'AZULZINHA': { categoria: 'Cartão', aliases: ['AZULZINHA'] },
    'PAG SEGURO': { categoria: 'Cartão', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },

    'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
    'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR', 'PLUXEE', 'PLUXE', 'A PLUXE'] },
    'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'] },
    'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF'] },
    'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'] },
    'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'] },
    'COMPROCARD': { categoria: 'Voucher', aliases: ['COMPROCARD'] },
    'ECX CARD': { categoria: 'Voucher', aliases: ['ECX CARD'] },
    'FN CARD': { categoria: 'Voucher', aliases: ['FN CARD'] },
    'BEN VISA': { categoria: 'Voucher', aliases: ['BEN VISA'] },
    'CREDISHOP': { categoria: 'Voucher', aliases: ['CREDISHOP'] },
    'CREDI SHOP': { categoria: 'Voucher', aliases: ['CREDI SHOP'] },
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

const detectarSubgrupoRede = (textoNorm) => {
  // Regras específicas solicitadas para REDE no Banco do Brasil
  if (/REDE[\s._-]*VENDAS[\s._-]*MASTER[\s._-]*DEBITO/.test(textoNorm)) return 'MAESTRO'
  if (/REDE[\s._-]*VENDAS[\s._-]*VISA[\s._-]*DEBITO/.test(textoNorm)) return 'VISA ELECTRON'
  if (/REDECARD/.test(textoNorm) && /FUNCAO[\s._-]*DEBITO|FUNCAO\s+DEBITO|FUNCAO/.test(textoNorm)) return 'ELO DEBITO'
  if (/REDE[\s._-]*VENDAS[\s._-]*MASTER[\s._-]*CREDIT/.test(textoNorm)) return 'MASTERCARD'
  if (/REDE[\s._-]*VENDAS[\s._-]*VISA[\s._-]*CREDITO/.test(textoNorm)) return 'VISA'
  if (/REDE[\s._-]*CREDITO/.test(textoNorm)) return 'ELO CREDITO'

  if (/REDE[\s._-]*CABA(?:L)?[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bDBTO[\s._-]*CABA(?:L)?\b/.test(textoNorm)) return 'CABAL DEBITO'
  if (/REDE[\s._-]*CABA(?:L)?[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bCR(?:EDITO)?[\s._-]*CABA(?:L)?\b/.test(textoNorm)) return 'CABAL CREDITO'
  if (/VISA[\s.-]*DB|DEBITO[\s.-]*VISA/.test(textoNorm)) return 'VISA ELECTRON'
  if (/ELO[\s.-]*DB|DEBITO[\s.-]*ELO/.test(textoNorm)) return 'ELO DEBITO'
  if (/MAST[\s.-]*DB|MASTER[\s.-]*DEBITO|DEBITO[\s.-]*MASTER|MAESTRO/.test(textoNorm)) return 'MAESTRO'
  if (/VISA[\s.-]*CD|VISA[\s.-]*AT|CREDITO[\s.-]*VISA/.test(textoNorm)) return 'VISA'
  if (/ELO[\s.-]*CD|ELO[\s.-]*AT|CREDITO[\s.-]*ELO/.test(textoNorm)) return 'ELO CREDITO'
  if (/MAST[\s.-]*CD|MAST[\s.-]*AT|MASTER[\s.-]*CREDITO|CREDITO[\s.-]*MASTER/.test(textoNorm)) return 'MASTERCARD'
  if (/AMEX[\s.-]*CD|AMEX[\s.-]*AT|CREDITO[\s.-]*AMEX|AMERICAN[\s.-]*EXPRESS/.test(textoNorm)) return 'AMEX CREDITO'
  if (/HIPER[\s.-]*CD|HIPER[\s.-]*AT|CREDITO[\s.-]*HIPER|HIPERCARD/.test(textoNorm)) return 'HIPERCARD CREDITO'
  return 'REDE'
}

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const textoNorm = normalizar(original)
  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  const regrasCartoes = [
    { nome: 'UNICA', re: /\bTRIANGULO(?:[_\s-]|$)/i },
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
    if (/^REDE[_\s-]/i.test(original) || /\bREDE\b/.test(upper)) {
      const subgrupo = detectarSubgrupoRede(textoNorm)
      return { nome: `${subgrupo} (Cartão)`, base: subgrupo, categoria: 'Cartão' }
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

const nomesRede = [
  'VISA ELECTRON (Cartão)',
  'ELO DEBITO (Cartão)',
  'MAESTRO (Cartão)',
  'CABAL DEBITO (Cartão)',
  'VISA (Cartão)',
  'CABAL CREDITO (Cartão)',
  'ELO CREDITO (Cartão)',
  'MASTERCARD (Cartão)',
  'AMEX CREDITO (Cartão)',
  'HIPERCARD CREDITO (Cartão)',
  'REDE (Cartão)'
]

const resumoRede = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }
  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (nomesRede.includes(nome)) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      dados.subgrupos[nome] = grupo
    }
  }
  return dados
})

const resumoOutros = computed(() => {
  const dados = {}
  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (!nomesRede.includes(nome)) {
      dados[nome] = grupo
    }
  }
  return dados
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
</script>

<style scoped>
</style>

