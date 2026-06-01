<template>
  <div>
    <!-- Container Especial UNICA -->
    <div v-if="resumoUnica.quantidade > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <!-- CabeÃƒÂ§alho UNICA -->
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
              Tribanco
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">TransaÃ§Ãµes</p>
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
  'VISA VOUCHER': '#14B8A6',
  'ELO CREDITO': '#D97706',
  'ELO VOUCHER': '#22C55E',
  'MASTERCARD': '#DC2626',
  'MASTERCARD VOUCHER': '#06B6D4',
  'BANESCARD DEBITO': '#0F766E',
  'CABAL DEBITO': '#B45309',
  'CABAL CREDITO': '#92400E',
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
  'NAIP': '#FDE047',
  'VISA BENEFI': '#14B8A6',
  'MASTERCARD BENEFI': '#06B6D4',
  'ELO BENEFI': '#22C55E'
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
    'VISA BENEFI': { categoria: 'Voucher', aliases: ['VISA BENEFI', 'BENEFI VISA'] },
    'MASTERCARD BENEFI': { categoria: 'Voucher', aliases: ['MASTERCARD BENEFI', 'MASTER BENEFI', 'BENEFI MASTERCARD', 'BENEFI MASTER'] },
    'ELO BENEFI': { categoria: 'Voucher', aliases: ['ELO BENEFI', 'BENEFI ELO'] },
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
  const compartilhado = detectarAgrupamentoResumoTribanco(descricao)
  if (compartilhado) return compartilhado
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
  'VISA VOUCHER (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'ELO VOUCHER (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'MASTERCARD VOUCHER (CartÃ£o)',
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

const nomesRede = [
  'VISA ELECTRON (CartÃ£o)',
  'ELO DEBITO (CartÃ£o)',
  'MAESTRO (CartÃ£o)',
  'CABAL DEBITO (CartÃ£o)',
  'VISA (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'CABAL CREDITO (CartÃ£o)',
  'AMEX (CartÃ£o)'
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

const resumoRede = computed(() => {
  const dados = {
    quantidade: 0,
    total: 0,
    subgrupos: {}
  }

  for (const [, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (grupo.grupo === 'REDE' && nomesRede.includes(grupo.nome)) {
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
    if (grupo.grupo !== 'UNICA' && grupo.grupo !== 'STONE' && grupo.grupo !== 'REDE') {
      dados[grupo.nome] = grupo
    }
  }
  return Object.fromEntries(ordenarGruposResumo(Object.entries(dados)))
})

const totalGeral = computed(() => {
  return Object.values(resumoPorAdquirente.value).reduce((acc, d) => acc + d.total, 0)
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃ£o|Cartao|Voucher)\)/, '').replace(/\s+STONE$/, '')
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




