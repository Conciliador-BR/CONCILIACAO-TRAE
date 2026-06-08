<template>
  <div>
    <div v-if="resumoUnica.quantidade > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-indigo-700">
            U
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">UNICA</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Sicoob
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

      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoUnica.subgrupos" :key="nome" class="bg-white">
          <div @click="toggleExpandir(nome)" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none">
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

    <div v-if="resumoRede.quantidade > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-orange-600">
            R
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">REDE</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Sicoob
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
          <div @click="toggleExpandir(nome)" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none">
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

    <div v-if="resumoCielo.quantidade > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-sky-500">
            C
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">CIELO</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Sicoob
            </p>
          </div>
        </div>
        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">TransaÃ§Ãµes</p>
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
          <div @click="toggleExpandir(nome)" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none">
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
      :banco="grupo.transacoes[0]?.banco || 'Sicoob'"
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
import { detectarAgrupamentoResumoTribanco } from '~/composables/PageControladoria/controladoria-recebimentos/recebimentoscontainer/recebimentosUtils'

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

const enviarDebugResumoSicoob = (hypothesisId, msg, data = {}) => {
  fetch('http://127.0.0.1:7777/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'sicoob-resumo-card',
      runId: 'pre-fix',
      hypothesisId,
      location: 'DetectadorAdquirentesSicoob.vue',
      msg: `[DEBUG] ${msg}`,
      data,
      ts: Date.now()
    })
  }).catch(() => {})
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
  'VISA': '#1E3A8A',
  'MASTERCARD': '#DC2626',
  'ELO CREDITO': '#D97706',
  'VISA VOUCHER': '#14B8A6',
  'MASTERCARD VOUCHER': '#06B6D4',
  'ELO VOUCHER': '#22C55E',
  'AMEX': '#0EA5E9',
  'HIPERCARD': '#BE123C'
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
    'TRIPAG': { categoria: 'CartÃƒÂ£o', aliases: ['TRIPAG'] },
    'UNICA': { categoria: 'CartÃƒÂ£o', aliases: ['UNICA'] },
    'CIELO': { categoria: 'CartÃƒÂ£o', aliases: ['CIELO'] },
    'SIPAG': { categoria: 'CartÃƒÂ£o', aliases: ['SIPAG'] },
    'SICREDI': { categoria: 'CartÃƒÂ£o', aliases: ['SICREDI'] },
    'REDE': { categoria: 'CartÃƒÂ£o', aliases: ['REDE', 'REDE_'] },
    'STONE': { categoria: 'CartÃƒÂ£o', aliases: ['STONE', 'STON'] },
    'AZULZINHA': { categoria: 'CartÃƒÂ£o', aliases: ['AZULZINHA'] },
    'PAG SEGURO': { categoria: 'CartÃƒÂ£o', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },

    'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
    'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR', 'PLUXEE', 'PLUXE', 'A PLUXE'] },
    'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'] },
    'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF', 'VR BENEFCIO', 'BANCO VR'] },
    'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD', 'LE CARD ADM'] },
    'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'] },
    'COMPROCARD': { categoria: 'Voucher', aliases: ['COMPROCARD'] },
    'ECX CARD': { categoria: 'Voucher', aliases: ['ECX CARD'] },
    'FN CARD': { categoria: 'Voucher', aliases: ['FN CARD'] },
    'BEN VISA': { categoria: 'Voucher', aliases: ['BEN VISA'] },
    'CREDSHOP': { categoria: 'Voucher', aliases: ['CREDSHOP'] },
    'CRED SHOP': { categoria: 'Voucher', aliases: ['CRED SHOP'] },
    'RC CARD': { categoria: 'Voucher', aliases: ['RC CARD'] },
    'GOOD CARD': { categoria: 'Voucher', aliases: ['GOODCARD'] },
    'BIG CARD': { categoria: 'Voucher', aliases: ['BIG CARD'] },
    'BK CARD': { categoria: 'Voucher', aliases: ['BK CARD'] },
    'BRASILCARD': { categoria: 'Voucher', aliases: ['BRASILCARD'] },
    'BOLTCARD': { categoria: 'Voucher', aliases: ['BOLTCARD'] },
    'CABAL PRE': { categoria: 'Voucher', aliases: ['CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CRTO CABAL SICOOB SO', 'CARTAO CABAL SICOOB SO', 'CABAL SICOOB SO'] },
    'VEROCARD': { categoria: 'Voucher', aliases: ['VEROCARD'] },
    'VEROCHEQUE': { categoria: 'Voucher', aliases: ['VEROCHEQUE REFEICOES LTDA', 'VEROCHEQUE'] },
    'FACECARD': { categoria: 'Voucher', aliases: ['FACECARD'] },
    'VALE CARD': { categoria: 'Voucher', aliases: ['VALE CARD', 'VALECARD'] },
    'NAIP': { categoria: 'Voucher', aliases: ['NAIP'] },
  }
  return base
})

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const upperNorm = upper.replace(/[._-]/g, ' ')
  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.\?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  const isCielo = /\bCIELO(?:[\s._-]|$)/.test(upperNorm)
  const isRede = /\bREDE(?:CARD)?(?:[\s._-]|$)/.test(upperNorm)

  if (isRede) {
    const pat = upperNorm.match(/\b(VISA|MASTERCARD|MASTER|ELO)\s+PAT\b|\bPAT\s+(VISA|MASTERCARD|MASTER|ELO)\b/)
    if (pat) {
      const bandeiraPat = (pat[1] || pat[2] || '').trim()
      // #region debug-point A:detectar-adquirente-rede-pat
      enviarDebugResumoSicoob('A', 'detectarAdquirente encontrou PAT da REDE', {
        descricao: original,
        bandeiraPat,
        isRede,
        isCielo
      })
      // #endregion
      if (bandeiraPat === 'MASTER' || bandeiraPat === 'MASTERCARD') {
        return { nome: 'MASTERCARD VOUCHER (CartÃ£o)', base: 'MASTERCARD', categoria: 'CartÃ£o', grupo: 'REDE' }
      }
      if (bandeiraPat === 'ELO') {
        return { nome: 'ELO VOUCHER (CartÃ£o)', base: 'ELO CREDITO', categoria: 'CartÃ£o', grupo: 'REDE' }
      }
      if (bandeiraPat === 'VISA') {
        return { nome: 'VISA VOUCHER (CartÃ£o)', base: 'VISA', categoria: 'CartÃ£o', grupo: 'REDE' }
      }
    }
  }

  if (isCielo) {
    const pat = upperNorm.match(/\b(VISA|MASTERCARD|ELO|MAESTRO)\s+PAT\b|\bPAT\s+(VISA|MASTERCARD|ELO|MAESTRO)\b/)
    if (pat) {
      const bandeiraPat = (pat[1] || pat[2] || '').trim()
      if (bandeiraPat) return { nome: `${bandeiraPat} PAT (Voucher)`, base: `${bandeiraPat} PAT`, categoria: 'Voucher', grupo: 'CIELO' }
    }

    const ehDebito = /\b(DEB|DEBITO|DBTO)\b/.test(upperNorm)
    const ehCredito = /\b(CREDITO|CRED|CRE|CRTO|CR)\b/.test(upperNorm)

    // CIELO/Sicoob - regras amplas para cobrir variaÃ§Ãµes do arquivo
    if (ehDebito && /\bVISA\b/.test(upperNorm)) return { nome: 'VISA ELECTRON (CartÃ£o)', base: 'VISA ELECTRON', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (ehDebito && /\b(MAESTRO|MASTER|MASTERCARD)\b/.test(upperNorm)) return { nome: 'MAESTRO (CartÃ£o)', base: 'MAESTRO', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (ehDebito && /\bELO\b/.test(upperNorm)) return { nome: 'ELO DEBITO (CartÃ£o)', base: 'ELO DEBITO', categoria: 'CartÃ£o', grupo: 'CIELO' }

    if (ehCredito && /\bVISA\b/.test(upperNorm)) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (ehCredito && /\b(MASTERCARD|MASTER)\b/.test(upperNorm)) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (ehCredito && /\bELO\b/.test(upperNorm)) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (ehCredito && /\b(AMEX|AMERICAN\s+EXP(?:RESS|RE)?)\b/.test(upperNorm)) return { nome: 'AMEX (CartÃ£o)', base: 'AMEX', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (ehCredito && /\b(HIPERCARD|HIPER)\b/.test(upperNorm)) return { nome: 'HIPERCARD (CartÃ£o)', base: 'HIPERCARD', categoria: 'CartÃ£o', grupo: 'CIELO' }

    if (/\bDEB[\s._-]*VISA(?:\s+ELECTRON)?\b/.test(upperNorm)) return { nome: 'VISA ELECTRON (CartÃ£o)', base: 'VISA ELECTRON', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (/\bDEB[\s._-]*MAESTRO\b/.test(upperNorm)) return { nome: 'MAESTRO (CartÃ£o)', base: 'MAESTRO', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (/\bDEB[\s._-]*ELO(?:\s+DEBITO)?\b/.test(upperNorm)) return { nome: 'ELO DEBITO (CartÃ£o)', base: 'ELO DEBITO', categoria: 'CartÃ£o', grupo: 'CIELO' }

    if (/\bCRED[\s._-]*VISA\b/.test(upperNorm)) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (/\bCRED[\s._-]*MASTERCARD\b/.test(upperNorm)) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (/\bCRED[\s._-]*ELO\b/.test(upperNorm)) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (/\bCRED[\s._-]*(AMEX|AMERICAN\s+EXP(?:RESS|RE)?)\b/.test(upperNorm) || /\bOUTRAS\s+BANDEIRAS\b.*\bAMERICAN\s+EXP(?:RESS|RE)?\b/.test(upperNorm)) return { nome: 'AMEX (CartÃ£o)', base: 'AMEX', categoria: 'CartÃ£o', grupo: 'CIELO' }
    if (/\bCRED[\s._-]*(HIPERCARD|HIPER)\b/.test(upperNorm)) return { nome: 'HIPERCARD (CartÃ£o)', base: 'HIPERCARD', categoria: 'CartÃ£o', grupo: 'CIELO' }
  }

  const compartilhado = detectarAgrupamentoResumoTribanco(descricao)
  if (compartilhado) return compartilhado

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
      return { nome: 'SIPAG (CartÃƒÂ£o)', base: 'SIPAG', categoria: 'CartÃƒÂ£o' }
    }
    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (CartÃ£o)`, base: r.nome, categoria: 'CartÃ£o', grupo: 'OUTROS' }
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

const criarChaveTransacaoResumo = (transacao) => {
  const data = String(
    transacao?.data ??
    transacao?.dataLancamento ??
    transacao?.data_lancamento ??
    ''
  ).trim()
  const documento = String(
    transacao?.documento ??
    transacao?.doc ??
    transacao?.document ??
    ''
  ).trim()
  const descricao = normalizar(transacao?.descricao || '')
  const valor = Number(transacao?.valorNumerico ?? transacao?.valor ?? 0) || 0
  return [data, documento, descricao, valor].join('|')
}

const detectarResumoRedeSicoob = (descricao) => {
  const texto = normalizar(descricao)
    .replace(/[|/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!/\bREDE(?:CARD)?\b/.test(texto)) return ''

  if (/\bVISA\s+(?:PAT|VOUCHER)\b|\b(?:PAT|VOUCHER)\s+VISA\b/.test(texto)) return 'VISA VOUCHER (CartÃ£o)'
  if (/\b(?:MASTER|MASTERCARD)\s+(?:PAT|VOUCHER)\b|\b(?:PAT|VOUCHER)\s+(?:MASTER|MASTERCARD)\b/.test(texto)) return 'MASTERCARD VOUCHER (CartÃ£o)'
  if (/\bELO\s+(?:PAT|VOUCHER)\b|\b(?:PAT|VOUCHER)\s+ELO\b/.test(texto)) return 'ELO VOUCHER (CartÃ£o)'

  if (/\bDEB[\s._-]*VISA(?:\s+ELECTRON)?\b|\bDBTO\s+VISA\b/.test(texto)) return 'VISA ELECTRON (CartÃ£o)'
  if (/\bDEB[\s._-]*MAESTRO\b|\bDBTO\s+(?:MAESTRO|MASTER|MASTERCARD)\b/.test(texto)) return 'MAESTRO (CartÃ£o)'
  if (/\bDEB[\s._-]*ELO(?:\s+DEBITO)?\b|\bDBTO\s+ELO\b/.test(texto)) return 'ELO DEBITO (CartÃ£o)'

  if (/\bCRED[\s._-]*VISA\b|\bCR\s+VISA\b/.test(texto)) return 'VISA (CartÃ£o)'
  if (/\bCRED[\s._-]*MASTERCARD\b|\bCR\s+MASTERCARD\b/.test(texto)) return 'MASTERCARD (CartÃ£o)'
  if (/\bCRED[\s._-]*ELO\b|\bCRTO\s+ELO\b/.test(texto)) return 'ELO CREDITO (CartÃ£o)'
  if (/\b(AMEX|AMERICAN\s+EXP(?:RESS|RE)?)\b/.test(texto)) return 'AMEX (CartÃ£o)'
  if (/\b(HIPERCARD|HIPER)\b/.test(texto)) return 'HIPERCARD (CartÃ£o)'

  return 'REDE (CartÃ£o)'
}

const normalizarNomeResumo = (nome) => {
  return normalizar(String(nome || '').replace(/\s*\([^)]*\)\s*/g, ' '))
}


const resumoPorAdquirente = computed(() => {
  const transacoesJaAgrupadas = new Set()
  const grupos = {}
  props.transacoes.forEach(t => {
    const chaveTransacao = criarChaveTransacaoResumo(t)
    if (transacoesJaAgrupadas.has(chaveTransacao)) return
    transacoesJaAgrupadas.add(chaveTransacao)

    const det = detectarAdquirente(t.descricao)
    if (/\b(PAT|VOUCHER|BENE(?:FI)?)\b/i.test(String(t?.descricao || ''))) {
      // #region debug-point B:resumo-por-adquirente
      enviarDebugResumoSicoob('B', 'resumoPorAdquirente processou transacao candidata', {
        descricao: t?.descricao || '',
        detNome: det?.nome || '',
        detGrupo: det?.grupo || '',
        detBase: det?.base || ''
      })
      // #endregion
    }
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

const nomesCielo = [
  'VISA ELECTRON (CartÃ£o)',
  'MAESTRO (CartÃ£o)',
  'ELO DEBITO (CartÃ£o)',
  'VISA (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'AMEX (CartÃ£o)',
  'HIPERCARD (CartÃ£o)'
]

const nomesUnica = [
  'VISA ELECTRON (CartÃ£o)',
  'ELO DEBITO (CartÃ£o)',
  'MAESTRO (CartÃ£o)',
  'VISA (CartÃ£o)',
  'VISA VOUCHER (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'ELO VOUCHER (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'MASTERCARD VOUCHER (CartÃ£o)',
  'TRIPAG (CartÃ£o)',
  'UNICA (CartÃ£o)',
  'SIPAG (CartÃ£o)',
  'AMEX (CartÃ£o)',
  'HIPERCARD (CartÃ£o)'
]

const nomesRede = [
  'VISA ELECTRON (CartÃ£o)',
  'MAESTRO (CartÃ£o)',
  'ELO DEBITO (CartÃ£o)',
  'VISA (CartÃ£o)',
  'VISA VOUCHER (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'MASTERCARD VOUCHER (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'ELO VOUCHER (CartÃ£o)',
  'AMEX (CartÃ£o)',
  'HIPERCARD (CartÃ£o)',
  'REDE (CartÃ£o)'
]
const nomesRedeNormalizados = new Set(nomesRede.map((nome) => normalizarNomeResumo(nome)))

const resumoUnica = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }
  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (grupo.grupo === 'UNICA' && nomesUnica.includes(grupo.nome)) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      dados.subgrupos[grupo.nome] = grupo
    }
  }
  // #region debug-point C:resumo-unica
  enviarDebugResumoSicoob('C', 'resumoUnica consolidado', {
    quantidade: dados.quantidade,
    nomes: Object.keys(dados.subgrupos)
  })
  // #endregion
  return dados
})

const resumoRede = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }

  const transacoesJaAgrupadas = new Set()
  for (const transacao of props.transacoes) {
    const chaveTransacao = criarChaveTransacaoResumo(transacao)
    if (transacoesJaAgrupadas.has(chaveTransacao)) continue
    transacoesJaAgrupadas.add(chaveTransacao)

    const nomeResumo = detectarResumoRedeSicoob(transacao?.descricao)
    if (/\b(PAT|VOUCHER|BENE(?:FI)?)\b/i.test(String(transacao?.descricao || ''))) {
      // #region debug-point D:resumo-rede-candidata
      enviarDebugResumoSicoob('D', 'resumoRede avaliou transacao candidata', {
        descricao: transacao?.descricao || '',
        nomeResumo,
        permitidoEmRede: nomesRedeNormalizados.has(normalizarNomeResumo(nomeResumo))
      })
      // #endregion
    }
    if (!nomeResumo || !nomesRedeNormalizados.has(normalizarNomeResumo(nomeResumo))) continue

    if (!dados.subgrupos[nomeResumo]) {
      dados.subgrupos[nomeResumo] = {
        transacoes: [],
        quantidade: 0,
        total: 0,
        nome: nomeResumo,
        grupo: 'REDE'
      }
    }

    const valor = Number(transacao?.valorNumerico ?? transacao?.valor ?? 0) || 0
    dados.quantidade += 1
    dados.total += valor
    dados.subgrupos[nomeResumo].transacoes.push(transacao)
    dados.subgrupos[nomeResumo].quantidade += 1
    dados.subgrupos[nomeResumo].total += valor
  }
  // #region debug-point E:resumo-rede
  enviarDebugResumoSicoob('E', 'resumoRede consolidado', {
    quantidade: dados.quantidade,
    nomes: Object.keys(dados.subgrupos)
  })
  // #endregion
  return dados
})

const resumoCielo = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }
  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    const isPatVoucherCielo = grupo.grupo === 'CIELO' && /\sPAT\s\(Voucher\)$/.test(grupo.nome)
    if ((grupo.grupo === 'CIELO' && nomesCielo.includes(grupo.nome)) || isPatVoucherCielo) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      dados.subgrupos[grupo.nome] = grupo
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
  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    const isRedeResumoSimples = normalizarNomeResumo(grupo.nome) === 'REDE'
    if (!['CIELO', 'UNICA', 'REDE'].includes(grupo.grupo) && !isRedeResumoSimples) dados[grupo.nome] = grupo
  }
  return Object.fromEntries(ordenarGruposResumo(Object.entries(dados)))
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃƒÂ£o|Voucher)\)/, '')
  return coresCartoes[base] || coresVouchers[base] || '#6B7280'
}

const detectarVoucherPorBandeiraSicoob = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return ''

  if (/\bVISA\s+(?:PAT|VOUCHER|BENE(?:FI)?)\b|\b(?:PAT|VOUCHER|BENE(?:FI)?)\s+VISA\b/.test(texto)) return 'VISA VOUCHER'
  if (/\b(?:MASTER|MASTERCARD)\s+(?:PAT|VOUCHER|BENE(?:FI)?)\b|\b(?:PAT|VOUCHER|BENE(?:FI)?)\s+(?:MASTER|MASTERCARD)\b/.test(texto)) return 'MASTERCARD VOUCHER'
  if (/\bELO\s+(?:PAT|VOUCHER|BENE(?:FI)?)\b|\b(?:PAT|VOUCHER|BENE(?:FI)?)\s+ELO\b/.test(texto)) return 'ELO VOUCHER'

  return ''
}

const obterVoucherDescricao = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return ''
  if (texto.includes('MANCACARU') || texto.includes('MANDACARU') || texto.includes('MANDACARU ADMINISTRADORA') || texto.includes('MANACARU') || texto.includes('LIBERCAD') || texto.includes('LIBER CARD') || texto.includes('LIBERCARD')) return 'LIBERCARD'
  const voucherPorBandeira = detectarVoucherPorBandeiraSicoob(descricao)
  if (voucherPorBandeira) return voucherPorBandeira
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




