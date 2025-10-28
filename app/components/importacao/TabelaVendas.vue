<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6" v-if="vendas.length > 0">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">4. Vendas Processadas</h2>
      <div class="flex space-x-4">
        <span class="text-sm text-gray-600">
          Total: {{ vendas.length }} vendas
        </span>
        <span class="text-sm text-gray-600">
          Valor Bruto: {{ formatCurrency(valorBrutoTotal) }}
        </span>
        <span class="text-sm text-gray-600 font-semibold text-green-600">
          Valor Líquido: {{ formatCurrency(valorLiquidoTotal) }}
        </span>
      </div>
    </div>
    
    <!-- Tabela de Vendas -->
    <div class="overflow-x-auto">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">ID</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Modalidade</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Bruto</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Taxa MDR</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa MDR</th>
            <th class="px-2 py-2 text-center text-xs font-medium">Nº Parcelas</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Bandeira</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido Antecipação</th>
            <th class="px-2 py-2 text-center text-xs font-medium text-blue-600">Previsão PGTO</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Adquirente</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Empresa</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Matriz</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(venda, index) in paginatedVendas" 
            :key="index"
            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="px-2 py-2 text-xs">{{ venda.id || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(venda.data_venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.modalidade }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ venda.nsu }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium">{{ formatCurrency(venda.valor_bruto) }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium text-green-600">{{ formatCurrency(venda.valor_liquido) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.taxa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.despesa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-center">{{ venda.numero_parcelas || 1 }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.bandeira }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.despesa_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_liquido_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-center font-medium text-blue-600">{{ calcularPrevisaoVenda(venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.adquirente }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.empresa }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.matriz }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Componente de Paginação -->
    <VendasPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :items-per-page="itemsPerPage"
      @update:currentPage="setPage"
      @update:itemsPerPage="setItemsPerPage"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useTaxasSupabase } from '../../composables/PageTaxas/useTaxasSupabase'
import VendasPagination from './VendasPagination.vue'

const props = defineProps({
  vendas: {
    type: Array,
    default: () => []
  }
})

// Estados para paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed para paginação
const totalItems = computed(() => props.vendas.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedVendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.vendas.slice(start, end)
})

// Métodos de paginação
const setPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const setItemsPerPage = (newSize) => {
  itemsPerPage.value = newSize
  currentPage.value = 1 // Reset para primeira página
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const valorBrutoTotal = computed(() => {
  return props.vendas.reduce((total, venda) => total + (venda.valor_bruto || 0), 0)
})

const valorLiquidoTotal = computed(() => {
  return props.vendas.reduce((total, venda) => total + (venda.valor_liquido || 0), 0)
})

// ✅ Função para cores alternadas nas linhas
const getRowClasses = (index) => {
  const baseClasses = 'border-t hover:bg-blue-50 transition-colors duration-150'
  const isEven = index % 2 === 0
  return isEven ? baseClasses + ' bg-white' : baseClasses + ' bg-gray-50'
}

// ✅ Função para calcular previsão de pagamento
const calcularPrevisaoPagamento = (venda) => {
  try {
    if (!venda.data_venda) return 'Data inválida'
    
    let dataVenda = new Date(venda.data_venda)
    
    // Se a data está em formato DD/MM/YYYY, converter
    if (typeof venda.data_venda === 'string' && venda.data_venda.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dia, mes, ano] = venda.data_venda.split('/')
      dataVenda = new Date(ano, mes - 1, dia)
    }
    
    if (isNaN(dataVenda.getTime())) return 'Data inválida'
    
    // Adicionar 30 dias (regra de negócio padrão)
    const dataPrevisao = new Date(dataVenda)
    dataPrevisao.setDate(dataPrevisao.getDate() + 30)
    
    // Pular fins de semana
    while (dataPrevisao.getDay() === 0 || dataPrevisao.getDay() === 6) {
      dataPrevisao.setDate(dataPrevisao.getDate() + 1)
    }
    
    // Formatar para DD/MM/YYYY
    const dia = String(dataPrevisao.getDate()).padStart(2, '0')
    const mes = String(dataPrevisao.getMonth() + 1).padStart(2, '0')
    const ano = dataPrevisao.getFullYear()
    
    return `${dia}/${mes}/${ano}`
  } catch (error) {
    console.error('Erro ao calcular previsão:', error)
    return 'Erro'
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  // Função para criar data de forma segura (evita problemas de timezone)
  const criarDataSegura = (dataString) => {
    if (!dataString) return null
    
    // Se já é um objeto Date válido
    if (dataString instanceof Date && !isNaN(dataString.getTime())) {
      return new Date(dataString.getFullYear(), dataString.getMonth(), dataString.getDate())
    }
    
    const str = String(dataString).trim()
    
    // Formato YYYY-MM-DD (mais comum vindo do banco)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [ano, mes, dia] = str.split('-').map(Number)
      return new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [dia, mes, ano] = str.split('/').map(Number)
      return new Date(ano, mes - 1, dia)
    }
    
    return null
  }
  
  const data = criarDataSegura(dateString)
  if (!data || isNaN(data.getTime())) {
    console.warn('Data inválida para formatação:', dateString)
    return '-'
  }
  
  return data.toLocaleDateString('pt-BR')
}

// Adicionar lógica de previsão
const { buscarTaxasDoSupabase } = useTaxasSupabase()
const taxas = ref([])

// Função para normalizar strings para comparação
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

// Encontrar taxa comparando modalidade
const encontrarTaxa = (venda) => {
  if (!taxas.value || taxas.value.length === 0) return null

  const vModal = normalizarParaComparacao(venda.modalidade ?? venda.modalidade_descricao ?? '')

  const taxaEncontrada = taxas.value.find(taxa => {
    const tModal = normalizarParaComparacao(taxa.modalidade ?? '')
    return tModal && (tModal === vModal)
  })

  return taxaEncontrada || null
}

// Calcular data de pagamento baseada na data_corte
const calcularDataPagamento = (dataVenda, dataCorte) => {
  if (!dataVenda || dataCorte === null || dataCorte === undefined) return null

  // Função para criar data de forma segura (evita problemas de timezone)
  const criarDataSegura = (dataString) => {
    if (!dataString) return null
    
    // Se já é um objeto Date válido
    if (dataString instanceof Date && !isNaN(dataString.getTime())) {
      return new Date(dataString.getFullYear(), dataString.getMonth(), dataString.getDate())
    }
    
    const str = String(dataString).trim()
    
    // Formato YYYY-MM-DD (mais comum vindo do banco)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [ano, mes, dia] = str.split('-').map(Number)
      return new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [dia, mes, ano] = str.split('/').map(Number)
      return new Date(ano, mes - 1, dia)
    }
    
    // Formato MM/DD/YYYY (menos comum, mas por segurança)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      try {
        const [parte1, parte2, ano] = str.split('/').map(Number)
        // Assumir DD/MM se dia <= 12, senão MM/DD
        if (parte1 <= 12 && parte2 <= 12) {
          return new Date(ano, parte2 - 1, parte1) // DD/MM
        }
      } catch (e) {
        console.warn('Erro ao interpretar data:', str)
      }
    }
    
    return null
  }

  // Converter dataVenda para objeto Date de forma segura
  let data = criarDataSegura(dataVenda)
  if (!data || isNaN(data.getTime())) {
    console.warn('Data inválida recebida:', dataVenda)
    return null
  }

  // Lógica baseada na data_corte
  if (dataCorte === 1) {
    // Se data_corte for 1, adicionar 1 dia à data de venda
    data.setDate(data.getDate() + 1)
    
    // Pular fins de semana se necessário
    while (data.getDay() === 0 || data.getDay() === 6) {
      data.setDate(data.getDate() + 1)
    }
  } else {
    // Para outros valores de data_corte, adicionar o número de dias
    data.setDate(data.getDate() + parseInt(dataCorte))
  }

  return data
}

// Função para verificar se é modalidade pré-pago
const isPrePago = (modalidade) => {
  if (!modalidade) return false
  
  const modalidadeNormalizada = normalizarParaComparacao(modalidade)
  console.log('🔍 [TabelaVendas] Verificando modalidade:', modalidade, '-> normalizada:', modalidadeNormalizada)
  
  const ehPrePago = modalidadeNormalizada.includes('prepago') || modalidadeNormalizada.includes('prepago')
  console.log('🔍 [TabelaVendas] É pré-pago?', ehPrePago)
  
  return ehPrePago
}

// Função para determinar o tipo de pré-pago (débito ou crédito)
const getTipoPrePago = (modalidade) => {
  if (!modalidade) return null
  
  const modalidadeNormalizada = normalizarParaComparacao(modalidade)
  
  if (modalidadeNormalizada.includes('debito')) {
    return 'debito'
  } else if (modalidadeNormalizada.includes('credito')) {
    return 'credito'
  }
  
  return null
}

// Função para verificar se é modalidade parcelada
const isParcelado = (modalidade) => {
  if (!modalidade) return false
  const modalidadeNormalizada = normalizarParaComparacao(modalidade)
  return modalidadeNormalizada.includes('parcelado')
}

// Cache para controlar parcelas já processadas na tabela
const parcelasProcessadasTabela = new Map()

// Função para ajustar para o próximo dia útil
const ajustarParaProximoDiaUtilTabela = (data) => {
  const dataAjustada = new Date(data)
  
  // Se for sábado (6) ou domingo (0), avançar para segunda-feira
  while (dataAjustada.getDay() === 0 || dataAjustada.getDay() === 6) {
    dataAjustada.setDate(dataAjustada.getDate() + 1)
  }
  
  return dataAjustada
}

// Função para calcular previsão de venda parcelada
const calcularPrevisaoParcelada = (venda) => {
  const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
  const numeroParcelas = venda.numero_parcelas || 1
  const nsu = venda.nsu
  const valorBruto = venda.valor_bruto || 0
  
  console.log('📅 [TabelaVendas] Calculando parcelado:', { dataVenda, numeroParcelas, nsu, valorBruto })
  
  if (!dataVenda) {
    console.warn('❌ Data de venda não encontrada para parcelado')
    return null
  }

  // Criar data de forma segura
  let dataVendaDate
  if (typeof dataVenda === 'string' && dataVenda.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [dia, mes, ano] = dataVenda.split('/')
    dataVendaDate = new Date(ano, mes - 1, dia)
  } else if (typeof dataVenda === 'string' && dataVenda.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [ano, mes, dia] = dataVenda.split('-')
    dataVendaDate = new Date(ano, mes - 1, dia)
  } else {
    dataVendaDate = new Date(dataVenda)
  }
  
  if (!dataVendaDate || isNaN(dataVendaDate.getTime())) {
    console.warn('❌ Data de venda inválida para parcelado:', dataVenda)
    return null
  }

  // Criar chave única para identificar o grupo de parcelas (NSU + data)
  const chaveGrupo = `${nsu}_${dataVenda}`
  
  // Verificar se já processamos parcelas deste grupo
  if (!parcelasProcessadasTabela.has(chaveGrupo)) {
    parcelasProcessadasTabela.set(chaveGrupo, {
      parcelas: [],
      proximaParcela: 1
    })
  }
  
  const grupoInfo = parcelasProcessadasTabela.get(chaveGrupo)
  
  // Adicionar esta venda ao grupo
  grupoInfo.parcelas.push({
    valor: valorBruto,
    venda: venda
  })
  
  // Determinar qual parcela é esta baseada na ordem de processamento
  const numeroParcela = grupoInfo.proximaParcela
  grupoInfo.proximaParcela++
  
  // Calcular data de vencimento baseada no número da parcela
  // Lógica: próximo mês + (parcela - 1) meses adicionais, sempre no dia 3
  const dataPrevisao = new Date(dataVendaDate)
  dataPrevisao.setMonth(dataPrevisao.getMonth() + numeroParcela)
  dataPrevisao.setDate(3) // Sempre no dia 3 do mês
  
  // Ajustar para dia útil se necessário (se dia 3 for fim de semana)
  const dataFinal = ajustarParaProximoDiaUtilTabela(dataPrevisao)
  
  console.log('💳 [TabelaVendas] Parcelado calculado:', {
    nsu: nsu,
    valor_bruto: valorBruto,
    parcela_numero: numeroParcela,
    meses_adicionados: numeroParcela,
    data_previsao_inicial: dataPrevisao,
    data_previsao_final: dataFinal,
    data_formatada: `${String(dataFinal.getDate()).padStart(2, '0')}/${String(dataFinal.getMonth() + 1).padStart(2, '0')}/${dataFinal.getFullYear()}`
  })
  
  return dataFinal
}

// Função principal para calcular previsão de venda
const calcularPrevisaoVenda = (venda) => {
  try {
    const modalidade = venda.modalidade ?? venda.modalidade_descricao ?? ''
    console.log('🔍 [TabelaVendas] Calculando previsão para modalidade:', modalidade)
    
    // Verificar se é modalidade parcelada
    if (isParcelado(modalidade)) {
      console.log('✅ [TabelaVendas] Modalidade parcelada detectada')
      
      const dataPrevisaoDate = calcularPrevisaoParcelada(venda)
      if (!dataPrevisaoDate) {
        console.warn('❌ Não foi possível calcular previsão para parcelado')
        return 'Erro no cálculo'
      }

      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(dataPrevisaoDate)
      
      console.log('✅ [TabelaVendas] Previsão parcelada calculada:', dataFormatada)
      return dataFormatada
    }
    
    // Verificar se é modalidade pré-pago
    if (isPrePago(modalidade)) {
      const tipoPrePago = getTipoPrePago(modalidade)
      console.log('✅ [TabelaVendas] Modalidade pré-pago detectada. Tipo:', tipoPrePago)
      
      const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
      console.log('📅 [TabelaVendas] Data da venda original:', dataVenda)
      
      // Criar data de forma segura para evitar problemas de timezone
      let dataPrevisao
      if (typeof dataVenda === 'string' && dataVenda.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // Formato DD/MM/YYYY
        const [dia, mes, ano] = dataVenda.split('/')
        dataPrevisao = new Date(ano, mes - 1, dia)
      } else if (typeof dataVenda === 'string' && dataVenda.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Formato YYYY-MM-DD
        const [ano, mes, dia] = dataVenda.split('-')
        dataPrevisao = new Date(ano, mes - 1, dia)
      } else {
        dataPrevisao = new Date(dataVenda)
      }
      
      console.log('📅 [TabelaVendas] Data de previsão inicial:', dataPrevisao)
      
      if (tipoPrePago === 'debito') {
        // Pré-pago débito: +1 dia útil
        console.log('📅 [TabelaVendas] Pré-pago débito: adicionando 1 dia útil')
        let diasUteis = 0
        while (diasUteis < 1) {
          dataPrevisao.setDate(dataPrevisao.getDate() + 1)
          // Verificar se é dia útil (segunda a sexta)
          if (dataPrevisao.getDay() >= 1 && dataPrevisao.getDay() <= 5) {
            diasUteis++
          }
        }
      } else if (tipoPrePago === 'credito') {
        // Pré-pago crédito: 2 dias úteis
        console.log('📅 [TabelaVendas] Pré-pago crédito: adicionando 2 dias úteis')
        let diasUteis = 0
        while (diasUteis < 2) {
          dataPrevisao.setDate(dataPrevisao.getDate() + 1)
          // Verificar se é dia útil (segunda a sexta)
          if (dataPrevisao.getDay() >= 1 && dataPrevisao.getDay() <= 5) {
            diasUteis++
          }
        }
      }
      
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(dataPrevisao)
      
      console.log('✅ [TabelaVendas] Previsão pré-pago calculada:', dataFormatada)
      return dataFormatada
    }
    
    // Lógica normal para outras modalidades
    const taxa = encontrarTaxa(venda)
    if (!taxa) {
      console.log('❌ [TabelaVendas] Taxa não encontrada para modalidade:', modalidade)
      return 'Taxa não cadastrada'
    }

    const dataCorte = taxa.data_corte
    const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data

    const dataPrevisaoDate = calcularDataPagamento(dataVenda, dataCorte)
    if (!dataPrevisaoDate) return 'Erro no cálculo'

    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(dataPrevisaoDate)

    return dataFormatada
  } catch (err) {
    console.error('Erro ao calcular previsão:', err)
    return 'Erro'
  }
}

// Carregar taxas ao montar o componente
const carregarTaxas = async () => {
  try {
    console.log('🔄 Carregando taxas do Supabase...')
    const taxasDoSupabase = await buscarTaxasDoSupabase()
    taxas.value = taxasDoSupabase
    console.log('✅ Taxas carregadas do Supabase:', taxas.value.length, 'registros')
  } catch (err) {
    console.error('❌ Erro ao carregar taxas do Supabase:', err)
    taxas.value = []
  }
}

// Carregar taxas quando o componente for montado
onMounted(() => {
  carregarTaxas()
})
</script>