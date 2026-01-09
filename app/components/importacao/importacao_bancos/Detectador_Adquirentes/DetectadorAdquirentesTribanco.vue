<template>
  <div>
    <!-- Container Especial UNICA -->
    <div v-if="resumoUnica.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <!-- Cabeçalho UNICA -->
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
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transações</p>
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

          <!-- Conteúdo Expandido -->
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
  'MASTERCARD': '#DC2626'
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
    'TRIPAG': { categoria: 'Cartão', aliases: ['TRIPAG'] },
    'UNICA': { categoria: 'Cartão', aliases: ['UNICA'] },
    'CIELO': { categoria: 'Cartão', aliases: ['CIELO'] },
    'SIPAG': { categoria: 'Cartão', aliases: ['SIPAG'] },
    'SICREDI': { categoria: 'Cartão', aliases: ['SICREDI'] },
    'REDE': { categoria: 'Cartão', aliases: ['REDE', 'REDE_'] },
    'STONE': { categoria: 'Cartão', aliases: ['STONE', 'STON'] },
    'AZULZINHA': { categoria: 'Cartão', aliases: ['AZULZINHA'] },
    'PAG SEGURO': { categoria: 'Cartão', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },
    'VISA ELECTRON': { categoria: 'Cartão', aliases: [] },
    'ELO DEBITO': { categoria: 'Cartão', aliases: [] },
    'MAESTRO': { categoria: 'Cartão', aliases: [] },
    'VISA': { categoria: 'Cartão', aliases: [] },
    'ELO CREDITO': { categoria: 'Cartão', aliases: [] },
    'MASTERCARD': { categoria: 'Cartão', aliases: [] },

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
    // Regras Específicas Tribanco/Tripag/Unica (Separar por Bandeira)
    // Débito
    if (/\bDBTO\s+VISA\b/.test(upper)) return { nome: 'VISA ELECTRON (Cartão)', base: 'VISA ELECTRON', categoria: 'Cartão' }
    if (/\bDBTO\s+ELO\b/.test(upper)) return { nome: 'ELO DEBITO (Cartão)', base: 'ELO DEBITO', categoria: 'Cartão' }
    if (/\bDBTO\s+MAESTRO\b/.test(upper)) return { nome: 'MAESTRO (Cartão)', base: 'MAESTRO', categoria: 'Cartão' }
    
    // Crédito
    if (/\bCREDITO\s+VISA\b|\bCR\s+VISA\b/.test(upper)) return { nome: 'VISA (Cartão)', base: 'VISA', categoria: 'Cartão' }
    if (/\bCREDITO\s+ELO\b|\bCRTO\s+ELO\b/.test(upper)) return { nome: 'ELO CREDITO (Cartão)', base: 'ELO CREDITO', categoria: 'Cartão' }
    if (/\bCR\s+MASTERCARD\b|\bCREDITO\s+MASTERCARD\b/.test(upper)) return { nome: 'MASTERCARD (Cartão)', base: 'MASTERCARD', categoria: 'Cartão' }

    // Antecipação (Considerar Crédito)
    if (/ANTC|ANTEC|ANTECI/.test(upper)) {
        if (/VISA/.test(upper)) return { nome: 'VISA (Cartão)', base: 'VISA', categoria: 'Cartão' }
        if (/MASTER/.test(upper)) return { nome: 'MASTERCARD (Cartão)', base: 'MASTERCARD', categoria: 'Cartão' }
        if (/ELO/.test(upper)) return { nome: 'ELO CREDITO (Cartão)', base: 'ELO CREDITO', categoria: 'Cartão' }
    }

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

const nomesUnica = [
  'VISA ELECTRON (Cartão)',
  'ELO DEBITO (Cartão)',
  'MAESTRO (Cartão)',
  'VISA (Cartão)',
  'ELO CREDITO (Cartão)',
  'MASTERCARD (Cartão)',
  'TRIPAG (Cartão)',
  'UNICA (Cartão)',
  'SIPAG (Cartão)'
]

const resumoUnica = computed(() => {
  const dados = {
    quantidade: 0,
    total: 0,
    subgrupos: {}
  }
  
  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (nomesUnica.includes(nome)) {
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
    if (!nomesUnica.includes(nome)) {
      dados[nome] = grupo
    }
  }
  return dados
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
</script>

<style scoped>
</style>
