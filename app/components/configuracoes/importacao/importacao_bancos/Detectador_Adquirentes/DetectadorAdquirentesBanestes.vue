<template>
  <div>
    <CardResumoAdquirente
      v-for="(grupo, nome) in resumoPorAdquirente"
      :key="nome"
      :adquirente="nome"
      :banco="grupo.transacoes[0]?.banco || 'Banestes'"
      :quantidade="grupo.quantidade"
      :total="grupo.total"
      :cor="obterCor(nome)"
      :transacoes="grupo.transacoes"
      :resolver-voucher="obterVoucherDescricao"
    />

    <div v-if="Object.keys(resumoPorAdquirente).length === 0" class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
      <p class="text-lg font-medium">Nenhuma transação de voucher detectada.</p>
      <p class="text-sm mt-1">Regras atuais: Ticket Serviços e Pluxee (Benefícios/Instituição).</p>
    </div>
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

const coresVouchers = {
  'TICKET SERVICOS SA': '#EF4444',
  'PLUXEE': '#8B5CF6'
}

const configAliases = {
  'TICKET SERVICOS SA': ['TICKET SERVICOS', 'TICKET SERVICOS SA'],
  'PLUXEE': ['PLUXEE BENEFICIOS', 'PLUXEE INSTITUICAO']
}

const detectarAdquirente = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return null

  for (const [nomeCanonico, aliases] of Object.entries(configAliases)) {
    for (const alias of aliases) {
      if (texto.includes(normalizar(alias))) {
        return { nome: `${nomeCanonico} (Voucher)`, base: nomeCanonico }
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
  return coresVouchers[base] || '#6B7280'
}

const obterVoucherDescricao = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return ''
  for (const [nomeCanonico, aliases] of Object.entries(configAliases)) {
    for (const alias of aliases) {
      if (texto.includes(normalizar(alias))) return nomeCanonico
    }
  }
  return ''
}
</script>
