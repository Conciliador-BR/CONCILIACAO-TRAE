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
              Caixa
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
      :banco="grupo.transacoes[0]?.banco || 'Caixa'"
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
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'
import CardResumoAdquirente from '../CardResumoAdquirente.vue'
import TransacoesResumidasAjustavel from '../TransacoesResumidasAjustavel.vue'

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

const ehVrProcessamentoCaixa = (texto) => {
  const textoNorm = normalizar(texto)
  if (!textoNorm) return false

  return (
    textoNorm.includes('VR BENEFICIOS E SERVICOS DE PROCESSAMENT') ||
    (textoNorm.includes('VR BENEFICIOS') && textoNorm.includes('PROCESSAMENT'))
  )
}

const coresCartoes = {
  'TRIPAG': '#1E40AF',
  'UNICA': '#7C3AED',
  'CIELO': '#0EA5E9',
  'SIPAG': '#059669',
  'SICREDI': '#DC2626',
  'REDE': '#EA580C',
  'MAESTRO': '#2563EB',
  'VISA ELECTRON': '#1D4ED8',
  'ELO DEBITO': '#D97706',
  'MASTERCARD': '#7C3AED',
  'VISA CREDITO': '#4F46E5',
  'ELO CREDITO': '#B45309',
  'AMEX': '#0F766E',
  'STONE': '#374151',
  'AZULZINHA': '#3B82F6',
  'PAG SEGURO': '#0EA5E9'
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

const configAliases = computed(() => ({
  'TRIPAG': { categoria: 'CartÃ£o', aliases: ['TRIPAG'] },
  'UNICA': { categoria: 'CartÃ£o', aliases: ['UNICA'] },
  'CIELO': { categoria: 'CartÃ£o', aliases: ['CIELO'] },
  'SIPAG': { categoria: 'CartÃ£o', aliases: ['SIPAG'] },
  'SICREDI': { categoria: 'CartÃ£o', aliases: ['SICREDI'] },
  'REDE': { categoria: 'CartÃ£o', aliases: ['REDE', 'REDE_'] },
  'STONE': { categoria: 'CartÃ£o', aliases: ['STONE', 'STON'] },
  'AZULZINHA': { categoria: 'CartÃ£o', aliases: ['AZULZINHA'] },
  'PAG SEGURO': { categoria: 'CartÃ£o', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },
  'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
  'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR', 'PLUXEE', 'PLUXE', 'A PLUXE'] },
  'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'] },
  'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENE', 'VR BENEFICIOS SERV PROC', 'VR BENEFCIOS SERV PROC', 'PIX BANCO VR'] },
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
  'VALE CARD': { categoria: 'Voucher', aliases: ['VALE CARD', 'VALECARD', 'AGL ADQUIRENCIA', 'AGL ADQUIRENCIA LTDA'] },
  'NAIP': { categoria: 'Voucher', aliases: ['NAIP'] },
  'NUTRICASH': { categoria: 'Voucher', aliases: ['NUTRICASH', 'NUTRI CASH', 'NUTRIACH', 'NUTRIACASH', 'NUTRICASH SERVICOS LTDA', 'NUTRIACH SERVICOS LTDA', 'NUTRIACASH SERVICOS LTDA'] },
  'GREEN CARD': { categoria: 'Voucher', aliases: ['GREEN CARD'] },
  'LIBERCARD': { categoria: 'Voucher', aliases: ['MANDACARU ADMINISTRADORA', 'MANDACARU', ' LIBERCARD'] }
}))

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const textoNorm = normalizar(original)
  const ehVrProcessamento = ehVrProcessamentoCaixa(original)
  const ehPadraoVr = textoNorm.startsWith('PIX RECEBIDO VR BENEFICIOS')
    || textoNorm.includes('VR BENEFICIOS SERV PROC')
    || textoNorm.includes('VR BENEFCIOS SERV PROC')
    || textoNorm.includes('PIX BANCO VR')
  const isPix = /\bPIX\b/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
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
    const regrasRedePorBandeira = [
      { nome: 'MAESTRO', re: /\bREDE\s+MC\s+CD\b/ },
      { nome: 'VISA ELECTRON', re: /\bREDE\s+VS\s+CD\b/ },
      { nome: 'ELO DEBITO', re: /\bREDE\s+EL\s+CD\b/ },
      { nome: 'MASTERCARD', re: /\bREDE\s+MC\s+(?:CC|AT)\b/ },
      { nome: 'VISA CREDITO', re: /\bREDE\s+VS\s+(?:CC|AT)\b/ },
      { nome: 'ELO CREDITO', re: /\bREDE\s+EL\s+(?:CC|AT)\b/ },
      { nome: 'AMEX', re: /\bREDE\s+AE\s+(?:CC|AT)\b/ }
    ]

    for (const regraRede of regrasRedePorBandeira) {
      if (regraRede.re.test(textoNorm)) {
        return { nome: `${regraRede.nome} (Cartão)`, base: regraRede.nome, categoria: 'Cartão' }
      }
    }

    if (/CR\s+CPS\s+VS\s+ELECTRON/i.test(upper)) {
      return { nome: 'SIPAG (CartÃ£o)', base: 'SIPAG', categoria: 'CartÃ£o' }
    }
    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (CartÃ£o)`, base: r.nome, categoria: 'CartÃ£o' }
      }
    }
  }
  if (/\bAGL\s+ADQUIRENCIA\b/i.test(upper) || /\bAGL\b/i.test(upper)) {
    return { nome: 'VALE CARD (Voucher)', base: 'VALE CARD', categoria: 'Voucher' }
  }
  if (ehVrProcessamento) {
    return null
  }
  if (textoNorm.includes('VR BENEFICIOS') && !ehPadraoVr) {
    return null
  }
  const texto = normalizar(descricao)
  for (const [nomeCanonico, info] of Object.entries(configAliases.value)) {
    if (info.categoria !== 'Voucher') continue
    if (nomeCanonico === 'VR BENEFICIOS' && !ehPadraoVr) continue
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
  props.transacoes.forEach((t) => {
    const textoBusca = `${t?.descricao || ''} ${t?.documento ?? t?.doc ?? t?.document ?? ''}`
    if (ehVrProcessamentoCaixa(textoBusca)) return
    const det = detectarAdquirente(textoBusca)
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
  'MASTERCARD (Cartão)',
  'VISA CREDITO (Cartão)',
  'ELO CREDITO (Cartão)',
  'AMEX (Cartão)',
  'REDE (Cartão)'
]

const ordemSubgruposRede = [
  'VISA ELECTRON (Cartão)',
  'ELO DEBITO (Cartão)',
  'MAESTRO (Cartão)',
  'MASTERCARD (Cartão)',
  'VISA CREDITO (Cartão)',
  'ELO CREDITO (Cartão)',
  'AMEX (Cartão)'
]

const ordenarSubgruposRede = (subgrupos) => {
  return Object.fromEntries(
    Object.entries(subgrupos).sort(([nomeA], [nomeB]) => {
      const ordemA = ordemSubgruposRede.indexOf(nomeA)
      const ordemB = ordemSubgruposRede.indexOf(nomeB)
      const posA = ordemA === -1 ? Number.MAX_SAFE_INTEGER : ordemA
      const posB = ordemB === -1 ? Number.MAX_SAFE_INTEGER : ordemB
      if (posA !== posB) return posA - posB
      return nomeA.localeCompare(nomeB, 'pt-BR')
    })
  )
}

const resumoRede = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }
  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (nomesRede.includes(nome)) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      if (nome !== 'REDE (Cartão)') {
        dados.subgrupos[nome] = grupo
      }
    }
  }
  dados.subgrupos = ordenarSubgruposRede(dados.subgrupos)
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

const expandidos = ref({})

const toggleExpandir = (nome) => {
  expandidos.value[nome] = !expandidos.value[nome]
}

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃ£o|Voucher)\)/, '')
  return coresCartoes[base] || coresVouchers[base] || '#6B7280'
}

const obterVoucherDescricao = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return ''
  if (texto.includes('MANCACARU') || texto.includes('MANDACARU') || texto.includes('MANDACARU ADMINISTRADORA') || texto.includes('MANACARU') || texto.includes('LIBERCAD') || texto.includes('LIBER CARD') || texto.includes('LIBERCARD')) return 'LIBERCARD'
  if (ehVrProcessamentoCaixa(descricao)) {
    return ''
  }
  const ehPadraoVr = texto.startsWith('PIX RECEBIDO VR BENEFICIOS')
    || texto.includes('VR BENEFICIOS SERV PROC')
    || texto.includes('VR BENEFCIOS SERV PROC')
    || texto.includes('PIX BANCO VR')
  if (texto.includes('VR BENEFICIOS') && !ehPadraoVr) {
    return ''
  }
  if (texto.includes('AGL ADQUIRENCIA') || /\bAGL\b/.test(texto)) {
    return 'VALE CARD'
  }
  for (const [nomeCanonico, info] of Object.entries(configAliases.value)) {
    if (info.categoria !== 'Voucher') continue
    if (nomeCanonico === 'VR BENEFICIOS' && !ehPadraoVr) continue
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


