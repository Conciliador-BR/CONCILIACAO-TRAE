<template>
  <div>
    <!-- Container Especial REDE -->
    <div v-if="resumoRede.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <!-- CabeÃƒÂ§alho REDE -->
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-orange-600">
            R
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">REDE</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              ItaÃƒÂº
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">TransaÃƒÂ§ÃƒÂµes</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoRede.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoRede.total) }}</p>
          </div>
        </div>
      </div>

      <!-- Lista de Sub-bandeiras -->
      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoRede.subgrupos" :key="nome" class="bg-white">
          <!-- Linha de Resumo da Bandeira -->
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

          <!-- ConteÃƒÂºdo Expandido -->
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

    <div v-if="resumoPagSeguro.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-sky-600">
            P
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">PAGSEGURO</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              ItaÃƒÂº
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">TransaÃƒÂ§ÃƒÂµes</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoPagSeguro.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoPagSeguro.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoPagSeguro.subgrupos" :key="nome" class="bg-white">
          <div 
            @click="toggleExpandir(nome)"
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none"
          >
            <div class="flex items-center gap-3">
               <div class="w-2 h-8 rounded-full" :style="{ backgroundColor: obterCor(subgrupo.nomeExibicao) }"></div>
               <span class="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{{ subgrupo.nomeExibicao }}</span>
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

    <!-- Outros Cards (Vouchers, etc) -->
    <CardResumoAdquirente
      v-for="(grupo, nome) in resumoOutros"
      :key="nome"
      :adquirente="nome"
      :banco="grupo.transacoes[0]?.banco || 'ItaÃƒÂº'"
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
  'PAGSEGURO': '#0EA5E9',
  'VISA ELECTRON': '#1E40AF',
  'ELO DEBITO': '#FBBF24',
  'MAESTRO': '#3B82F6',
  'CABAL DEBITO': '#B45309',
  'VISA': '#1E3A8A',
  'CABAL CREDITO': '#92400E',
  'ELO CREDITO': '#D97706',
  'MASTERCARD': '#DC2626',
  'AMEX CREDITO': '#22C55E',
  'HIPERCARD CREDITO': '#EF4444',
  'PIX': '#10B981'
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
  'CABAL': '#FACC15',
  'CABAL PRE': '#FACC15',
  'VEROCARD': '#C084FC',
  'VEROCHEQUE': '#C084FC',
  'FACECARD': '#FB923C',
  'VALE CARD': '#38BDF8',
  'NAIP': '#FDE047'
}

const configAliases = computed(() => {
  const base = {
    'TRIPAG': { categoria: 'CartÃƒÂ£o', aliases: ['TRIPAG'] },
    'UNICA': { categoria: 'CartÃƒÂ£o', aliases: ['UNICA'] },
    'CIELO': { categoria: 'CartÃƒÂ£o', aliases: ['CIELO'] },
    'SIPAG': { categoria: 'CartÃƒÂ£o', aliases: ['SIPAG'] },
    'SICREDI': { categoria: 'CartÃƒÂ£o', aliases: ['SICREDI'] },
    'REDE': { categoria: 'CartÃƒÂ£o', aliases: ['REDE', 'REDECARD',] },
    'STONE': { categoria: 'CartÃƒÂ£o', aliases: ['STONE', 'STON'] },
    'AZULZINHA': { categoria: 'CartÃƒÂ£o', aliases: ['AZULZINHA'] },
    'PAG SEGURO': { categoria: 'CartÃƒÂ£o', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },

    'VISA ELECTRON': { categoria: 'CartÃƒÂ£o', aliases: [] },
    'ELO DEBITO': { categoria: 'CartÃƒÂ£o', aliases: [] },
    'MAESTRO': { categoria: 'CartÃƒÂ£o', aliases: [] },
    'VISA': { categoria: 'CartÃƒÂ£o', aliases: [] },
    'ELO CREDITO': { categoria: 'CartÃƒÂ£o', aliases: [] },
    'MASTERCARD': { categoria: 'CartÃƒÂ£o', aliases: [] },
    'AMEX CREDITO': { categoria: 'CartÃƒÂ£o', aliases: [] },
    'HIPERCARD CREDITO': { categoria: 'CartÃƒÂ£o', aliases: [] },

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
    'CABAL': { categoria: 'Voucher', aliases: ['CABAL CD', 'CABAL CABA CD'] },
    'CABAL PRE': { categoria: 'Voucher', aliases: ['CABAL PRE', 'CREDENCIADOR CABAL PRE'] },
    'VEROCARD': { categoria: 'Voucher', aliases: ['VEROCARD'] },
    'VEROCHEQUE': { categoria: 'Voucher', aliases: ['VEROCHEQUE'] },
    'FACECARD': { categoria: 'Voucher', aliases: ['FACECARD'] },
    'VALE CARD': { categoria: 'Voucher', aliases: ['VALE CARD', 'VALECARD'] },
    'NAIP': { categoria: 'Voucher', aliases: ['NAIP'] }
  }
  return base
})

const extrairCamposTransacao = (entrada) => {
  if (entrada && typeof entrada === 'object') {
    return {
      descricao: String(entrada?.descricao || ''),
      documento: String(entrada?.documento ?? entrada?.doc ?? entrada?.document ?? '')
    }
  }
  return {
    descricao: String(entrada || ''),
    documento: ''
  }
}

const detectarAdquirente = (entrada) => {
  const { descricao, documento } = extrairCamposTransacao(entrada)
  const original = String(descricao || '')
  const documentoOriginal = String(documento || '')
  const contexto = `${original} ${documentoOriginal}`.trim()
  const upper = contexto.toUpperCase()
  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  const regrasCartoes = [
    { nome: 'TRIPAG', re: /\bTRIPAG(?:[_\s-]|$)/i },
    { nome: 'UNICA', re: /\bUNICA(?:[_\s-]|$)/i },
    { nome: 'CIELO', re: /\bCIELO(?:[_\s-]|$)/i },
    { nome: 'SIPAG', re: /\bSIPAG(?:[_\s-]|$)/i },
    { nome: 'SICREDI', re: /\bSICREDI(?:[_\s-]|$)/i },
    { nome: 'STONE', re: /\bSTONE(?:[_\s-]|$)/i },
    { nome: 'AZULZINHA', re: /\bAZULZINHA(?:[_\s-]|$)/i }
  ]
  const podeDetectarCartao = !/\bBOLETO\s*PAGO\b.*\bREDE\b/.test(upper)
  if (podeDetectarCartao) {
    if (/CR\s+CPS\s+VS\s+ELECTRON/i.test(upper)) {
      return { nome: 'SIPAG (CartÃƒÂ£o)', base: 'SIPAG', categoria: 'CartÃƒÂ£o' }
    }

    if (/\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b|\bPAGSEG\b|PAGSEG(?:URO)?/.test(upper)) {
      if (/TED\s*290(?:[.,]0+)?\s*PAGSEG(?:URO)?\s*IN\w*/.test(upper)) return { nome: 'PIX (CartÃƒÂ£o)', base: 'PIX', categoria: 'CartÃƒÂ£o' }
      if (/\bPAGSEG(?:URO)?\b.*\bELO\b[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bPAGSEG(?:URO)?\b.*\bDBTO[\s._-]*ELO\b/.test(upper)) return { nome: 'ELO DEBITO (CartÃƒÂ£o)', base: 'ELO DEBITO', categoria: 'CartÃƒÂ£o' }
      if (/\bPAGSEG(?:URO)?\b.*\bELO\b[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bPAGSEG(?:URO)?\b.*\bCR(?:EDITO)?[\s._-]*ELO\b/.test(upper)) return { nome: 'ELO CREDITO (CartÃƒÂ£o)', base: 'ELO CREDITO', categoria: 'CartÃƒÂ£o' }
      if (/\bPAGSEG(?:URO)?\b.*\bMAST(?:ER(?:CARD)?)?\b[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bPAGSEG(?:URO)?\b.*\bDBTO[\s._-]*MAESTRO\b/.test(upper)) return { nome: 'MAESTRO (CartÃƒÂ£o)', base: 'MAESTRO', categoria: 'CartÃƒÂ£o' }
      if (/\bPAGSEG(?:URO)?\b.*\bMAST(?:ER(?:CARD)?)?\b[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bPAGSEG(?:URO)?\b.*\bCR(?:EDITO)?[\s._-]*MAST(?:ER(?:CARD)?)?\b/.test(upper)) return { nome: 'MASTERCARD (CartÃƒÂ£o)', base: 'MASTERCARD', categoria: 'CartÃƒÂ£o' }
      if (/\bPAGSEG(?:URO)?\b.*\bVISA\b[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bPAGSEG(?:URO)?\b.*\bDBTO[\s._-]*VISA\b|\bPAGSEG(?:URO)?\b.*\bVISA[\s._-]*ELECTRON\b/.test(upper)) return { nome: 'VISA ELECTRON (CartÃƒÂ£o)', base: 'VISA ELECTRON', categoria: 'CartÃƒÂ£o' }
      if (/\bPAGSEG(?:URO)?\b.*\bVISA\b[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bPAGSEG(?:URO)?\b.*\bCR(?:EDITO)?[\s._-]*VISA\b/.test(upper)) return { nome: 'VISA (CartÃƒÂ£o)', base: 'VISA', categoria: 'CartÃƒÂ£o' }
      if (/\bPAGSEG(?:URO)?\b.*\bAMEX\b|\bPAGSEG(?:URO)?\b.*\bAMERICAN\s*EXPRESS\b/.test(upper)) return { nome: 'AMEX CREDITO (CartÃƒÂ£o)', base: 'AMEX CREDITO', categoria: 'CartÃƒÂ£o' }
      if (/\bPAGSEG(?:URO)?\b.*\bHIPER(?:CARD)?\b/.test(upper)) return { nome: 'HIPERCARD CREDITO (CartÃƒÂ£o)', base: 'HIPERCARD CREDITO', categoria: 'CartÃƒÂ£o' }
    }

    // Regras EspecÃƒÂ­ficas REDE/ItaÃƒÂº (Separar por Bandeira)
    if (/REDE[\s._-]*CABA(?:L)?[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bDBTO[\s._-]*CABA(?:L)?\b/.test(upper)) {
      return { nome: 'CABAL DEBITO (CartÃƒÂ£o)', base: 'CABAL DEBITO', categoria: 'CartÃƒÂ£o' }
    }
    if (/REDE[\s._-]*CABA(?:L)?[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bCR(?:EDITO)?[\s._-]*CABA(?:L)?\b/.test(upper)) {
      return { nome: 'CABAL CREDITO (CartÃƒÂ£o)', base: 'CABAL CREDITO', categoria: 'CartÃƒÂ£o' }
    }

    // DÃƒÂ©bito
    if (/VISA[\s.-]*DB/.test(upper)) return { nome: 'VISA ELECTRON (CartÃƒÂ£o)', base: 'VISA ELECTRON', categoria: 'CartÃƒÂ£o' }
    if (/ELO[\s.-]*DB/.test(upper)) return { nome: 'ELO DEBITO (CartÃƒÂ£o)', base: 'ELO DEBITO', categoria: 'CartÃƒÂ£o' }
    if (/MAST[\s.-]*DB/.test(upper)) return { nome: 'MAESTRO (CartÃƒÂ£o)', base: 'MAESTRO', categoria: 'CartÃƒÂ£o' }
    
    // CrÃƒÂ©dito
    if (/VISA[\s.-]*CD|VISA[\s.-]*AT/.test(upper)) return { nome: 'VISA (CartÃƒÂ£o)', base: 'VISA', categoria: 'CartÃƒÂ£o' }
    if (/ELO[\s.-]*CD|ELO[\s.-]*AT/.test(upper)) return { nome: 'ELO CREDITO (CartÃƒÂ£o)', base: 'ELO CREDITO', categoria: 'CartÃƒÂ£o' }
    if (/MAST[\s.-]*CD|MAST[\s.-]*AT/.test(upper)) return { nome: 'MASTERCARD (CartÃƒÂ£o)', base: 'MASTERCARD', categoria: 'CartÃƒÂ£o' }
    if (/AMEX[\s.-]*CD|AMEX[\s.-]*AT/.test(upper)) return { nome: 'AMEX CREDITO (CartÃƒÂ£o)', base: 'AMEX CREDITO', categoria: 'CartÃƒÂ£o' }
    if (/HIPER[\s.-]*CD|HIPER[\s.-]*AT/.test(upper)) return { nome: 'HIPERCARD CREDITO (CartÃƒÂ£o)', base: 'HIPERCARD CREDITO', categoria: 'CartÃƒÂ£o' }

    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (CartÃƒÂ£o)`, base: r.nome, categoria: 'CartÃƒÂ£o' }
      }
    }
  }
  const texto = normalizar(contexto)
  if (!/\bREDE\b/.test(upper) && /\bCABAL\b(?:[\s._-]*CABA(?:L)?)?[\s._-]*(CD|AT|CRED|CREDITO)\b|\b(CD|AT|CRED|CREDITO)\b[\s._-]*CABA(?:L)?[\s._-]*CABAL\b|\b(CD|AT|CRED|CREDITO)\b[\s._-]*CABAL\b/.test(upper)) {
    return { nome: 'CABAL (Voucher)', base: 'CABAL', categoria: 'Voucher' }
  }
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
    const det = detectarAdquirente(t)
    if (!det) return
    const descricaoUpper = String(t.descricao || '').toUpperCase()
    const isPagSeguro = /PAGSEG(?:URO)?/.test(descricaoUpper) || /TED\s*290(?:[.,]0+)?\s*PAGSEG(?:URO)?\s*IN\w*/.test(descricaoUpper)
    const nomeGrupo = det.categoria === 'CartÃƒÂ£o' && isPagSeguro ? `${det.nome}__PAGSEGURO` : det.nome

    if (!grupos[nomeGrupo]) {
      grupos[nomeGrupo] = { transacoes: [], quantidade: 0, total: 0, nomeExibicao: det.nome, pagseguro: det.categoria === 'CartÃƒÂ£o' && isPagSeguro }
    }
    grupos[nomeGrupo].transacoes.push(t)
    grupos[nomeGrupo].quantidade += 1
    const valor = Number(t.valorNumerico ?? t.valor ?? 0) || 0
    grupos[nomeGrupo].total += valor
  })
  return grupos
})

const nomesRede = [
  'VISA ELECTRON (CartÃƒÂ£o)',
  'ELO DEBITO (CartÃƒÂ£o)',
  'MAESTRO (CartÃƒÂ£o)',
  'CABAL DEBITO (CartÃƒÂ£o)',
  'VISA (CartÃƒÂ£o)',
  'CABAL CREDITO (CartÃƒÂ£o)',
  'ELO CREDITO (CartÃƒÂ£o)',
  'MASTERCARD (CartÃƒÂ£o)',
  'AMEX CREDITO (CartÃƒÂ£o)',
  'HIPERCARD CREDITO (CartÃƒÂ£o)'
]

const resumoRede = computed(() => {
  const dados = {
    quantidade: 0,
    total: 0,
    subgrupos: {}
  }
  
  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (!grupo.pagseguro && nomesRede.includes(grupo.nomeExibicao)) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      dados.subgrupos[nome] = grupo
    }
  }
  
  return dados
})

const resumoPagSeguro = computed(() => {
  const dados = {
    quantidade: 0,
    total: 0,
    subgrupos: {}
  }
  
  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (grupo.pagseguro) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      dados.subgrupos[nome] = grupo
    }
  }
  
  return dados
})

const PRIORIDADE_AUTORIZADORAS = ['UNICA', 'CIELO', 'STONE', 'GETNET', 'SAFRA', 'REDE', 'SIPAG', 'AZULZINHA', 'PAGSEGURO', 'PAG SEGURO']

const normalizarPrioridade = (nome) => {
  return String(nome || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ \((CARTAO|CARTÃƒO|VOUCHER)\)/g, '')
    .trim()
}

const ordenarGruposResumo = (entries) => {
  return [...entries].sort(([nomeA], [nomeB]) => {
    const baseA = normalizarPrioridade(nomeA)
    const baseB = normalizarPrioridade(nomeB)
    const ordemA = PRIORIDADE_AUTORIZADORAS.indexOf(baseA)
    const ordemB = PRIORIDADE_AUTORIZADORAS.indexOf(baseB)
    const posA = ordemA === -1 ? Number.MAX_SAFE_INTEGER : ordemA
    const posB = ordemB === -1 ? Number.MAX_SAFE_INTEGER : ordemB
    if (posA !== posB) return posA - posB
    return String(nomeA || '').localeCompare(String(nomeB || ''), 'pt-BR')
  })
}

const resumoOutros = computed(() => {
  const dados = {}
  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (!grupo.pagseguro && !nomesRede.includes(grupo.nomeExibicao)) {
      dados[nome] = grupo
    }
  }
  return Object.fromEntries(ordenarGruposResumo(Object.entries(dados)))
})

const totalGeral = computed(() => {
  return Object.values(resumoPorAdquirente.value).reduce((acc, d) => acc + d.total, 0)
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃƒÂ£o|Voucher)\)/, '')
  return coresCartoes[base] || coresVouchers[base] || '#6B7280'
}

const obterVoucherDescricao = (entrada) => {
  const { descricao, documento } = extrairCamposTransacao(entrada)
  const texto = normalizar(`${descricao || ''} ${documento || ''}`)
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




