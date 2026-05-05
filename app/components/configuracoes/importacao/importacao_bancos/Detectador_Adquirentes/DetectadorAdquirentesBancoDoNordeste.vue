<template>
  <div>
    <CardResumoAdquirente
      v-for="(grupo, nome) in resumoPorAdquirente"
      :key="nome"
      :adquirente="nome"
      :banco="grupo.transacoes[0]?.banco || 'Banco do Nordeste'"
      :quantidade="grupo.quantidade"
      :total="grupo.total"
      :cor="obterCor(nome)"
      :transacoes="grupo.transacoes"
      :resolver-voucher="obterVoucherDescricao"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CardResumoAdquirente from '../CardResumoAdquirente.vue'

const props = defineProps({
  transacoes: { type: Array, default: () => [] }
})

const normalizar = (texto) => {
  if (!texto) return ''
  if (texto.includes('MANCACARU') || texto.includes('MANACARU') || texto.includes('LIBERCAD') || texto.includes('LIBER CARD') || texto.includes('LIBERCARD')) return 'LIBERCARD'
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

const configAliases = computed(() => ({
  'TRIPAG': { categoria: 'CartÃ£o', aliases: ['TRIPAG'] },
  'UNICA': { categoria: 'CartÃ£o', aliases: ['UNICA', 'TRIANGULO'] },
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
  'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF', 'PIX BANCO VR', 'VR BENEFCIOS SERV PROC'] },
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
  'VALE CARD': { categoria: 'Voucher', aliases: ['VALE CARD', 'VALECARD', 'AGL ADQUIRENCIA', 'AGL ADQUIRENCIA LTDA'] },
  'NAIP': { categoria: 'Voucher', aliases: ['NAIP'] }
}))

const ehRecebimentoPixVR = (textoNorm) => {
  const t = String(textoNorm || '')
  return /^(RECEBIMENTO VIA PIX|PIX RECEBIDO)\s+VR\s+BENEF(?:ICIOS|ICOS)\b/.test(t)
    || t.includes('PIX BANCO VR')
    || t.includes('VR BENEFCIOS SERV PROC')
}

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const textoNorm = normalizar(original)
  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  const regrasCartoes = [
    { nome: 'TRIPAG', re: /\bTRIPAG(?:[_\s-]|$)/i },
    { nome: 'UNICA', re: /\bTRIANGULO(?:[_\s-]|$)|\bUNICA(?:[_\s-]|$)/i },
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
    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (CartÃ£o)`, base: r.nome, categoria: 'CartÃ£o' }
      }
    }
  }
  if (textoNorm.includes('VR BENEF') && !ehRecebimentoPixVR(textoNorm)) {
    return null
  }
  for (const [nomeCanonico, info] of Object.entries(configAliases.value)) {
    if (info.categoria !== 'Voucher') continue
    if (nomeCanonico === 'VR BENEFICIOS') {
      if (!ehRecebimentoPixVR(textoNorm)) {
        continue
      }
    }
    for (const alias of info.aliases) {
      const aliasNorm = normalizar(alias)
      if (textoNorm.includes(aliasNorm)) {
        return { nome: `${nomeCanonico} (${info.categoria})`, base: nomeCanonico, categoria: info.categoria }
      }
    }
  }
  return null
}

const resumoPorAdquirente = computed(() => {
  const grupos = {}
  props.transacoes.forEach((t) => {
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

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃ£o|Voucher)\)/, '')
  return coresCartoes[base] || coresVouchers[base] || '#6B7280'
}

const obterVoucherDescricao = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return ''
  if (texto.includes('MANCACARU') || texto.includes('MANACARU') || texto.includes('LIBERCAD') || texto.includes('LIBER CARD') || texto.includes('LIBERCARD')) return 'LIBERCARD'
  if (texto.includes('AGL ADQUIRENCIA') || /\bAGL\b/.test(texto)) {
    return 'VALE CARD'
  }
  if (texto.includes('VR BENEF') && !ehRecebimentoPixVR(texto)) {
    return ''
  }
  for (const [nomeCanonico, info] of Object.entries(configAliases.value)) {
    if (info.categoria !== 'Voucher') continue
    if (nomeCanonico === 'VR BENEFICIOS') {
      if (!ehRecebimentoPixVR(texto)) {
        continue
      }
    }
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

