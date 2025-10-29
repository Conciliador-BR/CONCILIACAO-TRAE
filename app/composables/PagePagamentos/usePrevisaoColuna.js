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

  // Lista de feriados nacionais brasileiros (formato: MM-DD)
  const feriadosNacionais = [
    '01-01', // Confraternização Universal
    '04-21', // Tiradentes
    '06-19', // Corpus Christi
    '09-07', // Independência do Brasil
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '12-25', // Natal
    // Feriados móveis precisariam ser calculados separadamente (Carnaval, Páscoa, etc.)
  ]

  // Função para verificar se é feriado
  const ehFeriado = (data) => {
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    const dataFormatada = `${mes}-${dia}`
    
    return feriadosNacionais.includes(dataFormatada)
  }

  // Função para ajustar para o próximo dia útil (considerando fins de semana e feriados)
  const ajustarParaProximoDiaUtil = (data) => {
    const dataAjustada = new Date(data)
    
    // Se for sábado (6), domingo (0) ou feriado, avançar para o próximo dia útil
    while (dataAjustada.getDay() === 0 || dataAjustada.getDay() === 6 || ehFeriado(dataAjustada)) {
      dataAjustada.setDate(dataAjustada.getDate() + 1)
    }
    
    return dataAjustada
  }

  const calcularDataPagamento = (dataVenda, dataCorte, venda = null) => {
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

    // Adicionar os dias do data_corte
    data.setDate(data.getDate() + parseInt(dataCorte))
    
    // Ajustar para o próximo dia útil (considerando fins de semana e feriados)
    data = ajustarParaProximoDiaUtil(data)

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

      const dataPrevisaoDate = calcularDataPagamento(dataVenda, dataCorte, venda)
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
