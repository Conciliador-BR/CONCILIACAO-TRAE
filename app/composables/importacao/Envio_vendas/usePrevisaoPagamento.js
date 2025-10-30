import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'
import { createQueryOperations } from '~/composables/PageTaxas/SalvarTaxas/queries.js'

export const usePrevisaoPagamento = () => {
  const { supabase, insertData } = useAPIsupabase()
  const { buscarTaxasDoSupabase } = createQueryOperations(supabase)
  
  // Estados reativos
  const taxas = ref([])

  // Função para criar data de forma segura
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

  // Função para normalizar strings
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

  // Função para encontrar taxa
  const encontrarTaxa = (venda) => {
    if (!taxas.value || taxas.value.length === 0) {
      return null
    }

    const vModal = normalizarParaComparacao(venda.modalidade ?? venda.modalidade_descricao ?? '')

    const taxaEncontrada = taxas.value.find(taxa => {
      const tModal = normalizarParaComparacao(taxa.modalidade ?? '')
      const match = tModal && (tModal === vModal)
      return match
    })

    return taxaEncontrada || null
  }

  // Função para calcular data de pagamento
  // 🧩 LÓGICA DE LOTES MENSAIS DAS OPERADORAS
  // 
  // Como funciona na prática:
  // 1. Vendas são agrupadas em LOTES MENSAIS (não por data individual)
  // 2. O lote fecha no ÚLTIMO DIA DO MÊS da venda
  // 3. O prazo (ex: 30 dias) é contado a partir do FECHAMENTO DO LOTE
  // 4. O pagamento ocorre no 1º DIA ÚTIL do mês seguinte ao vencimento
  //
  // Exemplo: Venda em 31/05/2025
  // - Lote fecha: 31/05/2025 (último dia de maio)
  // - Vencimento: 31/05 + 30 dias = 30/06/2025
  // - Pagamento: 1º dia útil de julho = 01/07/2025
  //
  const calcularDataPagamento = (dataVenda, dataCorte, venda = null) => {
    if (!dataVenda || dataCorte === null || dataCorte === undefined) {
      return null
    }

    // Converter dataVenda para objeto Date de forma segura
    let dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate || isNaN(dataVendaDate.getTime())) {
      return null
    }
    
    // 1️⃣ Determinar a data de fechamento do lote (último dia do mês da venda)
    const dataFechamentoLote = new Date(dataVendaDate.getFullYear(), dataVendaDate.getMonth() + 1, 0)
    
    // 2️⃣ Calcular data de vencimento: fechamento do lote + data_corte (geralmente 30 dias)
    const dataVencimento = new Date(dataFechamentoLote)
    dataVencimento.setDate(dataVencimento.getDate() + parseInt(dataCorte))
    
    // 3️⃣ Determinar o mês de pagamento (mês seguinte ao vencimento)
    const mesPagamento = dataVencimento.getMonth() + 1
    const anoPagamento = dataVencimento.getFullYear()
    
    // 4️⃣ Encontrar o 1º dia útil do mês de pagamento
    let dataPagamento = new Date(anoPagamento, mesPagamento, 1)
    
    // Ajustar para o primeiro dia útil do mês
    while (dataPagamento.getDay() === 0 || dataPagamento.getDay() === 6 || ehFeriado(dataPagamento)) {
      dataPagamento.setDate(dataPagamento.getDate() + 1)
    }

    // 🔍 DEBUG: Log da lógica de lotes (remover em produção)
    console.log('🧩 Lógica de Lotes:', {
      dataVenda: dataVendaDate.toISOString().split('T')[0],
      fechamentoLote: dataFechamentoLote.toISOString().split('T')[0],
      dataCorte: dataCorte,
      dataVencimento: dataVencimento.toISOString().split('T')[0],
      dataPagamento: dataPagamento.toISOString().split('T')[0]
    })

    return dataPagamento
  }

  // Função para verificar se é modalidade pré-pago
  const isPrePago = (modalidade) => {
    if (!modalidade) return false
    
    // Normalizar: remover acentos, espaços e caracteres especiais
    const modalidadeNormalizada = modalidade
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z]/g, '') // Remove espaços e caracteres especiais
    
    // Deve conter "prepago" para ser considerado pré-pago
    const ehPrePago = modalidadeNormalizada.includes('prepago')
    
    return ehPrePago
  }

  // Função para determinar tipo de pré-pago
  const getTipoPrePago = (modalidade) => {
    if (!modalidade) return null
    const modalidadeNormalizada = modalidade.toLowerCase().replace(/[^a-z]/g, '')
    
    if (modalidadeNormalizada.includes('debito') || modalidadeNormalizada.includes('débito')) {
      return 'debito'
    }
    if (modalidadeNormalizada.includes('credito') || modalidadeNormalizada.includes('crédito')) {
      return 'credito'
    }
    return null
  }

  // Função para verificar se é modalidade parcelada
  const isParcelado = (modalidade) => {
    if (!modalidade) return false
    const modalidadeNormalizada = modalidade.toLowerCase().replace(/[^a-z]/g, '')
    return modalidadeNormalizada.includes('parcelado')
  }

  // Cache para controlar parcelas já processadas
  const parcelasProcessadas = new Map()

  // Função para limpar cache de parcelas processadas
  const limparCacheParcelas = () => {
    parcelasProcessadas.clear()
    console.log('🧹 Cache de parcelas processadas limpo')
  }

  // Lista de feriados nacionais brasileiros (formato: MM-DD)
  const feriadosNacionais = [
      '01-01', // Confraternização Universal
      '04-21', // Tiradentes
      '05-01', // Dia do Trabalhador
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
    while (dataAjustada.getDay() === 0 || dataAjustada.getDay() === 6 || ehFeriado(dataAjustada)) {
      dataAjustada.setDate(dataAjustada.getDate() + 1)
    }
    return dataAjustada
  }

  // Helpers de mês (EDATE)
  const isFimDeMes = (data) => {
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate()
    return data.getDate() === ultimoDia
  }

  const adicionarMeses = (data, meses) => {
    const ano = data.getFullYear()
    const mes = data.getMonth()
    const dia = data.getDate()

    const destinoMes = mes + meses
    const destinoAno = ano + Math.floor(destinoMes / 12)
    const mesNormalizado = ((destinoMes % 12) + 12) % 12

    const ultimoDiaDestino = new Date(destinoAno, mesNormalizado + 1, 0).getDate()
    const diaDestino = isFimDeMes(data) ? ultimoDiaDestino : Math.min(dia, ultimoDiaDestino)

    return new Date(destinoAno, mesNormalizado, diaDestino)
  }
  
  // 🧩 FUNÇÃO DE TESTE SIMPLES PARA VALIDAR A LÓGICA REAL
  const testarLogicaReal = (dataVenda, numeroParcelas = 3) => {
    console.log('🧪 TESTANDO LÓGICA REAL DAS OPERADORAS')
    console.log('=' .repeat(60))
    
    const dataVendaDate = new Date(dataVenda)
    console.log(`📅 Venda: ${dataVendaDate.toLocaleDateString('pt-BR')} (${numeroParcelas}x)`)
    console.log('')
    
    for (let parcela = 1; parcela <= numeroParcelas; parcela++) {
      // Nominal por mês (EDATE)
      const nominal = adicionarMeses(dataVendaDate, parcela)
    
      // Ajuste para dia útil
      let dataPagamento = ajustarParaProximoDiaUtil(nominal)
    
      // Regra de ciclo: se >28, considerar 1º dia útil do mês seguinte
      if (dataPagamento.getDate() > 28) {
        const primeiroDiaProximoMes = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 1, 1)
        const primeiroDiaUtilProximoMes = ajustarParaProximoDiaUtil(primeiroDiaProximoMes)
        if (primeiroDiaUtilProximoMes <= dataPagamento) {
          dataPagamento = primeiroDiaUtilProximoMes
        }
      }
    
      console.log(`${parcela}ª Parcela: nominal=${nominal.toLocaleDateString('pt-BR')} | pagamento=${dataPagamento.toLocaleDateString('pt-BR')}`)
    }
    
    console.log('=' .repeat(60))
  }

  // Função de teste para casos específicos
  const testarLogicaLotes = () => {
    console.log('🎯 TESTANDO CASOS REAIS:')
    console.log('')
    
    // Caso 1: 01/04/2025
    console.log('📦 CASO 1: Venda 01/04/2025')
    console.log('Esperado: 02/05, 02/06, 01/07')
    testarLogicaReal('2025-04-01', 3)
    console.log('')
    
    // Caso 2: 02/04/2025  
    console.log('📦 CASO 2: Venda 02/04/2025')
    console.log('Esperado: 02/05, 02/06, 01/07')
    testarLogicaReal('2025-04-02', 3)
  }

  /**
   * 📦 CALCULA PREVISÃO PARA VENDAS PARCELADAS - LÓGICA REAL DAS OPERADORAS
   * 
   * Lógica implementada (baseada no comportamento real):
   * 1. Primeira parcela: data da venda + 30 dias → ajustada para próximo dia útil
   * 2. Parcelas seguintes: parcela anterior + 30 dias → ajustada para dia útil
   * 3. Considera feriados e fechamentos de ciclo mensal
   * 
   * Exemplo: Venda 01/04/2025 (3x)
   * - 1ª: 01/04 + 30 = 01/05 (feriado) → 02/05/2025
   * - 2ª: 02/05 + 30 = 02/06/2025
   * - 3ª: 02/06 + 30 = 02/07 → 01/07/2025 (ciclo mensal)
   */
  const calcularPrevisaoParcelada = (venda) => {
    const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
    const nsu = venda.nsu
    const valorBruto = venda.valor_bruto || 0
  
    if (!dataVenda) return null
    const dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate) return null
  
    // Criar chave única para identificar o grupo de parcelas (NSU + data)
    const chaveGrupo = `${nsu}_${dataVenda}`
  
    // Verificar se já processamos parcelas deste grupo
    if (!parcelasProcessadas.has(chaveGrupo)) {
      parcelasProcessadas.set(chaveGrupo, {
        parcelas: [],
        proximaParcela: 0
      })
    }
    
    const grupoInfo = parcelasProcessadas.get(chaveGrupo)
  
    grupoInfo.parcelas.push({
      valor: valorBruto,
      venda: venda
    })
    
    // Determinar qual parcela é esta baseada na ordem de processamento
    const numeroParcela = grupoInfo.proximaParcela
    grupoInfo.proximaParcela++
  
    // Lógica com incremento mensal (EDATE) — uma parcela por mês a partir da venda
    const nominal = adicionarMeses(dataVendaDate, numeroParcela + 1)
  
    // Ajuste para dia útil
    let dataPagamento = ajustarParaProximoDiaUtil(nominal)
  
    // Regra de ciclo mensal: se cair depois do dia 28, preferir 1º dia útil do próximo mês
    if (dataPagamento.getDate() > 28) {
      const primeiroDiaProximoMes = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 1, 1)
      const primeiroDiaUtilProximoMes = ajustarParaProximoDiaUtil(primeiroDiaProximoMes)
      if (primeiroDiaUtilProximoMes <= dataPagamento) {
        dataPagamento = primeiroDiaUtilProximoMes
      }
    }
  
    // Debug
    console.log('🧩 Lógica Real PARCELADA:', {
      dataVenda: dataVendaDate.toISOString().split('T')[0],
      numeroParcela: numeroParcela + 1,
      nominal: nominal.toISOString().split('T')[0],
      dataPagamento: dataPagamento.toISOString().split('T')[0]
    })
  
    return dataPagamento
  }

  // Função para calcular previsão de venda
  const calcularPrevisaoVenda = (venda) => {
    try {
      // Verificar detecção de pré-pago
      const ehPrePago = isPrePago(venda.modalidade)
      const ehParcelado = isParcelado(venda.modalidade)

      // ✅ REGRA ESPECIAL: Vendas parceladas
      if (ehParcelado) {
        const dataPrevisaoDate = calcularPrevisaoParcelada(venda)
        if (!dataPrevisaoDate) {
          return null
        }

        // Formatar data para o banco (YYYY-MM-DD)
        const ano = dataPrevisaoDate.getFullYear()
        const mes = String(dataPrevisaoDate.getMonth() + 1).padStart(2, '0')
        const dia = String(dataPrevisaoDate.getDate()).padStart(2, '0')
        const dataFormatada = `${ano}-${mes}-${dia}`
        
        return dataFormatada
      }

      // ✅ REGRA ESPECIAL: Pré-pago débito e crédito
      if (ehPrePago) {
        const tipoPrePago = getTipoPrePago(venda.modalidade)
        const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
        
        if (!dataVenda) {
          return null
        }

        // Converter data de venda para formato de previsão
        const dataVendaDate = criarDataSegura(dataVenda)
        if (!dataVendaDate) {
          return null
        }

        let dataPrevisao
        
        if (tipoPrePago === 'debito') {
          // 1- pré-pago débito = débito (+1 dia útil)
          dataPrevisao = new Date(dataVendaDate)
          
          // Adicionar 1 dia útil
          let diasAdicionados = 0
          while (diasAdicionados < 1) {
            dataPrevisao.setDate(dataPrevisao.getDate() + 1)
            
            // Verificar se é dia útil (segunda a sexta: 1-5)
            const diaSemana = dataPrevisao.getDay()
            if (diaSemana >= 1 && diaSemana <= 5) {
              diasAdicionados++
            }
          }
        } else if (tipoPrePago === 'credito') {
          // 2- pré-pago crédito = crédito (2 dias úteis)
          dataPrevisao = new Date(dataVendaDate)
          
          // Adicionar 2 dias úteis
          let diasAdicionados = 0
          while (diasAdicionados < 2) {
            dataPrevisao.setDate(dataPrevisao.getDate() + 1)
            
            // Verificar se é dia útil (segunda a sexta: 1-5)
            const diaSemana = dataPrevisao.getDay()
            if (diaSemana >= 1 && diaSemana <= 5) {
              diasAdicionados++
            }
          }
        } else {
          // Pré-pago genérico (mesmo dia)
          dataPrevisao = new Date(dataVendaDate)
        }

        // Formatar data para o banco (YYYY-MM-DD)
        const ano = dataPrevisao.getFullYear()
        const mes = String(dataPrevisao.getMonth() + 1).padStart(2, '0')
        const dia = String(dataPrevisao.getDate()).padStart(2, '0')
        const dataFormatada = `${ano}-${mes}-${dia}`
        
        return dataFormatada
      }

      // ✅ LÓGICA NORMAL: Para outras modalidades
      const taxa = encontrarTaxa(venda)
      if (!taxa) {
        return null // Retorna null em vez de string para não salvar no banco
      }

      const dataCorte = taxa.data_corte
      const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data

      const dataPrevisaoDate = calcularDataPagamento(dataVenda, dataCorte, venda)
      if (!dataPrevisaoDate) {
        return null
      }

      // Formatar data para o banco (YYYY-MM-DD)
      const ano = dataPrevisaoDate.getFullYear()
      const mes = String(dataPrevisaoDate.getMonth() + 1).padStart(2, '0')
      const dia = String(dataPrevisaoDate.getDate()).padStart(2, '0')
      const dataFormatada = `${ano}-${mes}-${dia}`
      
      return dataFormatada
    } catch (err) {
      return null
    }
  }

  // Função para carregar taxas
  const carregarTaxas = async () => {
    try {
      const taxasDoSupabase = await buscarTaxasDoSupabase()
      taxas.value = taxasDoSupabase
    } catch (err) {
      taxas.value = []
    }
  }

  // Função para criar previsões de pagamento
  const criarPrevisoesPagamento = async (vendasInseridas) => {
    try {
      const previsoes = vendasInseridas.map(venda => {
        // Usar a função de cálculo de previsão
        const dataPrevisaoFormatada = calcularPrevisaoVenda(venda)
        
        if (!dataPrevisaoFormatada) {
          return null
        }
        
        return {
          venda_id: venda.id,
          data_venda: venda.data_venda,
          data_previsao_pagamento: dataPrevisaoFormatada,
          valor_bruto: venda.valor_bruto,
          valor_liquido: venda.valor_liquido,
          empresa: venda.empresa,
          adquirente: venda.adquirente,
          bandeira: venda.bandeira,
          modalidade: venda.modalidade,
          nsu: venda.nsu,
          status_pagamento: 'pendente',
          created_at: new Date().toISOString()
        }
      }).filter(Boolean) // Remove itens null
      
      if (previsoes.length === 0) {
        return
      }
      
      // Inserir previsões na tabela previsao_pgto
      const resultadoPrevisoes = await insertData('previsao_pgto', previsoes)
      
    } catch (error) {
      // Não falhar o processo principal se as previsões falharem
    }
  }

  return {
    // Estados
    taxas,
    
    // Métodos
    calcularPrevisaoVenda,
    criarPrevisoesPagamento,
    carregarTaxas,
    calcularDataPagamento,
    encontrarTaxa,
    limparCacheParcelas,
    
    // Métodos auxiliares para pré-pago
    isPrePago,
    getTipoPrePago,
    
    // Função de teste para validar lógica de lotes
    testarLogicaLotes
  }
}