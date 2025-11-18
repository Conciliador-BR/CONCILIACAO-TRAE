import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'
import { createQueryOperations } from '~/composables/PageTaxas/SalvarTaxas/queries.js'

/**
 * Operações relacionadas a taxas
 */
export const useTaxOperations = () => {
  const { supabase } = useAPIsupabase()
  const { buscarTaxasDoSupabase } = createQueryOperations(supabase)
  
  // Estados reativos
  const taxas = ref([])

  /**
   * Função para normalizar strings para comparação
   */
  const normalizarParaComparacao = (str) => {
    if (str === null || str === undefined) return ''
    let resultado = String(str).trim().toLowerCase()

    const mapaAcentos = {
      'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c', 'ñ': 'n'
    }
    
    for (const [a, b] of Object.entries(mapaAcentos)) {
      resultado = resultado.replace(new RegExp(a, 'g'), b)
    }

    // remove tudo que não for letra ou número
    resultado = resultado.replace(/[^a-z0-9]/g, '')
    return resultado
  }

  const normalizarBandeira = (str) => {
    const s = normalizarParaComparacao(str)
    if (!s) return ''
    if (s.includes('visa')) return 'visa'
    if (s.includes('master') || s.includes('mastercard')) return 'master'
    if (s.includes('elo')) return 'elo'
    return s
  }

  const normalizarAdquirente = (str) => {
    const s = normalizarParaComparacao(str)
    if (!s) return ''
    if (s.includes('unica')) return 'unica'
    return s
  }

  /**
   * Função para encontrar taxa correspondente à venda
   */
  const encontrarTaxa = (venda) => {
    if (!taxas.value || taxas.value.length === 0) {
      return null
    }

    const vModal = normalizarParaComparacao(venda.modalidade ?? venda.modalidade_descricao ?? '')
    const vBandeira = normalizarBandeira(venda.bandeira ?? '')
    const vAdq = normalizarAdquirente(venda.adquirente ?? '')

    const taxaPorChave = taxas.value.find(taxa => {
      const tModal = normalizarParaComparacao(taxa.modalidade ?? '')
      const tBand = normalizarBandeira(taxa.bandeira ?? '')
      const tAdq = normalizarAdquirente(taxa.adquirente ?? '')

      const eqModal = tModal && (tModal === vModal || tModal.includes(vModal) || vModal.includes(tModal))
      const eqBand = tBand ? (tBand === vBandeira) : true
      const eqAdq = tAdq ? (tAdq === vAdq) : true
      return eqModal && eqBand && eqAdq
    })

    if (taxaPorChave) return taxaPorChave

    const taxaPorModalidade = taxas.value.find(taxa => {
      const tModal = normalizarParaComparacao(taxa.modalidade ?? '')
      return tModal && (tModal === vModal || tModal.includes(vModal) || vModal.includes(tModal))
    })

    return taxaPorModalidade || null
  }

  /**
   * Função para carregar taxas do banco
   */
  const carregarTaxas = async () => {
    try {
      const taxasDoSupabase = await buscarTaxasDoSupabase()
      taxas.value = taxasDoSupabase
    } catch (err) {
      console.error('Erro ao carregar taxas:', err)
      taxas.value = []
    }
  }

  return {
    taxas,
    normalizarParaComparacao,
    encontrarTaxa,
    carregarTaxas
  }
}