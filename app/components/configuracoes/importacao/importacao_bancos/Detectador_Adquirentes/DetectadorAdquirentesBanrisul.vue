<template>
  <div>
    <div v-if="resumoStone.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-emerald-600">
            S
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">STONE (Cartao)</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Banrisul
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transacoes</p>
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
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none"
            @click="toggleExpandir(nome)"
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
      :banco="grupo.transacoes[0]?.banco || 'Banrisul'"
      :quantidade="grupo.quantidade"
      :total="grupo.total"
      :cor="obterCor(nome)"
      :transacoes="grupo.transacoes"
      :resolver-voucher="obterVoucherDescricao"
    />

    <div v-if="resumoStone.total === 0 && Object.keys(resumoOutros).length === 0" class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
      <p class="text-lg font-medium">Nenhuma transacao do Banrisul foi classificada.</p>
      <p class="text-sm mt-1">Regras atuais: Banricard e Stone.</p>
    </div>
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

const expandidos = ref({})

const toggleExpandir = (nome) => {
  expandidos.value[nome] = !expandidos.value[nome]
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

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

const coresCartoes = {
  BANRICARD: '#DC2626',
  MAESTRO: '#3B82F6',
  MASTERCARD: '#DC2626',
  STONE: '#16A34A',
  PAGSEGURO: '#0EA5E9'
}

const detectarSubgrupoStone = (textoNormalizado) => {
  if (!textoNormalizado.includes('STONE')) return ''
  if (/\bDEBITO\s+STONE\b/.test(textoNormalizado)) return 'MAESTRO'
  if (/\bANTECIP\s+STONE\b/.test(textoNormalizado) || /\bCREDIT\s+STONE\b/.test(textoNormalizado)) return 'MASTERCARD'
  return 'STONE'
}

const detectarSubgrupoPagSeguro = (textoNormalizado) => {
  if (!/\bPAG\s?SEG(?:URO|UR)?\b|\bPAGUE\s+SEGURO\b|\bPAGBANK\b/.test(textoNormalizado)) return ''

  if (/\bELO\b.*\b(DBTO|DEB|DEBITO)\b|\bDBTO\b.*\bELO\b/.test(textoNormalizado)) return 'ELO DEBITO'
  if (/\bELO\b.*\b(CRED|CREDITO|CRE|CRTO|AT)\b|\b(CRED|CREDITO|CRE|CRTO)\b.*\bELO\b/.test(textoNormalizado)) return 'ELO CREDITO'

  if (/\bVISA\b.*\b(DBTO|DEB|DEBITO)\b|\bDBTO\b.*\bVISA\b|\bVISA\b.*\bELECTRON\b/.test(textoNormalizado)) return 'VISA ELECTRON'
  if (/\bVISA\b.*\b(CRED|CREDITO|CRE|CRTO|AT)\b|\b(CRED|CREDITO|CRE|CRTO)\b.*\bVISA\b/.test(textoNormalizado)) return 'VISA'

  if (/\b(MASTER|MASTERCARD|MAESTRO)\b.*\b(DBTO|DEB|DEBITO)\b|\bDBTO\b.*\b(MASTER|MASTERCARD|MAESTRO)\b/.test(textoNormalizado)) return 'MAESTRO'
  if (/\b(MASTER|MASTERCARD)\b.*\b(CRED|CREDITO|CRE|CRTO|AT)\b|\b(CRED|CREDITO|CRE|CRTO)\b.*\b(MASTER|MASTERCARD)\b/.test(textoNormalizado)) return 'MASTERCARD'

  if (/\bAMEX\b|\bAMERICAN\s+EXPRESS\b/.test(textoNormalizado)) return 'AMEX'
  if (/\bHIPER(?:CARD)?\b/.test(textoNormalizado)) return 'HIPERCARD'

  if (/\b(DBTO|DEB|DEBITO)\b/.test(textoNormalizado)) return 'MAESTRO'
  if (/\b(CRED|CREDITO|CRE|CRTO|AT)\b/.test(textoNormalizado)) return 'MASTERCARD'

  return 'PAGSEGURO'
}

const detectarAdquirente = (transacao) => {
  const texto = normalizar(`${transacao?.descricao || ''} ${transacao?.documento ?? transacao?.doc ?? transacao?.document ?? ''}`)
  if (!texto) return null

  if (
    /\bANTECIPACAO\s+BANRICOMPRAS\b/.test(texto) ||
    /\bBANRI\s+A\s+VISTA\b/.test(texto) ||
    /\bVERO\s+ANTECIPACAO\s+BANRICARD\b/.test(texto) ||
    /\bVERO\s+BANRICARD\s+OUTROS\b/.test(texto)
  ) {
    return { nome: 'BANRICARD (Cartao)', grupo: 'BANRICARD (Cartao)', base: 'BANRICARD' }
  }

  const subgrupoStone = detectarSubgrupoStone(texto)
  if (subgrupoStone) {
    return { nome: 'STONE (Cartao)', grupo: 'STONE (Cartao)', base: subgrupoStone }
  }

  const subgrupoPagSeguro = detectarSubgrupoPagSeguro(texto)
  if (subgrupoPagSeguro) {
    return { nome: 'PAGSEGURO (Cartao)', grupo: 'PAGSEGURO (Cartao)', base: subgrupoPagSeguro }
  }

  return null
}

const resumoAgrupado = computed(() => {
  const grupos = {}

  for (const transacao of props.transacoes || []) {
    const det = detectarAdquirente(transacao)
    if (!det) continue

    const grupoNome = det.grupo || det.nome
    if (!grupos[grupoNome]) {
      grupos[grupoNome] = { transacoes: [], quantidade: 0, total: 0, subgrupos: {} }
    }

    const valor = Number(transacao?.valorNumerico ?? transacao?.valor ?? 0) || 0
    grupos[grupoNome].transacoes.push(transacao)
    grupos[grupoNome].quantidade += 1
    grupos[grupoNome].total += valor

    if (grupoNome === 'STONE (Cartao)') {
      const nomeSubgrupo = `${det.base} (Cartao)`
      if (!grupos[grupoNome].subgrupos[nomeSubgrupo]) {
        grupos[grupoNome].subgrupos[nomeSubgrupo] = { transacoes: [], quantidade: 0, total: 0 }
      }
      grupos[grupoNome].subgrupos[nomeSubgrupo].transacoes.push(transacao)
      grupos[grupoNome].subgrupos[nomeSubgrupo].quantidade += 1
      grupos[grupoNome].subgrupos[nomeSubgrupo].total += valor
    }
  }

  return grupos
})

const resumoStone = computed(() => resumoAgrupado.value['STONE (Cartao)'] || { transacoes: [], quantidade: 0, total: 0, subgrupos: {} })

const resumoOutros = computed(() => {
  const grupos = { ...resumoAgrupado.value }
  delete grupos['STONE (Cartao)']
  return grupos
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((Cartao|Cartão|Voucher)\)/, '')
  return coresCartoes[base] || '#6B7280'
}

const obterVoucherDescricao = () => ''
</script>
