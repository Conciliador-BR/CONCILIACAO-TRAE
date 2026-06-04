<template>
  <div>
    <div v-if="resumoSafra.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-gray-900">
            S
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">SAFRAPAY</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Safra
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transações</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoSafra.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoSafra.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoSafra.subgrupos" :key="nome" class="bg-white">
          <div
            @click="toggleExpandir(nome)"
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-8 rounded-full" :style="{ backgroundColor: obterCor(nome) }"></div>
              <span class="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{{ nome }}</span>
            </div>

            <div class="flex items-center gap-8 pr-2">
              <div class="text-right">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Qtd</span>
                <span class="text-sm font-bold text-gray-700">{{ subgrupo.quantidade }}</span>
              </div>
              <div class="text-left min-w-[140px]">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Total</span>
                <span class="text-sm font-bold text-emerald-600">{{ formatarValor(subgrupo.total) }}</span>
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
      :banco="grupo.transacoes[0]?.banco || 'Safra'"
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
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'

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
  if (texto.includes('MANCACARU') || texto.includes('MANDACARU') || texto.includes('MANDACARU ADMINISTRADORA') || texto.includes('MANACARU') || texto.includes('LIBERCAD') || texto.includes('LIBER CARD') || texto.includes('LIBERCARD')) return 'LIBERCARD'
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
  'SAFRAPAY': '#111827',
  'VISA ELECTRON': '#1E40AF',
  'MAESTRO': '#3B82F6',
  'ELO DEBITO': '#FBBF24',
  'VISA': '#1E3A8A',
  'MASTERCARD': '#DC2626',
  'ELO CREDITO': '#D97706',
  'AMEX': '#22C55E',
  'HIPERCARD': '#EF4444'
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
    'TRIPAG': { categoria: 'CartÃ£o', aliases: ['TRIPAG'] },
    'UNICA': { categoria: 'CartÃ£o', aliases: ['UNICA'] },
    'CIELO': { categoria: 'CartÃ£o', aliases: ['CIELO'] },
    'SIPAG': { categoria: 'CartÃ£o', aliases: ['SIPAG'] },
    'SICREDI': { categoria: 'CartÃ£o', aliases: ['SICREDI'] },
    'REDE': { categoria: 'CartÃ£o', aliases: ['REDE', 'REDECARD'] },
    'STONE': { categoria: 'CartÃ£o', aliases: ['STONE', 'STON'] },
    'AZULZINHA': { categoria: 'CartÃ£o', aliases: ['AZULZINHA'] },
    'PAG SEGURO': { categoria: 'CartÃ£o', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK', 'PAGSEG'] },
    'SAFRAPAY': { categoria: 'CartÃ£o', aliases: ['SAFRAPAY', 'SAFRA PAY'] },

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

const detectarSubgrupoSafra = (textoNorm) => {
  if (!textoNorm.includes('SAFRAPAY')) return 'SAFRAPAY'

  const ehDebito =
    textoNorm.includes('VENDAS CARTAO DEBITO') ||
    textoNorm.includes('RESUMO VENDAS CARTAO DEBITO') ||
    textoNorm.includes('VENDAS CARTAO DEB') ||
    textoNorm.includes('RESUMO VENDAS CARTAO DEB')
  const ehCredito =
    textoNorm.includes('VENDAS CARTAO CREDITO') ||
    textoNorm.includes('RESUMO VENDAS CARTAO CREDITO') ||
    textoNorm.includes('VENDAS CARTAO CRED') ||
    textoNorm.includes('RESUMO VENDAS CARTAO CRED')

  if (ehDebito && textoNorm.includes('VISA ELECTRON')) return 'VISA ELECTRON'
  if (ehDebito && (textoNorm.includes('MAESTRO') || textoNorm.includes('MASTERCARD PRE PAGO'))) return 'MAESTRO'
  if (ehDebito && textoNorm.includes('ELO DEBITO')) return 'ELO DEBITO'

  if (ehCredito && textoNorm.includes('AMERICAN EXPRESS')) return 'AMEX'
  if (ehCredito && textoNorm.includes('HIPERCARD')) return 'HIPERCARD'
  if (ehCredito && /\bSAFRAPAY\s+VISA\b/.test(textoNorm)) return 'VISA'
  if (ehCredito && /\bSAFRAPAY\s+MASTER(?:CARD)?\b/.test(textoNorm)) return 'MASTERCARD'
  if (ehCredito && /\bSAFRAPAY\s+ELO\b/.test(textoNorm)) return 'ELO CREDITO'

  return 'SAFRAPAY'
}

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const textoNorm = normalizar(original)
  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  const regrasCartoes = [
    { nome: 'TRIPAG', re: /\bTRIPAG(?:[_\s-]|$)/i },
    { nome: 'UNICA', re: /\bUNICA(?:[_\s-]|$)/i },
    { nome: 'CIELO', re: /\bCIELO(?:[_\s-]|$)/i },
    { nome: 'SIPAG', re: /\bSIPAG(?:[_\s-]|$)/i },
    { nome: 'SICREDI', re: /\bSICREDI(?:[_\s-]|$)/i },
    { nome: 'REDE', re: /\bREDE(?:CARD)?(?:[_\s-]|$)/i },
    { nome: 'STONE', re: /\bSTONE(?:[_\s-]|$)/i },
    { nome: 'AZULZINHA', re: /\bAZULZINHA(?:[_\s-]|$)/i },
    { nome: 'PAG SEGURO', re: /PAG\s?SEGURO|PAGSEGURO|PAGBANK|PAGSEG/i },
    { nome: 'SAFRAPAY', re: /\bSAFRAPAY\b|\bSAFRA\s?PAY\b/i }
  ]
  const podeDetectarCartao = !(isPix && !regrasCartoes[5].re.test(original))
  if (podeDetectarCartao) {
    if (/\bSAFRAPAY\b|\bSAFRA\s?PAY\b/i.test(original)) {
      const subgrupo = detectarSubgrupoSafra(textoNorm)
      return { nome: `${subgrupo} (CartÃ£o)`, base: subgrupo, categoria: 'CartÃ£o' }
    }
    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (CartÃ£o)`, base: r.nome, categoria: 'CartÃ£o' }
      }
    }
  }
  const texto = textoNorm
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

const nomesSafra = [
  'VISA ELECTRON (CartÃ£o)',
  'MAESTRO (CartÃ£o)',
  'ELO DEBITO (CartÃ£o)',
  'VISA (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'AMEX (CartÃ£o)',
  'HIPERCARD (CartÃ£o)'
]

const resumoSafra = computed(() => {
  const dados = {
    quantidade: 0,
    total: 0,
    subgrupos: {}
  }

  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (nomesSafra.includes(nome)) {
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
    if (!nomesSafra.includes(nome)) {
      dados[nome] = grupo
    }
  }
  return dados
})

const totalGeral = computed(() => {
  return Object.values(resumoPorAdquirente.value).reduce((acc, d) => acc + d.total, 0)
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃ£o|Voucher)\)/, '')
  return coresCartoes[base] || coresVouchers[base] || '#6B7280'
}

const obterVoucherDescricao = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return ''
  if (texto.includes('MANCACARU') || texto.includes('MANDACARU') || texto.includes('MANDACARU ADMINISTRADORA') || texto.includes('MANACARU') || texto.includes('LIBERCAD') || texto.includes('LIBER CARD') || texto.includes('LIBERCARD')) return 'LIBERCARD'
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



