import { ref } from 'vue'
import { useTaxasSupabase } from '../PageTaxas/useTaxasSupabase'

export const usePrevisaoColuna = () => {
  const { buscarTaxasDoSupabase } = useTaxasSupabase()
  const taxas = ref([])

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

  // Encontrar taxa comparando modalidade com a tabela cadastro_taxas do Supabase
  const encontrarTaxa = (venda) => {
    if (!taxas.value || taxas.value.length === 0) return null

    const vModal = normalizarParaComparacao(venda.modalidade ?? venda.modalidade_descricao ?? '')

    const taxaEncontrada = taxas.value.find(taxa => {
      const tModal = normalizarParaComparacao(taxa.modalidade ?? '')
      
      // Compara apenas a modalidade conforme solicitado
      return tModal && (tModal === vModal)
    })

    // Taxa encontrada para modalidade

    return taxaEncontrada || null
  }

  const calcularDataPagamento = (dataVenda, dataCorte) => {
    if (!dataVenda || dataCorte === null || dataCorte === undefined) return null

    // Converter dataVenda para objeto Date
    let data = new Date(dataVenda)
    if (isNaN(data.getTime())) {
      // Tentar formato DD/MM/YYYY
      const partes = String(dataVenda).split(/[\/\-]/)
      if (partes.length === 3) {
        const [d, m, y] = partes.map(p => parseInt(p, 10))
        data = new Date(y, m - 1, d)
      }
    }
    if (isNaN(data.getTime())) return null

    // Lógica baseada na data_corte
    if (dataCorte === 1) {
      // Se data_corte for 1, adicionar 1 dia à data de venda
      data.setDate(data.getDate() + 1)
      
      // Pular fins de semana se necessário
      while (data.getDay() === 0 || data.getDay() === 6) {
        data.setDate(data.getDate() + 1)
      }
    } else {
      // Para outros valores de data_corte, implementar lógica específica
      // Por exemplo, se data_corte for 30, pode ser 30 dias após a venda
      data.setDate(data.getDate() + parseInt(dataCorte))
    }

    return data
  }

  const calcularPrevisaoVenda = (venda) => {
    try {
      const taxa = encontrarTaxa(venda)
      if (!taxa) {
        return 'Taxa não cadastrada'
      }

      const dataCorte = taxa.data_corte
      const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data

      // Calculando previsão para modalidade

      const dataPrevisaoDate = calcularDataPagamento(dataVenda, dataCorte)
      if (!dataPrevisaoDate) return 'Erro no cálculo'

      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(dataPrevisaoDate)

      // Data de previsão calculada
      return dataFormatada
    } catch (err) {
      console.error('Erro ao calcular previsão:', err)
      return 'Erro'
    }
  }

  const inicializar = async () => {
    try {
      // Carregando taxas do Supabase...
      const taxasDoSupabase = await buscarTaxasDoSupabase()
      taxas.value = taxasDoSupabase
      // Taxas carregadas do Supabase
    } catch (err) {
      console.error('❌ Erro ao carregar taxas do Supabase:', err)
      taxas.value = []
    }
  }

  return {
    calcularPrevisaoVenda,
    inicializar,
    encontrarTaxa,
    normalizarParaComparacao,
    taxas
  }
}
