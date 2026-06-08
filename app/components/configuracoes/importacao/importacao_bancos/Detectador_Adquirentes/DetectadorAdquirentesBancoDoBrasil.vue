<template>
  <div>
    <div v-if="resumoRede.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-orange-600">
            R
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">REDE</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Brasil
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

    <CardResumoAdquirente
      v-for="(grupo, nome) in resumoOutros"
      :key="nome"
      :adquirente="nome"
      :banco="grupo.transacoes[0]?.banco || 'Banco do Brasil'"
      :quantidade="grupo.quantidade"
      :total="grupo.total"
      :cor="obterCor(nome)"
      :transacoes="grupo.transacoes"
      :resolver-voucher="obterVoucherDescricao"
      :resumos-conciliacao="obterResumosConciliacao(nome)"
      :loading-conciliacao="mostrarConciliacao(nome) ? loadingRecebimentos : false"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import CardResumoAdquirente from '../CardResumoAdquirente.vue'
import TransacoesResumidasAjustavel from '../TransacoesResumidasAjustavel.vue'
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'

const props = defineProps({
  transacoes: { type: Array, default: () => [] }
})

const expandidos = ref({})
const recebimentos = ref([])
const loadingRecebimentos = ref(false)
const { fetchRecebimentos } = useRecebimentosCRUD()

const carregarRecebimentos = async () => {
  if (!props.transacoes || props.transacoes.length === 0) {
    recebimentos.value = []
    return
  }
  loadingRecebimentos.value = true
  try {
    const data = await fetchRecebimentos()
    recebimentos.value = Array.isArray(data) ? data : []
  } catch (error) {
    recebimentos.value = []
  } finally {
    loadingRecebimentos.value = false
  }
}

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

const normalizarDataParaISO = (valor) => {
  const texto = String(valor || '').trim()
  if (!texto) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dd, mm, yyyy] = texto.split('/')
    return `${yyyy}-${mm}-${dd}`
  }
  const d = new Date(texto)
  if (isNaN(d.getTime())) return null
  const yyyy = String(d.getFullYear()).padStart(4, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const formatarDataBr = (dataIso) => {
  if (!dataIso || !/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return ''
  const [yyyy, mm, dd] = dataIso.split('-')
  return `${dd}/${mm}/${yyyy}`
}

const detectarTipoLancamentoUnica = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto) return ''
  if (!texto.includes('TRIANGULO')) return ''
  if (texto.includes('DEBITO') || texto.includes(' DEB ')) return 'DEBITO'
  // No BB, "TRIANGULO ANTECIPACAO" entra no fluxo de credito para conciliacao.
  if (texto.includes('ANTECIP')) return 'CREDITO'
  if (texto.includes('CREDITO') || texto.includes(' CREDIT') || texto.includes(' CRED ')) return 'CREDITO'
  return ''
}

const detectarTipoLancamentoCielo = (descricao) => {
  const texto = normalizar(descricao)
  if (!texto || !texto.includes('CIELO')) return ''
  if (texto.includes('PIX')) return 'PIX'
  if (texto.includes('CIELO VENDAS DEBITO')) return 'DEBITO'
  if (texto.includes('CIELO CARTOES')) return 'CREDITO'
  if (texto.includes('DEBITO') || texto.includes(' DEB ')) return 'DEBITO'
  if (
    texto.includes('CREDITO') ||
    texto.includes(' CREDIT') ||
    texto.includes(' CRED ') ||
    texto.includes('VISA') ||
    texto.includes('VOUCHER')
  ) return 'CREDITO'
  return ''
}

const detectarTipoRecebimento = (rec) => {
  const modalidade = normalizar(rec?.modalidade || rec?.produto || '')
  const bandeira = normalizar(rec?.bandeira || '')
  const contextoRecebimento = normalizar([
    rec?.modalidade,
    rec?.produto,
    rec?.tipo_lancamento,
    rec?.descricao,
    rec?.observacoes
  ].filter(Boolean).join(' '))
  const parcelas = Number(rec?.numero_parcelas || 0)
  const antecipacao = Number(rec?.valor_antecipacao || 0)
  const modalidadeEhVoucherOuMulti = (
    contextoRecebimento.includes('VOUCHER') ||
    contextoRecebimento.includes('MULTIBENEF') ||
    contextoRecebimento.includes('MULTIBENEFICIOS') ||
    contextoRecebimento.includes('MULTI BENEF')
  )

  if (ehAluguelMaquina(rec)) return 'DEBITO'

  if (contextoRecebimento.includes('PIX') || bandeira.includes('PIX')) return 'PIX'
  if (modalidade.includes('DEBIT')) return 'DEBITO'
  if (modalidade.includes('CREDITO') || modalidade.includes('CREDIT') || modalidade.includes('PARCELADO')) return 'CREDITO'
  // No BB/UNICA/CIELO pode vir modalidade "VOUCHER" ou "MULTIBENEFICIOS"
  // para venda de cartao (ex.: VISA/MASTER/ELO), o que deve cair no credito.
  if (modalidadeEhVoucherOuMulti) {
    if (bandeira.includes('DEBIT') || bandeira.includes('ELECTRON') || bandeira.includes('MAESTRO')) return 'DEBITO'
    if (
      bandeira.includes('VISA') ||
      bandeira.includes('MASTER') ||
      bandeira.includes('MASTERCARD') ||
      bandeira.includes('ELO') ||
      bandeira.includes('AMEX') ||
      bandeira.includes('HIPER')
    ) return 'CREDITO'
  }
  if (bandeira.includes('DEBIT')) return 'DEBITO'
  if (bandeira.includes('CREDITO') || bandeira.includes('CREDIT')) return 'CREDITO'
  if (antecipacao > 0) return 'CREDITO'
  if (parcelas > 1) return 'CREDITO'
  return ''
}

const ehRecebimentoUnica = (rec) => {
  const adquirente = normalizar(rec?.adquirente || '')
  const origemTabela = normalizar(rec?.__source_table || '')
  return (
    adquirente.includes('UNICA') ||
    adquirente.includes('TRIANGULO') ||
    adquirente.includes('TRIPAG') ||
    origemTabela.includes('_UNICA')
  )
}

const ehRecebimentoCielo = (rec) => {
  const adquirente = normalizar(rec?.adquirente || '')
  const origemTabela = normalizar(rec?.__source_table || '')
  return (
    adquirente.includes('CIELO') ||
    origemTabela.includes('_CIELO')
  )
}

const obterBandeira = (rec) => {
  const valor = String(rec?.bandeira || '').trim()
  const contextoRecebimento = normalizar([
    rec?.modalidade,
    rec?.produto,
    rec?.tipo_lancamento,
    rec?.descricao,
    rec?.observacoes
  ].filter(Boolean).join(' '))
  if (contextoRecebimento.includes('PIX')) return 'PIX'
  return valor ? normalizar(valor) : 'SEM BANDEIRA'
}

const obterValorPrevistoUnica = (rec) => {
  if (ehAluguelMaquina(rec)) {
    const despesaMdr = Number(rec?.despesa_mdr ?? rec?.despesaMdr ?? 0) || 0
    const valorBruto = Number(rec?.valor_bruto ?? rec?.valorBruto ?? 0) || 0
    const valorPago = Number(rec?.valor_liquido_antecipacao ?? rec?.valorLiquidoAntecipacao ?? rec?.valor_liquido ?? rec?.valorLiquido ?? 0) || 0
    const valorBrutoComMdr = Number(rec?.valor_bruto_despesa_mdr ?? rec?.valorBrutoDespesaMdr ?? 0) || 0
    const valorNumerico = Number(rec?.valor_numerico ?? rec?.valorNumerico ?? rec?.valor ?? 0) || 0
    const valorVenda = Number(rec?.valor_venda ?? rec?.valorVenda ?? 0) || 0
    const base = Math.abs(despesaMdr) ||
      Math.abs(valorBruto) ||
      Math.abs(valorPago) ||
      Math.abs(valorBrutoComMdr) ||
      Math.abs(valorNumerico) ||
      Math.abs(valorVenda)
    // Aluguel deve abater do previsto (valor negativo), igual ao consolidado de recebimentos.
    return -base
  }

  // Para UNICA, priorizar valor liquido antecipacao (valor pago).
  return Number(
    rec?.valor_liquido_antecipacao ??
    rec?.valorLiquidoAntecipacao ??
    rec?.valor_pago ??
    rec?.valorPago ??
    rec?.valor_liquido ??
    rec?.valorLiquido ??
    rec?.valor_bruto ??
    0
  ) || 0
}

const obterValorPrevistoPadrao = (rec) => {
  return Number(
    rec?.valor_pago ??
    rec?.valorPago ??
    rec?.valor_liquido ??
    rec?.valorLiquido ??
    rec?.valor_liquido_antecipacao ??
    rec?.valorLiquidoAntecipacao ??
    rec?.valor_bruto ??
    rec?.valorBruto ??
    0
  ) || 0
}

const obterValorPrevistoPix = (rec) => {
  return Number(
    rec?.valor_liquido ??
    rec?.valorLiquido ??
    rec?.valor_pago ??
    rec?.valorPago ??
    rec?.valor_liquido_antecipacao ??
    rec?.valorLiquidoAntecipacao ??
    rec?.valor_bruto ??
    rec?.valorBruto ??
    0
  ) || 0
}

const obterValorAjusteAluguel = (rec) => {
  const despesaMdr = Number(rec?.despesa_mdr ?? rec?.despesaMdr ?? 0) || 0
  const valorBruto = Number(rec?.valor_bruto ?? rec?.valorBruto ?? 0) || 0
  const valorPago = Number(
    rec?.valor_pago ??
    rec?.valorPago ??
    rec?.valor_liquido ??
    rec?.valorLiquido ??
    rec?.valor_liquido_antecipacao ??
    rec?.valorLiquidoAntecipacao ??
    0
  ) || 0
  const valorNumerico = Number(rec?.valor_numerico ?? rec?.valorNumerico ?? rec?.valor ?? 0) || 0
  const base = Math.abs(despesaMdr) || Math.abs(valorBruto) || Math.abs(valorPago) || Math.abs(valorNumerico)
  return -base
}

const ehAluguelMaquina = (rec) => {
  const modalidade = normalizar(rec?.modalidade || '')
  const bandeira = normalizar(rec?.bandeira || '')
  const produto = normalizar(rec?.produto || '')
  const motivo = normalizar(rec?.motivo || rec?.historico || rec?.tipo_lancamento || '')
  const observacoes = normalizar(rec?.observacoes || rec?.descricao || '')
  const texto = `${modalidade} ${bandeira} ${produto} ${motivo} ${observacoes}`.trim()

  const temContextoMaquina = texto.includes('MAQUIN') || texto.includes('TERMINAL') || texto.includes('POS')
  const aluguelExplicito = texto.includes('ALUGUEL') && temContextoMaquina
  const ajusteMensalidade = (
    bandeira.includes('AJUSTE') &&
    (modalidade.includes('MENSALIDADE') || produto.includes('MENSALIDADE')) &&
    temContextoMaquina
  )

  return aluguelExplicito || ajusteMensalidade
}

const mesclarSemDuplicar = (listaBase, listaExtra) => {
  const resultado = [...(listaBase || [])]
  for (const item of (listaExtra || [])) {
    if (!resultado.includes(item)) {
      resultado.push(item)
    }
  }
  return resultado
}

const obterDataPagamentoRecebimento = (rec) => {
  return normalizarDataParaISO(
    rec?.data_pagamento ||
    rec?.data_pgto ||
    rec?.data_recebimento ||
    rec?.data_venda ||
    rec?.data
  )
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
  'CABAL DEBITO': '#B45309',
  'VISA': '#1E3A8A',
  'CABAL CREDITO': '#92400E',
  'ELO CREDITO': '#D97706',
  'MASTERCARD': '#DC2626',
  'AMEX CREDITO': '#22C55E',
  'HIPERCARD CREDITO': '#EF4444'
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
  'NAIP': '#FDE047',
  'ROM CARD': '#6366F1'
}

const configAliases = computed(() => {
  const base = {
    'TRIANGULO': { categoria: 'CartÃ£o', aliases: ['TRIANGULO'] },
    'UNICA': { categoria: 'CartÃ£o', aliases: ['UNICA'] },
    'CIELO': { categoria: 'CartÃ£o', aliases: ['CIELO'] },
    'SIPAG': { categoria: 'CartÃ£o', aliases: ['SIPAG'] },
    'SICREDI': { categoria: 'CartÃ£o', aliases: ['SICREDI'] },
    'REDE': { categoria: 'CartÃ£o', aliases: ['REDE', 'REDE_'] },
    'STONE': { categoria: 'CartÃ£o', aliases: ['STONE', 'STON'] },
    'AZULZINHA': { categoria: 'CartÃ£o', aliases: ['AZULZINHA'] },
    'PAG SEGURO': { categoria: 'CartÃ£o', aliases: ['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'] },

    'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
    'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR', 'PLUXEE', 'PLUXEE INSTITU', 'A PLUXE'] },
    'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO'] },
    'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF', 'VR BENEFCIO', 'BANCO VR'] },
    'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD', 'LE CARD ADM'] },
    'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'] },
    'COMPROCARD': { categoria: 'Voucher', aliases: ['COMPROCARD LTD'] },
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
    'CABAL PRE': { categoria: 'Voucher', aliases: ['CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CRTO CABAL SICOOB SO', 'CARTAO CABAL SICOOB SO', 'CABAL SICOOB SO', 'SICOOB CARTAO CREDITO', 'SICOB CARTAO CREDITO'] },
    'VEROCARD': { categoria: 'Voucher', aliases: ['VEROCARD'] },
    'VEROCHEQUE': { categoria: 'Voucher', aliases: ['VEROCHEQUE'] },
    'FACECARD': { categoria: 'Voucher', aliases: ['FACECARD'] },
    'VALE CARD': { categoria: 'Voucher', aliases: ['VALE CARD', 'VALECARD'] },
    'NAIP': { categoria: 'Voucher', aliases: ['NAIP'] },
    'GREEN CARD': { categoria: 'Voucher', aliases: ['GREEN CARD', 'GREEN CARD'] },
    'LIBERCARD': { categoria: 'Voucher', aliases: ['LIBERCARD', 'LIBER CARD', 'LIBERCAD', 'MANDACARU ADMINISTRADORA', 'MANDACARU'] },
    'ROM CARD': { categoria: 'Voucher', aliases: ['ROM CARD ADM', 'ROM CARD'] },
    'ES CARD': { categoria: 'Voucher', aliases: ['ES CARD', 'ES CARD BEN'] }
  }
  return base
})

const detectarSubgrupoRede = (textoNorm) => {
  // Regras especÃ­ficas solicitadas para REDE no Banco do Brasil
  if (/REDE[\s._-]*VENDAS[\s._-]*MASTER[\s._-]*DEBITO/.test(textoNorm)) return 'MAESTRO'
  if (/REDE[\s._-]*VENDAS[\s._-]*VISA[\s._-]*DEBITO/.test(textoNorm)) return 'VISA ELECTRON'
  if (/(?:REDE|RECE)CARD/.test(textoNorm) && /FUNCAO[\s._-]*DEBITO|FUNCAO\s+DEBITO|FUNCAO/.test(textoNorm)) return 'ELO DEBITO'
  if (/\bREDE(?:CARD)?[\s._-]*DEBITO\b/.test(textoNorm) || /\bREDE(?:CARD)?\b.*\bFUNCAO[\s._-]*DEBITO\b/.test(textoNorm)) return 'ELO DEBITO'
  if (/REDE[\s._-]*VENDAS[\s._-]*MASTER[\s._-]*CREDIT/.test(textoNorm)) return 'MASTERCARD'
  if (/REDE[\s._-]*VENDAS[\s._-]*VISA[\s._-]*CREDITO/.test(textoNorm)) return 'VISA'
  if (/REDE[\s._-]*CREDITO/.test(textoNorm)) return 'ELO CREDITO'

  if (/REDE[\s._-]*CABA(?:L)?[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bDBTO[\s._-]*CABA(?:L)?\b/.test(textoNorm)) return 'CABAL DEBITO'
  if (/REDE[\s._-]*CABA(?:L)?[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bCR(?:EDITO)?[\s._-]*CABA(?:L)?\b/.test(textoNorm)) return 'CABAL CREDITO'
  if (/VISA[\s.-]*DB|DEBITO[\s.-]*VISA/.test(textoNorm)) return 'VISA ELECTRON'
  if (/ELO[\s.-]*DB|DEBITO[\s.-]*ELO/.test(textoNorm)) return 'ELO DEBITO'
  if (/MAST[\s.-]*DB|MASTER[\s.-]*DEBITO|DEBITO[\s.-]*MASTER|MAESTRO/.test(textoNorm)) return 'MAESTRO'
  if (/VISA[\s.-]*CD|VISA[\s.-]*AT|CREDITO[\s.-]*VISA/.test(textoNorm)) return 'VISA'
  if (/ELO[\s.-]*CD|ELO[\s.-]*AT|CREDITO[\s.-]*ELO/.test(textoNorm)) return 'ELO CREDITO'
  if (/MAST[\s.-]*CD|MAST[\s.-]*AT|MASTER[\s.-]*CREDITO|CREDITO[\s.-]*MASTER/.test(textoNorm)) return 'MASTERCARD'
  if (/AMEX[\s.-]*CD|AMEX[\s.-]*AT|CREDITO[\s.-]*AMEX|AMERICAN[\s.-]*EXPRESS/.test(textoNorm)) return 'AMEX CREDITO'
  if (/HIPER[\s.-]*CD|HIPER[\s.-]*AT|CREDITO[\s.-]*HIPER|HIPERCARD/.test(textoNorm)) return 'HIPERCARD CREDITO'
  return 'REDE'
}

const detectarAdquirente = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const textoNorm = normalizar(original)
  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  const regrasCartoes = [
    { nome: 'UNICA', re: /\bTRIANGULO(?:[_\s-]|$)/i },
    { nome: 'UNICA', re: /\bUNICA(?:[_\s-]|$)/i },
    { nome: 'CIELO', re: /\bCIELO(?:[_\s-]|$)/i },
    { nome: 'SIPAG', re: /\bSIPAG(?:[_\s-]|$)/i },
    { nome: 'SICREDI', re: /\bSICREDI(?:[_\s-]|$)/i },
    { nome: 'REDE', re: /^REDE[_\s-]/i },
    { nome: 'STONE', re: /\bSTONE(?:[_\s-]|$)/i },
    { nome: 'AZULZINHA', re: /\bAZULZINHA(?:[_\s-]|$)/i },
    { nome: 'PAG SEGURO', re: /\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b/i }
  ]
  const podeDetectarCartao = !isPix || regrasCartoes.some(r => r.re.test(original))
  if (podeDetectarCartao) {
    if (/CR\s+CPS\s+VS\s+ELECTRON/i.test(upper)) {
      return { nome: 'SIPAG (CartÃ£o)', base: 'SIPAG', categoria: 'CartÃ£o' }
    }
    if (/^REDE[_\s-]/i.test(original) || /\bREDE\b/.test(upper) || /(?:REDE|RECE)CARD/.test(upper)) {
      const subgrupo = detectarSubgrupoRede(textoNorm)
      return { nome: `${subgrupo} (CartÃ£o)`, base: subgrupo, categoria: 'CartÃ£o' }
    }
    for (const r of regrasCartoes) {
      if (r.re.test(original)) {
        return { nome: `${r.nome} (CartÃ£o)`, base: r.nome, categoria: 'CartÃ£o' }
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

const nomesRede = [
  'VISA ELECTRON (CartÃ£o)',
  'ELO DEBITO (CartÃ£o)',
  'MAESTRO (CartÃ£o)',
  'CABAL DEBITO (CartÃ£o)',
  'VISA (CartÃ£o)',
  'CABAL CREDITO (CartÃ£o)',
  'ELO CREDITO (CartÃ£o)',
  'MASTERCARD (CartÃ£o)',
  'AMEX CREDITO (CartÃ£o)',
  'HIPERCARD CREDITO (CartÃ£o)',
  'REDE (CartÃ£o)'
]

const resumoRede = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }
  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    if (nomesRede.includes(nome)) {
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
    if (!nomesRede.includes(nome)) {
      dados[nome] = grupo
    }
  }
  return Object.fromEntries(ordenarGruposResumo(Object.entries(dados)))
})

const resumoConciliacaoUnica = computed(() => {
  const grupoUnica = resumoOutros.value['UNICA (CartÃ£o)']
  if (!grupoUnica?.transacoes || grupoUnica.transacoes.length === 0) return []

  const encontrados = new Map()
  for (const t of grupoUnica.transacoes) {
    const valor = Number(t?.valorNumerico ?? t?.valor ?? 0) || 0
    if (valor <= 0) continue

    const dataIso = normalizarDataParaISO(t?.data || t?.data_formatada)
    if (!dataIso) continue

    const tipo = detectarTipoLancamentoUnica(t?.descricao)
    if (!tipo) continue

    const descricaoNorm = normalizar(t?.descricao)
    const rotuloEncontrado = descricaoNorm.includes('ANTECIP')
      ? 'TRIANGULO ANTECIPACAO'
      : (tipo === 'DEBITO' ? 'TRIANGULO DEBITO' : 'TRIANGULO CREDITO')

    const chave = `${dataIso}|${tipo || 'NAO_IDENTIFICADO'}`
    if (!encontrados.has(chave)) {
      encontrados.set(chave, {
        dataIso,
        tipo,
        valorEncontrado: 0,
        rotuloEncontrado
      })
    }
    encontrados.get(chave).valorEncontrado += valor
  }

  const recebimentosUnica = (recebimentos.value || []).filter(ehRecebimentoUnica)

  return Array.from(encontrados.values())
    .map(item => {
      const candidatosData = recebimentosUnica.filter(rec => {
        const dataRec = obterDataPagamentoRecebimento(rec)
        return dataRec === item.dataIso
      })

      const candidatosTipo = item.tipo
        ? candidatosData.filter(rec => detectarTipoRecebimento(rec) === item.tipo)
        : candidatosData

      const somarNoMapa = (mapa, chave, valor) => {
        mapa.set(chave, (mapa.get(chave) || 0) + (Number(valor) || 0))
      }

      // 1) Base por bandeira (VISA/MASTER/ELO...) sem aluguel
      const previstosBasePorBandeira = new Map()
      for (const rec of candidatosTipo.filter(rec => !ehAluguelMaquina(rec))) {
        const bandeira = obterBandeira(rec)
        somarNoMapa(previstosBasePorBandeira, bandeira, obterValorPrevistoUnica(rec))
      }

      // 2) Ajuste de aluguel do dia para debito
      const alugueisDoDia = candidatosData.filter(ehAluguelMaquina)
      const totalAluguelDoDia = item.tipo === 'DEBITO'
        ? alugueisDoDia.reduce((acc, rec) => acc + obterValorPrevistoUnica(rec), 0)
        : 0

      const previstoPorBandeira = previstosBasePorBandeira

      const previstos = Array.from(previstoPorBandeira.entries())
        .map(([bandeira, valor]) => ({ bandeira, valor }))
      if (item.tipo === 'DEBITO' && totalAluguelDoDia !== 0) {
        previstos.push({
          bandeira: 'DESPESA COM ALUGUEL',
          valor: totalAluguelDoDia
        })
      }
      previstos.sort((a, b) => b.valor - a.valor)

      const totalPrevisto = previstos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0)
      const diferenca = item.valorEncontrado - totalPrevisto
      const status = previstos.length === 0
        ? 'Sem previsto'
        : Math.abs(diferenca) <= 0.5
          ? 'Conciliado'
          : 'Divergente'

      return {
        data: formatarDataBr(item.dataIso),
        tipo: item.tipo,
        rotuloEncontrado: item.rotuloEncontrado,
        valorEncontrado: item.valorEncontrado,
        previstos,
        totalPrevisto,
        diferenca,
        status
      }
    })
    .sort((a, b) => {
      const [da, ma, aa] = String(a.data).split('/')
      const [db, mb, ab] = String(b.data).split('/')
      const dataA = new Date(`${aa}-${ma}-${da}`)
      const dataB = new Date(`${ab}-${mb}-${db}`)
      return dataB - dataA
    })
})

const resumoConciliacaoCielo = computed(() => {
  const grupoCielo = resumoOutros.value['CIELO (CartÃ£o)']
  if (!grupoCielo?.transacoes || grupoCielo.transacoes.length === 0) return []

  const recebimentosCielo = (recebimentos.value || []).filter(ehRecebimentoCielo)
  const encontrados = new Map()
  for (const t of grupoCielo.transacoes) {
    const valor = Number(t?.valorNumerico ?? t?.valor ?? 0) || 0
    if (valor <= 0) continue

    const dataIso = normalizarDataParaISO(t?.data || t?.data_formatada)
    if (!dataIso) continue

    const tipo = detectarTipoLancamentoCielo(t?.descricao)
    if (!tipo) continue

    const rotuloEncontrado = tipo === 'DEBITO'
      ? 'CIELO VENDAS DÃ‰BITO'
      : (tipo === 'PIX' ? 'CIELO PIX' : 'CIELO - CARTOES')
    const chave = `${dataIso}|${tipo || 'NAO_IDENTIFICADO'}`
    if (!encontrados.has(chave)) {
      encontrados.set(chave, {
        dataIso,
        tipo,
        valorEncontrado: 0,
        rotuloEncontrado
      })
    }
    encontrados.get(chave).valorEncontrado += valor
  }

  for (const t of (props.transacoes || [])) {
    const valor = Number(t?.valorNumerico ?? t?.valor ?? 0) || 0
    if (valor <= 0) continue

    const dataIso = normalizarDataParaISO(t?.data || t?.data_formatada)
    const descricaoNorm = normalizar(t?.descricao)
    const jaClassificadoComoPixCielo = detectarTipoLancamentoCielo(t?.descricao) === 'PIX'
    const temContextoPixRecebidoSupermercad = (
      descricaoNorm.includes('PIX') &&
      descricaoNorm.includes('RECEBIDO') &&
      descricaoNorm.includes('SUPERMERCAD')
    )
    if (!dataIso || jaClassificadoComoPixCielo || !temContextoPixRecebidoSupermercad) continue

    const temPixCieloNoDia = recebimentosCielo.some(rec => {
      if (detectarTipoRecebimento(rec) !== 'PIX') return false
      if (obterDataPagamentoRecebimento(rec) !== dataIso) return false
      return obterValorPrevistoPix(rec) > 0
    })

    if (!temPixCieloNoDia) continue

    const chave = `${dataIso}|PIX`
    if (!encontrados.has(chave)) {
      encontrados.set(chave, {
        dataIso,
        tipo: 'PIX',
        valorEncontrado: 0,
        rotuloEncontrado: 'CIELO PIX'
      })
    }
    encontrados.get(chave).valorEncontrado += valor
  }

  return Array.from(encontrados.values())
    .map(item => {
      const candidatosData = recebimentosCielo.filter(rec => {
        const dataRec = obterDataPagamentoRecebimento(rec)
        return dataRec === item.dataIso
      })

      const candidatosTipo = item.tipo
        ? candidatosData.filter(rec => detectarTipoRecebimento(rec) === item.tipo)
        : candidatosData

      const previstosBasePorBandeira = new Map()
      for (const rec of candidatosTipo) {
        const bandeira = obterBandeira(rec)
        const valorPrevisto = item.tipo === 'PIX'
          ? obterValorPrevistoPix(rec)
          : obterValorPrevistoPadrao(rec)
        previstosBasePorBandeira.set(
          bandeira,
          (previstosBasePorBandeira.get(bandeira) || 0) + valorPrevisto
        )
      }

      const alugueisDoDia = candidatosData.filter(ehAluguelMaquina)
      const totalAluguelDoDia = item.tipo === 'CREDITO'
        ? alugueisDoDia.reduce((acc, rec) => acc + obterValorAjusteAluguel(rec), 0)
        : 0

      const previstos = Array.from(previstosBasePorBandeira.entries())
        .map(([bandeira, valor]) => ({ bandeira, valor }))
      if (totalAluguelDoDia !== 0) {
        previstos.push({
          bandeira: 'DESPESA COM ALUGUEL',
          valor: totalAluguelDoDia
        })
      }
      previstos.sort((a, b) => b.valor - a.valor)

      const totalPrevisto = previstos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0)
      const valorEncontradoConsiderado = (
        item.tipo === 'PIX' &&
        item.valorEncontrado > totalPrevisto &&
        totalPrevisto > 0
      )
        ? totalPrevisto
        : item.valorEncontrado
      const diferenca = valorEncontradoConsiderado - totalPrevisto
      const status = previstos.length === 0
        ? 'Sem previsto'
        : Math.abs(diferenca) <= 0.5
          ? 'Conciliado'
          : 'Divergente'

      return {
        data: formatarDataBr(item.dataIso),
        tipo: item.tipo,
        rotuloEncontrado: item.rotuloEncontrado,
        valorEncontrado: valorEncontradoConsiderado,
        previstos,
        totalPrevisto,
        diferenca,
        status
      }
    })
    .sort((a, b) => {
      const [da, ma, aa] = String(a.data).split('/')
      const [db, mb, ab] = String(b.data).split('/')
      const dataA = new Date(`${aa}-${ma}-${da}`)
      const dataB = new Date(`${ab}-${mb}-${db}`)
      return dataB - dataA
    })
})

const mostrarConciliacao = (nome) => {
  const base = String(nome || '').split('(')[0].trim().toUpperCase()
  return base === 'UNICA' || base === 'CIELO'
}

const obterResumosConciliacao = (nome) => {
  const base = String(nome || '').split('(')[0].trim().toUpperCase()
  if (base === 'UNICA') return resumoConciliacaoUnica.value
  if (base === 'CIELO') return resumoConciliacaoCielo.value
  return []
}

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃ£o|Voucher)\)/, '')
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

watch(
  () => props.transacoes?.length || 0,
  async (total) => {
    if (total > 0) {
      await carregarRecebimentos()
    } else {
      recebimentos.value = []
    }
  },
  { immediate: true }
)
</script>

<style scoped>
</style>



