<template>
  <div>
    <div v-if="resumoCielo.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-sky-500">
            C
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">CIELO (Cartão)</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Bradesco
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transações</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoCielo.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoCielo.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoCielo.subgrupos" :key="nome" class="bg-white">
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
      :banco="grupo.transacoes[0]?.banco || 'Bradesco'"
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
  'VISA ELECTRON': '#1E40AF',
  'MAESTRO': '#3B82F6',
  'ELO DEBITO': '#FBBF24',
  'MASTERCARD': '#DC2626',
  'VISA': '#1E3A8A',
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
  return {
    'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: [
      'RECEBIMENTO FORNECEDOR ALELO INSTITUICAO',
      'RECEBIMENTO ALELO',
      'ALELO INSTITUICAO DE PAGAMENTO',
      'ALELO'
    ] },
    'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: [
      'TED TRANSF ELET DISPON REMET PLUXEE BENEFICIOS BR',
      'TED-TRANSF ELET DISPON REMET.PLUXEE BENEFICIOS BR',
      'PLUXE BENEFICIOS BR',
      'PLUXEE',
      'PLUXE'
    ] },
    'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: [
      'TICKET SERVICOS SA',
      'TICKET SERVICOS',
      'TICKET'
    ] },
    'VR BENEFICIOS': { categoria: 'Voucher', aliases: [
      'VR BENEFICIOS',
      'VR BENEF'
    ] },
    'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: [
      'LE CARD ADMINISTRADORA',
      'LE CARD ADMINISTRADOR',
      'LECARD'
    ] },
    'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: [
      'UP BRASIL ADMINISTRACAO',
      'UP BRASIL'
    ] },
    'COMPROCARD': { categoria: 'Voucher', aliases: [ 'COMPROCARD' ] },
    'ECX CARD': { categoria: 'Voucher', aliases: [ 'ECX CARD' ] },
    'FN CARD': { categoria: 'Voucher', aliases: [ 'FN CARD' ] },
    'BEN VISA': { categoria: 'Voucher', aliases: [ 'BEN VISA' ] },
    'CREDSHOP': { categoria: 'Voucher', aliases: [ 'CREDSHOP' ] },
    'CRED SHOP': { categoria: 'Voucher', aliases: [ 'CRED SHOP' ] },
    'RC CARD': { categoria: 'Voucher', aliases: [ 'RC CARD' ] },
    'GOOD CARD': { categoria: 'Voucher', aliases: [ 'GOOD CARD' ] },
    'BIG CARD': { categoria: 'Voucher', aliases: [ 'BIG CARD' ] },
    'BK CARD': { categoria: 'Voucher', aliases: [ 'BK CARD' ] },
    'BRASILCARD': { categoria: 'Voucher', aliases: [ 'BRASIL CARD', 'BOLT CARD'] },
    'BOLTCARD': { categoria: 'Voucher', aliases: [ 'BOLTCARD' ] },
    'CABAL PRE': { categoria: 'Voucher', aliases: [ 'CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CABAL BRASIL', 'CREDENCIADOR CABAL BRASIL' ] },
    'VEROCARD': { categoria: 'Voucher', aliases: [ 'VEROCARD' ] },
    'VEROCHEQUE': { categoria: 'Voucher', aliases: [ 'VEROCHEQUE' ] },
    'FACECARD': { categoria: 'Voucher', aliases: [ 'FACECARD' ] },
    'VALE CARD': { categoria: 'Voucher', aliases: [ 'VALE CARD', 'VALECARD' ] },
    'NAIP': { categoria: 'Voucher', aliases: [ 'NAIP' ] }
  }
})

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

const contemAliasExato = (textoNormalizado, aliasNormalizado) => {
  const aliasEscapado = aliasNormalizado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const re = new RegExp(`(?:^|\\s)${aliasEscapado}(?:\\s|$)`)
  return re.test(textoNormalizado)
}

const expandidos = ref({})

const toggleExpandir = (nome) => {
  expandidos.value[nome] = !expandidos.value[nome]
}

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const texto = normalizar(descricao)

  if (/\bAMEX\b|\bAMERICAN\s*EXPRESS\b/.test(texto)) {
    return { nome: 'AMEX (Cartão)', base: 'AMEX', categoria: 'Cartão', grupo: 'CIELO (Cartão)' }
  }

  if (/\bHIPER(?:CARD)?\b/.test(texto)) {
    return { nome: 'HIPERCARD (Cartão)', base: 'HIPERCARD', categoria: 'Cartão', grupo: 'CIELO (Cartão)' }
  }

  if (/\bCARTAO\s+VISA\s+ELECTRON\s+CIELO\b/.test(texto)) {
    return { nome: 'VISA ELECTRON (Cartão)', base: 'VISA ELECTRON', categoria: 'Cartão', grupo: 'CIELO (Cartão)' }
  }

  if (/\bCIELO\b.*\bVDA\s+DEBITO\s+MASTER\b.*\bCIELO\b|\bDEBITO\s+MASTER\b/.test(texto)) {
    return { nome: 'MAESTRO (Cartão)', base: 'MAESTRO', categoria: 'Cartão', grupo: 'CIELO (Cartão)' }
  }

  if (/\bC?IELO\b.*\bVDA\s+DEBITO\s+ELO\b.*\bCIELO\b|\bDEBITO\s+ELO\b/.test(texto)) {
    return { nome: 'ELO DEBITO (Cartão)', base: 'ELO DEBITO', categoria: 'Cartão', grupo: 'CIELO (Cartão)' }
  }

  if (/\bC?IELO\b.*\bVDA\s+CREDITO\s+MASTER\b.*\bCIELO\b|\bCREDITO\s+MASTER\b/.test(texto)) {
    return { nome: 'MASTERCARD (Cartão)', base: 'MASTERCARD', categoria: 'Cartão', grupo: 'CIELO (Cartão)' }
  }

  if (/\bVENDAS?\s+CARTAO\s+DE\s+CRED(?:I|U)TO\b/.test(texto)) {
    return { nome: 'VISA (Cartão)', base: 'VISA', categoria: 'Cartão', grupo: 'CIELO (Cartão)' }
  }

  if (/\bC?IELO\b.*\bVDA\s+CREDITO\s+ELO\b.*\bCIELO\b|\bCREDITO\s+ELO\b/.test(texto)) {
    return { nome: 'ELO CREDITO (Cartão)', base: 'ELO CREDITO', categoria: 'Cartão', grupo: 'CIELO (Cartão)' }
  }

  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.\?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  const podeDetectarCartao = !(isPix && !regrasCartoes[5].re.test(original))
  if (podeDetectarCartao) {
    if (/CR\s+CPS\s+VS\s+ELECTRON/i.test(upper)) {
      return { nome: 'SIPAG (CartÃ£o)', base: 'SIPAG', categoria: 'CartÃ£o' }
    }
    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (Cartão)`, base: r.nome, categoria: 'Cartão', grupo: `${r.nome} (Cartão)` }
      }
    }
  }
  for (const [nomeCanonico, info] of Object.entries(configAliases.value)) {
    for (const alias of info.aliases) {
      const aliasNorm = normalizar(alias)
      if (contemAliasExato(texto, aliasNorm)) {
        return { nome: `${nomeCanonico} (${info.categoria})`, base: nomeCanonico, categoria: info.categoria, grupo: `${nomeCanonico} (${info.categoria})` }
      }
    }
  }
  return null
}

const resumoAgrupado = computed(() => {
  const grupos = {}
  props.transacoes.forEach(t => {
    const det = detectarAdquirente(t.descricao)
    if (!det) return
    const grupoNome = det.grupo || det.nome
    if (!grupos[grupoNome]) {
      grupos[grupoNome] = { transacoes: [], quantidade: 0, total: 0, subgrupos: {} }
    }
    grupos[grupoNome].transacoes.push(t)
    grupos[grupoNome].quantidade += 1
    const valor = Number(t.valorNumerico ?? t.valor ?? 0) || 0
    grupos[grupoNome].total += valor

    if (grupoNome === 'CIELO (Cartão)') {
      const nomeSubgrupo = det.base
      if (!grupos[grupoNome].subgrupos[nomeSubgrupo]) {
        grupos[grupoNome].subgrupos[nomeSubgrupo] = { transacoes: [], quantidade: 0, total: 0 }
      }
      grupos[grupoNome].subgrupos[nomeSubgrupo].transacoes.push(t)
      grupos[grupoNome].subgrupos[nomeSubgrupo].quantidade += 1
      grupos[grupoNome].subgrupos[nomeSubgrupo].total += valor
    }
  })
  return grupos
})

const resumoCielo = computed(() => resumoAgrupado.value['CIELO (Cartão)'] || { transacoes: [], quantidade: 0, total: 0, subgrupos: {} })

const resumoOutros = computed(() => {
  const grupos = { ...resumoAgrupado.value }
  delete grupos['CIELO (Cartão)']
  return grupos
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
    for (const alias of info.aliases) {
      const aliasNorm = normalizar(alias)
      if (contemAliasExato(texto, aliasNorm)) {
        return nomeCanonico
      }
    }
  }
  return ''
}
</script>

<style scoped>
</style>


