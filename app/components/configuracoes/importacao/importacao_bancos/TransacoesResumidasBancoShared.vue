<template>
  <div>
    <template v-if="gruposBanco.length > 0">
      <template v-for="grupo in gruposBanco" :key="grupo.id">
        <component
          v-if="grupo.component"
          :is="grupo.component"
          :transacoes="grupo.transacoes"
        />
        <div v-else class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 mb-4">
          <p class="text-lg font-medium">Visualização resumida não disponível para este banco.</p>
          <p class="text-sm mt-1">Banco detectado: {{ grupo.bancoOriginal || 'Desconhecido' }}</p>
        </div>
      </template>
    </template>

    <ResumoVoucherMultiBanco
      v-if="gruposAutorizadoraMultiBanco.length > 0"
      :grupos="gruposAutorizadoraMultiBanco"
    />

    <ResumoVoucherMultiBanco
      v-if="gruposVoucherMultiBanco.length > 0"
      :grupos="gruposVoucherMultiBanco"
    />

    <div v-if="gruposBanco.length === 0 && gruposVoucherMultiBanco.length === 0 && gruposAutorizadoraMultiBanco.length === 0" class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
      <p class="text-lg font-medium">Sem transações para resumir.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DetectadorAdquirentesSicoob from './Detectador_Adquirentes/DetectadorAdquirentesSicoob.vue'
import DetectadorAdquirentesBradesco from './Detectador_Adquirentes/DetectadorAdquirentesBradesco.vue'
import DetectadorAdquirentesTribanco from './Detectador_Adquirentes/DetectadorAdquirentesTribanco.vue'
import DetectadorAdquirentesBancoDoBrasil from './Detectador_Adquirentes/DetectadorAdquirentesBancoDoBrasil.vue'
import DetectadorAdquirentesItau from './Detectador_Adquirentes/DetectadorAdquirentesItau.vue'
import DetectadorAdquirentesSafra from './Detectador_Adquirentes/DetectadorAdquirentesSafra.vue'
import DetectadorAdquirentesBancoCaixa from './Detectador_Adquirentes/DetectadorAdquirentesBancoCaixa.vue'
import DetectadorAdquirentesBancoDoNordeste from './Detectador_Adquirentes/DetectadorAdquirentesBancoDoNordeste.vue'
import DetectadorAdquirentesSicredi from './Detectador_Adquirentes/DetectadorAdquirentesSicredi.vue'
import DetectadorAdquirentesBanestes from './Detectador_Adquirentes/DetectadorAdquirentesBanestes.vue'
import DetectadorAdquirentesSantander from './Detectador_Adquirentes/DetectadorAdquirentesSantander.vue'
import DetectadorAdquirentesStone from './Detectador_Adquirentes/DetectadorAdquirentesStone.vue'
import ResumoVoucherMultiBanco from './ResumoVoucherMultiBanco.vue'
import { detectarBancoResumo } from '~/composables/configuracoes/importacao/importacao_bancos/useResumoBancoDetectado'
import { getOperadorasParaTabela, VOUCHERS_FIXOS } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/constants'
import { parseValorExtrato } from '~/composables/PageControladoria/controladoria-recebimentos/recebimentoscontainer/recebimentosUtils'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'

const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const { detectarAdquirente: detectarAdquirenteBanco } = useAdquirenteDetector()

const mapaComponentes = {
  sicoob: DetectadorAdquirentesSicoob,
  bradesco: DetectadorAdquirentesBradesco,
  tribanco: DetectadorAdquirentesTribanco,
  bb: DetectadorAdquirentesBancoDoBrasil,
  itau: DetectadorAdquirentesItau,
  safra: DetectadorAdquirentesSafra,
  caixa: DetectadorAdquirentesBancoCaixa,
  bnb: DetectadorAdquirentesBancoDoNordeste,
  sicredi: DetectadorAdquirentesSicredi,
  banestes: DetectadorAdquirentesBanestes,
  santander: DetectadorAdquirentesSantander,
  stone: DetectadorAdquirentesStone
}

const ORDEM_AUTORIZADORAS = [
  'tribanco',
  'bradesco',
  'stone',
  'safra',
  'itau',
  'sicredi',
  'sicoob',
  'caixa',
  'bb',
  'bnb',
  'banestes',
  'santander'
]

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

const ehVrProcessamentoCaixa = (transacao) => {
  const banco = normalizar(transacao?.banco)
  if (banco !== 'CAIXA') return false

  const texto = normalizar(`${transacao?.descricao || ''} ${transacao?.documento ?? transacao?.doc ?? transacao?.document ?? ''}`)
  if (!texto) return false

  return (
    texto.includes('VR BENEFICIOS E SERVICOS DE PROCESSAMENT') ||
    (texto.includes('VR BENEFICIOS') && texto.includes('PROCESSAMENT'))
  )
}

const ehCabalRedeTribanco = (transacao) => {
  const banco = normalizar(transacao?.banco)
  if (banco !== 'TRIBANCO') return false

  const texto = normalizar(`${transacao?.descricao || ''} ${transacao?.documento ?? transacao?.doc ?? transacao?.document ?? ''}`)
  if (!texto) return false

  return (
    /\bCABAL\s+DEB\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bCABAL\s+DEBITO\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bCABAL\s+DBTO\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bREDE(?:CARD)?\s+CABAL\s+(?:DBTO|DEB|DEBITO)\b/.test(texto) ||
    /\bDBTO\s+CABAL\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bCABAL\s+(?:CRED|CRTO|CREDITO|CD)\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bREDE(?:CARD)?\s+CABAL\s+(?:CD|AT|CRED|CRTO|CREDITO)\b/.test(texto) ||
    /\bCR(?:EDITO)?\s+CABAL\s+REDE(?:CARD)?\b/.test(texto)
  )
}

const formatarNomeBanco = (banco) => {
  const valor = String(banco || '').trim()
  return valor || 'Banco não identificado'
}

const formatarNomeVoucher = (voucher) => {
  const chave = normalizar(voucher)
  if (['PLUXE', 'PLUXEE', 'PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR'].includes(chave)) return 'PLUXEE'
  return String(voucher || '').trim()
}

const coresVoucher = {
  ALELO: '#F59E0B',
  TICKET: '#EF4444',
  VR: '#10B981',
  PLUXEE: '#EF4444',
  'LE CARD': '#84CC16',
  CABAL: '#FACC15',
  LIBERCARD: '#A855F7'
}

const coresAutorizadora = {
  UNICA: '#7C3AED',
  CIELO: '#0EA5E9',
  REDE: '#EA580C',
  STONE: '#374151',
  AZULZINHA: '#3B82F6',
  SIPAG: '#059669',
  SICREDI: '#16A34A',
  PAGSEGURO: '#0EA5E9',
  GETNET: '#0891B2',
  SAFRA: '#16A34A',
  MERCADOPAGO: '#F59E0B',
  BIN: '#6B7280'
}

const aliasesVoucher = (() => {
  const mapa = new Map()
  for (const voucher of VOUCHERS_FIXOS) {
    const nome = formatarNomeVoucher(voucher)
    const aliases = getOperadorasParaTabela(voucher)
    ;[voucher, ...aliases].forEach((alias) => {
      const chave = normalizar(alias)
      if (chave) mapa.set(chave, nome)
    })
  }
  return mapa
})()

const resolverVoucher = (transacao) => {
  if (ehVrProcessamentoCaixa(transacao)) return ''
  if (ehCabalRedeTribanco(transacao)) return ''

  const candidatos = [
    transacao?.voucher,
    transacao?.adquirente_detectado,
    transacao?.adquirente
  ]

  for (const candidato of candidatos) {
    const chave = normalizar(candidato)
    if (chave && aliasesVoucher.has(chave)) return aliasesVoucher.get(chave)
  }

  const textoBusca = normalizar(`${transacao?.descricao || ''} ${transacao?.documento ?? transacao?.doc ?? transacao?.document ?? ''}`)
  if (!textoBusca) return ''

  for (const [alias, nome] of aliasesVoucher.entries()) {
    if (textoBusca.includes(alias)) return nome
  }

  return ''
}

const resolverAutorizadora = (transacao) => {
  if (ehVrProcessamentoCaixa(transacao)) return ''
  if (resolverVoucher(transacao)) return ''

  const candidatos = [
    transacao?.adquirente_detectado,
    transacao?.adquirente,
    transacao?.descricao,
    transacao?.documento ?? transacao?.doc ?? transacao?.document ?? ''
  ]

  const textoBusca = normalizar(candidatos.filter(Boolean).join(' '))
  if (!textoBusca) return ''

  if (/\bTRIANGULO\b|\bTRIPAG\b|\bUNICA\b/.test(textoBusca)) return 'UNICA'
  if (/\bCIELO\b/.test(textoBusca)) return 'CIELO'
  if (/\bREDE(?:CARD)?\b/.test(textoBusca)) return 'REDE'
  if (/\bSTONE\b/.test(textoBusca)) return 'STONE'
  if (/\bAZULZINHA\b/.test(textoBusca)) return 'AZULZINHA'
  if (/\bSIPAG\b/.test(textoBusca)) return 'SIPAG'
  if (/\bSICREDI\b/.test(textoBusca)) return 'SICREDI'
  if (/\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b/.test(textoBusca)) return 'PAGSEGURO'
  if (/\bGETNET\b|\bGET\s?NET\b/.test(textoBusca)) return 'GETNET'
  if (/\bSAFRAPAY\b|\bSAFRA\s?PAY\b|\bSAFRA\b/.test(textoBusca)) return 'SAFRA'
  if (/\bMERCADOPAGO\b|\bMERCADO\s?PAGO\b/.test(textoBusca)) return 'MERCADOPAGO'
  if (/\bBIN\b/.test(textoBusca)) return 'BIN'

  const detectado = detectarAdquirenteBanco(transacao?.descricao || '', transacao?.banco || '')
  if (detectado?.categoria === 'Cartão') {
    const base = normalizar(detectado.base || detectado.nome || '')
    if (base === 'TRIPAG' || base === 'TRIANGULO' || base === 'UNICA') return 'UNICA'
    if (['CIELO', 'REDE', 'STONE', 'AZULZINHA', 'SIPAG', 'SICREDI', 'PAGSEGURO', 'GETNET', 'SAFRAPAY', 'MERCADOPAGO', 'BIN'].includes(base)) {
      return base === 'SAFRAPAY' ? 'SAFRA' : base
    }
  }

  return ''
}

const gruposVoucherMultiBanco = computed(() => {
  const mapa = new Map()

  for (const transacao of props.transacoes || []) {
    if (ehVrProcessamentoCaixa(transacao)) continue

    const voucher = resolverVoucher(transacao)
    if (!voucher) continue

    const bancoOriginal = formatarNomeBanco(transacao?.banco)
    const bancoChave = detectarBancoResumo(bancoOriginal) || normalizar(bancoOriginal) || 'BANCO_DESCONHECIDO'
    const valor = Number(parseValorExtrato(transacao) || 0)
    if (valor <= 0) continue

    if (!mapa.has(voucher)) {
      mapa.set(voucher, {
        nome: voucher,
        cor: coresVoucher[normalizar(voucher)] || '#6B7280',
        quantidade: 0,
        total: 0,
        bancosMap: new Map(),
        transacoes: []
      })
    }

    const grupo = mapa.get(voucher)
    grupo.quantidade += 1
    grupo.total += valor
    grupo.transacoes.push(transacao)

    if (!grupo.bancosMap.has(bancoChave)) {
      grupo.bancosMap.set(bancoChave, {
        chave: bancoChave,
        nome: bancoOriginal,
        quantidade: 0,
        total: 0,
        transacoes: []
      })
    }

    const banco = grupo.bancosMap.get(bancoChave)
    banco.quantidade += 1
    banco.total += valor
    banco.transacoes.push(transacao)
  }

  return Array.from(mapa.values())
    .filter((grupo) => grupo.bancosMap.size > 1)
    .map((grupo) => ({
      nome: grupo.nome,
      cor: grupo.cor,
      quantidade: grupo.quantidade,
      total: grupo.total,
      transacoes: grupo.transacoes,
      bancos: Array.from(grupo.bancosMap.values()).sort((a, b) => b.total - a.total)
    }))
    .sort((a, b) => b.total - a.total)
})

const gruposAutorizadoraMultiBanco = computed(() => {
  const mapa = new Map()

  for (const transacao of props.transacoes || []) {
    if (ehVrProcessamentoCaixa(transacao)) continue
    if (resolverVoucher(transacao)) continue

    const autorizadora = resolverAutorizadora(transacao)
    if (!autorizadora) continue

    const bancoOriginal = formatarNomeBanco(transacao?.banco)
    const bancoChave = detectarBancoResumo(bancoOriginal) || normalizar(bancoOriginal) || 'BANCO_DESCONHECIDO'
    const valor = Number(parseValorExtrato(transacao) || 0)
    if (valor <= 0) continue

    if (!mapa.has(autorizadora)) {
      mapa.set(autorizadora, {
        nome: autorizadora,
        cor: coresAutorizadora[normalizar(autorizadora)] || '#6B7280',
        quantidade: 0,
        total: 0,
        bancosMap: new Map(),
        transacoes: []
      })
    }

    const grupo = mapa.get(autorizadora)
    grupo.quantidade += 1
    grupo.total += valor
    grupo.transacoes.push(transacao)

    if (!grupo.bancosMap.has(bancoChave)) {
      grupo.bancosMap.set(bancoChave, {
        chave: bancoChave,
        nome: bancoOriginal,
        quantidade: 0,
        total: 0,
        transacoes: []
      })
    }

    const banco = grupo.bancosMap.get(bancoChave)
    banco.quantidade += 1
    banco.total += valor
    banco.transacoes.push(transacao)
  }

  return Array.from(mapa.values())
    .filter((grupo) => grupo.bancosMap.size > 1)
    .map((grupo) => ({
      nome: grupo.nome,
      cor: grupo.cor,
      quantidade: grupo.quantidade,
      total: grupo.total,
      transacoes: grupo.transacoes,
      bancos: Array.from(grupo.bancosMap.values()).sort((a, b) => b.total - a.total)
    }))
    .sort((a, b) => b.total - a.total)
})

const transacoesVoucherMultiBancoSet = computed(() => {
  const set = new Set()
  for (const grupo of gruposVoucherMultiBanco.value) {
    for (const transacao of grupo.transacoes) set.add(transacao)
  }
  return set
})

const transacoesAutorizadoraMultiBancoSet = computed(() => {
  const set = new Set()
  for (const grupo of gruposAutorizadoraMultiBanco.value) {
    for (const transacao of grupo.transacoes) set.add(transacao)
  }
  return set
})

const gruposBanco = computed(() => {
  const mapa = new Map()
  for (const t of props.transacoes || []) {
    if (ehVrProcessamentoCaixa(t)) continue
    if (transacoesVoucherMultiBancoSet.value.has(t)) continue
    if (transacoesAutorizadoraMultiBancoSet.value.has(t)) continue
    const bancoOriginal = String(t?.banco || '')
    const chave = detectarBancoResumo(bancoOriginal) || '__desconhecido__'
    if (!mapa.has(chave)) {
      mapa.set(chave, { chave, bancoOriginal, transacoes: [] })
    }
    mapa.get(chave).transacoes.push(t)
  }
  return Array.from(mapa.values())
    .map((g, i) => ({
      id: `${g.chave}-${i}`,
      bancoOriginal: g.bancoOriginal,
      transacoes: g.transacoes,
      component: mapaComponentes[g.chave] || null
    }))
    .sort((a, b) => {
      const ordemA = ORDEM_AUTORIZADORAS.indexOf(a.chave)
      const ordemB = ORDEM_AUTORIZADORAS.indexOf(b.chave)
      const posA = ordemA === -1 ? Number.MAX_SAFE_INTEGER : ordemA
      const posB = ordemB === -1 ? Number.MAX_SAFE_INTEGER : ordemB
      if (posA !== posB) return posA - posB
      return String(a.bancoOriginal || '').localeCompare(String(b.bancoOriginal || ''), 'pt-BR')
    })
})
</script>
