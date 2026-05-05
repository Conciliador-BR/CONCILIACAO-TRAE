<template>
  <div>
    <!-- Container Especial UNICA -->
    <div v-if="resumoUnica.quantidade > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <!-- CabeÃ§alho UNICA -->
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-indigo-700">
            U
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">UNICA</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Tribanco
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">TransaÃ§Ãµes</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoUnica.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoUnica.total) }}</p>
          </div>
        </div>
      </div>

      <!-- Lista de Sub-bandeiras -->
      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoUnica.subgrupos" :key="nome" class="bg-white">
          <!-- Linha de Resumo da Bandeira -->
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

          <!-- ConteÃºdo Expandido -->
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

    <div v-if="resumoStone.quantidade > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-gray-700">
            S
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">STONE</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Tribanco
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">TransaÃ§Ãµes</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoStone.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoStone.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoStone.subgrupos" :key="nome" class="bg-white">
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

    <!-- Outros Cards (Vouchers, etc) -->
    <CardResumoAdquirente
      v-for="(grupo, nome) in resumoOutros"
      :key="nome"
      :adquirente="nome"
      :banco="grupo.transacoes[0]?.banco || 'Tribanco'"
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
  'ELO DEBITO': '#FBBF24',
  'MAESTRO': '#3B82F6',
  'VISA': '#1E3A8A',
  'ELO CREDITO': '#D97706',
  'MASTERCARD': '#DC2626',
  'BANESCARD DEBITO': '#0F766E',
  'AMEX': '#0EA5E9',
  'HIPERCARD': '#BE123C'
}

const coresVouchers = {
  'TED C RECEBIDA-TICKET': '#EF4444',
  'TED C RECEBIDA-PLUXEE BENEFICIOS BR': '#EF4444',
  'Alelo': '#F59E0B',
  'LE CARD': '#84CC16',
  'UP BRASIL': '#22C55E',
  'VR BENEFICIOS': '#10B981',
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
    'REDE': { categoria: 'CartÃ£o', aliases: ['REDE', 'REDE_'] },
    'STONE': { categoria: 'CartÃ£o', aliases: ['STONE', 'STON'] },
    'AZULZINHA': { categoria: 'CartÃ£o', aliases: ['AZULZINHA'] },
    'PAG SEGURO': { categoria: 'CartÃ£o', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },
    'VISA ELECTRON': { categoria: 'CartÃ£o', aliases: [] },
    'ELO DEBITO': { categoria: 'CartÃ£o', aliases: [] },
    'MAESTRO': { categoria: 'CartÃ£o', aliases: [] },
    'VISA': { categoria: 'CartÃ£o', aliases: [] },
    'ELO CREDITO': { categoria: 'CartÃ£o', aliases: [] },
    'MASTERCARD': { categoria: 'CartÃ£o', aliases: [] },

    'TICKET SERVICOS': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
    'PLUXEE BENEFICIOS': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR', 'PLUXEE', 'PLUXE', 'A PLUXE'] },
    'Alelo': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'] },
    'LE CARD': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'] },
    'UP BRASIL': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'] },

    'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF'] },
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
    'CABAL PRE': { categoria: 'Voucher', aliases: ['CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CRTO CABAL SICOOB SO'] },
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
    if (/MASTER\s+DEBITO\s+STONE/.test(upper)) return { nome: 'MAESTRO (CartÃ£o)', base: 'MAESTRO', categoria: 'CartÃ£o', grupo: 'STONE' }
    if (/VISA\s+DEBITO\s+STONE/.test(upper)) return { nome: 'VISA ELECTRON (CartÃ£o)', base: 'VISA ELECTRON', categoria: 'CartÃ£o', grupo: 'STONE' }
    if (/ELO\s+DEBITO\s+STONE/.test(upper)) return { nome: 'ELO DEBITO (CartÃ£o)', base: 'ELO DEBITO', categoria: 'CartÃ£o', grupo: 'STONE' }
    if (/BANESCARD\s+DEBITO\s+STONE/.test(upper)) return { nome: 'BANESCARD DEBITO (CartÃ£o)', base: 'BANESCARD DEBITO', categoria: 'CartÃ£o', grupo: 'STONE' }
    if (/VISA\s+CREDITO\s+STONE/.test(upper)) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'CartÃ£o', grupo: 'STONE' }
    if (/MASTER\s+CREDITO\s+STONE/.test(upper)) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'CartÃ£o', grupo: 'STONE' }
    if (/ELO\s+CREDITO\s+STONE/.test(upper)) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'CartÃ£o', grupo: 'STONE' }
    if (/(AMEX|AMERICAN\s+EXPRESS)(?:\s+CREDITO)?\s+STONE/.test(upper)) return { nome: 'AMEX (CartÃ£o)', base: 'AMEX', categoria: 'CartÃ£o', grupo: 'STONE' }
    if (/HIPERCARD(?:\s+CREDITO)?\s+STONE/.test(upper)) return { nome: 'HIPERCARD (CartÃ£o)', base: 'HIPERCARD', categoria: 'CartÃ£o', grupo: 'STONE' }

    // Regras EspecÃ­ficas Tribanco/Tripag/Unica (Separar por Bandeira)
    // DÃ©bito
    if (/\bDBTO\s+VISA\b/.test(upper)) return { nome: 'VISA ELECTRON (CartÃ£o)', base: 'VISA ELECTRON', categoria: 'CartÃ£o', grupo: 'UNICA' }
    if (/\bDBTO\s+ELO\b/.test(upper)) return { nome: 'ELO DEBITO (CartÃ£o)', base: 'ELO DEBITO', categoria: 'CartÃ£o', grupo: 'UNICA' }
    if (/\bDBTO\s+MAESTRO\b/.test(upper)) return { nome: 'MAESTRO (CartÃ£o)', base: 'MAESTRO', categoria: 'CartÃ£o', grupo: 'UNICA' }
    
    // CrÃ©dito
    if (/\bCREDITO\s+VISA\b|\bCR\s+VISA\b/.test(upper)) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'CartÃ£o', grupo: 'UNICA' }
    if (/\bCREDITO\s+ELO\b|\bCRTO\s+ELO\b/.test(upper)) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'CartÃ£o', grupo: 'UNICA' }
    if (/\bCR\s+MASTERCARD\b|\bCREDITO\s+MASTERCARD\b/.test(upper)) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'CartÃ£o', grupo: 'UNICA' }

    // AntecipaÃ§Ã£o (Considerar CrÃ©dito)
    if (/ANTC|ANTEC|ANTECI/.test(upper)) {
        if (/VISA/.test(upper)) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'CartÃ£o', grupo: 'UNICA' }
        if (/MASTER/.test(upper)) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'CartÃ£o', grupo: 'UNICA' }
        if (/ELO/.test(upper)) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'CartÃ£o', grupo: 'UNICA' }
    }

    if (/CR\s+CPS\s+VS\s+ELECTRON/i.test(upper)) {
      return { nome: 'SIPAG (CartÃ£o)', base: 'SIPAG', categoria: 'CartÃ£o', grupo: 'UNICA' }
    }
    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (CartÃ£o)`, base: r.nome, categoria: 'CartÃ£o', grupo: r.nome === 'STONE' ? 'STONE' : 'UNICA' }
      }
    }
  }
  const texto = normalizar(descricao)
  for (const [nomeCanonico, info] of Object.entries(configAliases.value)) {
    if (info.categoria !== 'Voucher') continue
    for (const alias of info.aliases) {
      const aliasNorm = normalizar(alias)
      if (texto.includes(aliasNorm)) {
        return { nome: `${nomeCanonico} (${info.categoria})`, base: nomeCanonico, categoria: info.categoria, grupo: 'OUTROS' }
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
    const chave = `${det.grupo || 'OUTROS'}|${det.nome}`
    if (!grupos[chave]) {
      grupos[chave] = { transacoes: [], quantidade: 0, total: 0, nome: det.nome, grupo: det.grupo || 'OUTROS' }
    }
    grupos[chave].transacoes.push(t)
    grupos[chave].quantidade += 1
    const valor = Number(t.valorNumerico ?? t.valor ?? 0) || 0
    grupos[chave].total += valor
  })
  return grupos
})

const nomesUnica = [
  'VISA ELECTRON (CartÃ£o)',
  'ELO DEBITO (CartÃ£o)',
  'MAESTRO (CartÃ£o)',
  'VISA (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'TRIPAG (CartÃ£o)',
  'UNICA (CartÃ£o)',
  'SIPAG (CartÃ£o)'
]

const nomesStone = [
  'VISA ELECTRON (CartÃ£o)',
  'ELO DEBITO (CartÃ£o)',
  'MAESTRO (CartÃ£o)',
  'BANESCARD DEBITO (CartÃ£o)',
  'VISA (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'AMEX (CartÃ£o)',
  'HIPERCARD (CartÃ£o)'
]

const resumoUnica = computed(() => {
  const dados = {
    quantidade: 0,
    total: 0,
    subgrupos: {}
  }
  
  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (grupo.grupo === 'UNICA' && nomesUnica.includes(grupo.nome)) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      dados.subgrupos[grupo.nome] = grupo
    }
  }
  
  return dados
})

const resumoStone = computed(() => {
  const dados = {
    quantidade: 0,
    total: 0,
    subgrupos: {}
  }
  
  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (grupo.grupo === 'STONE' && nomesStone.includes(grupo.nome)) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      dados.subgrupos[grupo.nome] = grupo
    }
  }
  
  return dados
})

const resumoOutros = computed(() => {
  const dados = {}
  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (grupo.grupo === 'OUTROS') {
      dados[grupo.nome] = grupo
    }
  }
  return dados
})

const totalGeral = computed(() => {
  return Object.values(resumoPorAdquirente.value).reduce((acc, d) => acc + d.total, 0)
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃ£o|Voucher)\)/, '').replace(/\s+STONE$/, '')
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


