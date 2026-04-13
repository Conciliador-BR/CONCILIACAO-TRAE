<template>
  <div>
    <CardResumoAdquirente
      v-for="(grupo, nome) in resumoPorAdquirente"
      :key="nome"
      :adquirente="nome"
      :banco="grupo.transacoes[0]?.banco || 'Sicredi'"
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
  'COMPROCARD': '#F97316'
}

const configAliases = computed(() => ({
  'TRIPAG': { categoria: 'Cartão', aliases: ['TRIPAG'] },
  'UNICA': { categoria: 'Cartão', aliases: ['UNICA'] },
  'CIELO': { categoria: 'Cartão', aliases: ['CIELO'] },
  'SIPAG': { categoria: 'Cartão', aliases: ['SIPAG'] },
  'SICREDI': { categoria: 'Cartão', aliases: ['SICREDI'] },
  'REDE': { categoria: 'Cartão', aliases: ['REDE', 'REDECARD'] },
  'STONE': { categoria: 'Cartão', aliases: ['STONE'] },
  'AZULZINHA': { categoria: 'Cartão', aliases: ['AZULZINHA'] },
  'PAG SEGURO': { categoria: 'Cartão', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },
  'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
  'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BR', 'PLUXEE', 'PLUXE'] },
  'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'] },
  'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF'] },
  'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'] },
  'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'] },
  'COMPROCARD': { categoria: 'Voucher', aliases: ['COMPROCARD'] }
}))

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()

  const regrasCartoes = [
    { nome: 'TRIPAG', re: /\bTRIPAG(?:[_\s-]|$)/i },
    { nome: 'UNICA', re: /\bUNICA(?:[_\s-]|$)/i },
    { nome: 'CIELO', re: /\bCIELO(?:[_\s-]|$)/i },
    { nome: 'SIPAG', re: /\bSIPAG(?:[_\s-]|$)/i },
    { nome: 'SICREDI', re: /\bSICREDI(?:[_\s-]|$)/i },
    { nome: 'REDE', re: /\bREDE(?:CARD)?(?:[_\s-]|$)/i },
    { nome: 'STONE', re: /\bSTONE(?:[_\s-]|$)/i },
    { nome: 'AZULZINHA', re: /\bAZULZINHA(?:[_\s-]|$)/i },
    { nome: 'PAG SEGURO', re: /\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b/i }
  ]

  for (const r of regrasCartoes) {
    if (r.re.test(original)) {
      return { nome: `${r.nome} (Cartão)`, base: r.nome, categoria: 'Cartão' }
    }
  }

  const texto = normalizar(upper)
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
  props.transacoes.forEach((t) => {
    const det = detectarAdquirente(t.descricao)
    if (!det) return
    if (!grupos[det.nome]) {
      grupos[det.nome] = { transacoes: [], quantidade: 0, total: 0 }
    }
    grupos[det.nome].transacoes.push(t)
    grupos[det.nome].quantidade += 1
    grupos[det.nome].total += Number(t.valorNumerico ?? t.valor ?? 0) || 0
  })
  return grupos
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
      if (texto.includes(aliasNorm)) return nomeCanonico
    }
  }
  return ''
}
</script>
