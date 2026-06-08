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
              Sicredi
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
              Sicredi
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
  'AMEX': '#22C55E',
  'HIPERCARD': '#EF4444',
  'CABAL DEBITO': '#B45309',
  'CABAL CREDITO': '#92400E'
}

const coresVouchers = {
  'TICKET SERVICOS SA': '#EF4444',
  'PLUXEE BENEFICIOS BR': '#EF4444',
  'ALELO INSTITUICAO DE PAGAMENTO': '#F59E0B',
  'VR BENEFICIOS': '#10B981',
  'LE CARD ADMINISTRADORA': '#84CC16',
  'UP BRASIL ADMINISTRACAO': '#22C55E',
  'COMPROCARD': '#F97316',
  'SENFF': '#14B8A6',
  'GREEN CARD': '#65A30D'
}

const configAliases = computed(() => ({
  'TRIPAG': { categoria: 'CartÃ£o', aliases: ['TRIPAG'] },
  'UNICA': { categoria: 'CartÃ£o', aliases: ['UNICA'] },
  'CIELO': { categoria: 'CartÃ£o', aliases: ['CIELO'] },
  'SIPAG': { categoria: 'CartÃ£o', aliases: ['SIPAG'] },
  'SICREDI': { categoria: 'CartÃ£o', aliases: ['SICREDI'] },
  'REDE': { categoria: 'CartÃ£o', aliases: ['REDE', 'REDECARD'] },
  'STONE': { categoria: 'CartÃ£o', aliases: ['STONE'] },
  'AZULZINHA': { categoria: 'CartÃ£o', aliases: ['AZULZINHA'] },
  'PAG SEGURO': { categoria: 'CartÃ£o', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },
  'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
  'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BRASIL', 'PLUXEE BENEFICIOS BR', 'PLUXEE BENEFICIOS', 'PLUXEE', 'PLUXE'] },
  'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO S A', 'ALELO S.A', 'ALELO'] },
  'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS SERV', 'VR BENEFICIOS SERV PROC', 'VR BENEFICIOS', 'VR BENEF', 'VR BENEFICIOS SER'] },
  'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'] },
  'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO E SER', 'UP BRASIL ADMINISTRACAO', 'UP BRASIL ADMINIS', 'UP BRASIL ADMIN', 'UP BRASIL'] },
  'COMPROCARD': { categoria: 'Voucher', aliases: ['COMPROCARD'] },
  'SENFF': { categoria: 'Voucher', aliases: ['SENFF', 'SENFFNET', 'SENFNET', 'SENF'] },
  'GREEN CARD': { categoria: 'Voucher', aliases: ['GREEN CARD S A', 'GREEN CARD S/A', 'GREEN CARD REFEICOES', 'GREEN CARD'] }
}))

const detectarResumoCieloSicredi = (entrada) => {
  const { descricao, documento } = extrairCamposTransacao(entrada)
  const texto = normalizar(`${descricao || ''} ${documento || ''}`)
  if (!texto || !/\bCIELO\b/.test(texto)) return ''

  if (/\bCIELO\s+DEBITO\s+VISA\b/.test(texto)) return 'VISA ELECTRON (Cartão)'
  if (/\bCIELO\s+DEBITO\s+(?:MASTER|MASTERCARD)\b/.test(texto)) return 'MAESTRO (Cartão)'
  if (/\bCIELO\s+DEBITO\s+ELO\b/.test(texto)) return 'ELO DEBITO (Cartão)'
  if (/\bCIELO\s+DEBITO\s+OUTRAS\b/.test(texto)) return 'CABAL DEBITO (Cartão)'

  if (/\bCIELO\s+CREDITO\s+VISA\b/.test(texto)) return 'VISA (Cartão)'
  if (/\bCIELO\s+CREDITO\s+(?:MASTER|MASTERCARD)\b/.test(texto)) return 'MASTERCARD (Cartão)'
  if (/\bCIELO\s+CREDITO\s+ELO\b/.test(texto)) return 'ELO CREDITO (Cartão)'
  if (/\bCIELO\s+CREDITO\s+AMEX\b/.test(texto)) return 'AMEX (Cartão)'
  if (/\bCIELO\s+CREDITO\s+HIPER(?:CARD)?\b/.test(texto)) return 'HIPERCARD (Cartão)'
  if (/\bCIELO\s+CREDITO\s+OUTRAS\b/.test(texto)) return 'CABAL CREDITO (Cartão)'

  return ''
}

const detectarResumoUnicaSicredi = (entrada) => {
  const { descricao, documento } = extrairCamposTransacao(entrada)
  const texto = normalizar(`${descricao || ''} ${documento || ''}`)
  if (!texto || !/\bSUB\b/.test(texto)) return ''

  if (/\bSUB\s+DB\s+VISA\b/.test(texto)) return 'VISA ELECTRON (Cartão)'
  if (/\bSUB\s+DB\s+(?:MASTER|MASTERCARD)\b/.test(texto)) return 'MAESTRO (Cartão)'
  if (/\bSUB\s+DB\s+ELO\b/.test(texto)) return 'ELO DEBITO (Cartão)'

  if (/\bSUB\s+CD\s+VISA\b|\bSUB\s+ANTEC\s+VISA\b/.test(texto)) return 'VISA (Cartão)'
  if (/\bSUB\s+CD\s+(?:MASTER|MASTERCARD)\b|\bSUB\s+ANTEC\s+(?:MASTER|MASTERCARD)\b/.test(texto)) return 'MASTERCARD (Cartão)'
  if (/\bSUB\s+CD\s+ELO\b|\bSUB\s+ANTEC\s+ELO\b/.test(texto)) return 'ELO CREDITO (Cartão)'
  if (/\bSUB\s+CD\s+AMEX\b|\bSUB\s+ANTEC\s+AMEX\b/.test(texto)) return 'AMEX (Cartão)'
  if (/\bSUB\s+CD\s+HIPER(?:CARD)?\b|\bSUB\s+ANTEC\s+HIPER(?:CARD)?\b/.test(texto)) return 'HIPERCARD (Cartão)'

  return ''
}

const detectarAdquirente = (entrada) => {
  const { descricao, documento } = extrairCamposTransacao(entrada)
  const original = `${descricao || ''} ${documento || ''}`.trim()
  const upper = original.toUpperCase()
  const resumoUnica = detectarResumoUnicaSicredi(entrada)
  const resumoCielo = detectarResumoCieloSicredi(entrada)

  if (resumoUnica) {
    return {
      nome: resumoUnica,
      base: resumoUnica.replace(/\s*\([^)]*\)\s*/g, '').trim(),
      categoria: 'Cartão',
      grupo: 'UNICA'
    }
  }

  if (resumoCielo) {
    return {
      nome: resumoCielo,
      base: resumoCielo.replace(/\s*\([^)]*\)\s*/g, '').trim(),
      categoria: 'Cartão',
      grupo: 'CIELO'
    }
  }

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
      return { nome: `${r.nome} (Cartão)`, base: r.nome, categoria: 'Cartão', grupo: 'OUTROS' }
    }
  }

  const texto = normalizar(upper)
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
  props.transacoes.forEach((t) => {
    const det = detectarAdquirente(t)
    if (!det) return
    const chave = `${det.grupo || 'OUTROS'}|${det.nome}`
    if (!grupos[chave]) {
      grupos[chave] = { transacoes: [], quantidade: 0, total: 0, nome: det.nome, grupo: det.grupo || 'OUTROS' }
    }
    grupos[chave].transacoes.push(t)
    grupos[chave].quantidade += 1
    grupos[chave].total += Number(t.valorNumerico ?? t.valor ?? 0) || 0
  })
  return grupos
})

const nomesCielo = [
  'VISA ELECTRON (Cartão)',
  'MAESTRO (Cartão)',
  'ELO DEBITO (Cartão)',
  'VISA (Cartão)',
  'MASTERCARD (Cartão)',
  'ELO CREDITO (Cartão)',
  'AMEX (Cartão)',
  'HIPERCARD (Cartão)',
  'CABAL DEBITO (Cartão)',
  'CABAL CREDITO (Cartão)'
]

const nomesUnica = [
  'VISA ELECTRON (Cartão)',
  'MAESTRO (Cartão)',
  'ELO DEBITO (Cartão)',
  'VISA (Cartão)',
  'MASTERCARD (Cartão)',
  'ELO CREDITO (Cartão)',
  'AMEX (Cartão)',
  'HIPERCARD (Cartão)'
]

const resumoUnica = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }
  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (grupo.grupo === 'UNICA' && nomesUnica.includes(grupo.nome)) {
      dados.quantidade += grupo.quantidade
      dados.total += grupo.total
      dados.subgrupos[grupo.nome] = grupo
    }
  }
  return dados
})

const resumoCielo = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }
  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (grupo.grupo === 'CIELO' && nomesCielo.includes(grupo.nome)) {
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
    if (!['CIELO', 'UNICA'].includes(grupo.grupo)) {
      dados[grupo.nome] = grupo
    }
  }
  return dados
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((Cartão|Cartao|Voucher)\)/, '')
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
      if (texto.includes(aliasNorm)) return nomeCanonico
    }
  }
  return ''
}
</script>


