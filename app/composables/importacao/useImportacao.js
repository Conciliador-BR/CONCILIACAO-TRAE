import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useAPIsupabase } from '~/composables/useAPIsupabase'
import { createQueryOperations } from '~/composables/PageTaxas/SalvarTaxas/queries.js'

export const useImportacao = () => {
  const { supabase, insertData, error: supabaseError } = useAPIsupabase()
  const { buscarTaxasDoSupabase } = createQueryOperations(supabase)
  
  // Estados reativos
  const importando = ref(false)
  const enviando = ref(false)
  const vendasProcessadas = ref([])
  const taxas = ref([]) // ✅ Adicionar estado para taxas
  const progresso = ref({
    show: false,
    porcentagem: 0,
    processados: 0,
    total: 0,
    mensagem: ''
  })

  // Operadoras disponíveis
  const operadoras = [
    { id: 'cielo', nome: 'Cielo' },
    { id: 'stone', nome: 'Stone' },
    { id: 'unica', nome: 'Única' },
    { id: 'getnet', nome: 'Getnet' },
    { id: 'bin', nome: 'Bin' },
    { id: 'rede', nome: 'Rede' },
    { id: 'safra', nome: 'Safra' }
  ]

  // Função para processar arquivo (sem salvar no banco)
  const processarArquivo = async (arquivo, operadora, empresaSelecionada = 'Não informado') => {
    importando.value = true
    progresso.value = {
      show: true,
      porcentagem: 0,
      processados: 0,
      total: 0,
      mensagem: 'Iniciando processamento...'
    }

    try {
      let dadosMapeados
      
      // Para operadora Única, não processamos aqui (será feito pelo useVendasOperadoraUnica)
      if (operadora === 'unica') {
        throw new Error('Use o useVendasOperadoraUnica para processar arquivos da Única')
      } else {
        // Lógica genérica para outras operadoras
        progresso.value.mensagem = 'Lendo arquivo...'
        progresso.value.porcentagem = 10
        
        const dadosArquivo = await lerArquivo(arquivo)
        
        if (!dadosArquivo || dadosArquivo.length === 0) {
          throw new Error('Arquivo vazio ou inválido')
        }

        progresso.value.total = dadosArquivo.length
        progresso.value.porcentagem = 30
        
        progresso.value.mensagem = 'Processando dados...'
        dadosMapeados = mapearDados(dadosArquivo, operadora)
        
        if (dadosMapeados.length === 0) {
          throw new Error('Nenhum dado válido encontrado no arquivo')
        }
      }

      progresso.value.total = dadosMapeados.length
      progresso.value.porcentagem = 80
      progresso.value.mensagem = 'Finalizando processamento...'
      
      vendasProcessadas.value = dadosMapeados
      
      progresso.value.porcentagem = 100
      progresso.value.mensagem = 'Processamento concluído!'
      
      setTimeout(() => {
        progresso.value.show = false
      }, 2000)
      
      return dadosMapeados
      
    } catch (error) {
      console.error('Erro no processamento:', error)
      progresso.value.show = false
      throw error
    } finally {
      importando.value = false
    }
  }

  // Função para enviar vendas para o Supabase
  const enviarVendasParaSupabase = async (vendas) => {
    if (!vendas || vendas.length === 0) {
      throw new Error('Nenhuma venda para enviar')
    }

    enviando.value = true
    
    try {
      // ✅ Carregar taxas ANTES de processar vendas
      await carregarTaxas()
      
      console.log('Enviando vendas para Supabase:', vendas.length)

      // Enviar apenas colunas existentes na tabela vendas_operadora_unica
      const allowedFields = [
        'data_venda',
        'modalidade',
        'nsu',
        'valor_bruto',
        'valor_liquido',
        'taxa_mdr',
        'despesa_mdr',
        'numero_parcelas',
        'bandeira',
        'valor_antecipacao',
        'despesa_antecipacao',
        'valor_liquido_antecipacao',
        'empresa',
        'matriz',
        'adquirente',
        'previsao_pgto'  // ✅ Adicionar este campo
      ]
      
      const payload = vendas.map(v => {
        const out = {}
        for (const k of allowedFields) {
          if (v[k] !== undefined) out[k] = v[k]
        }
        
        // ✅ Calcular previsao_pgto usando a MESMA lógica da TabelaVendas
        if (!out.previsao_pgto && out.data_venda) {
          const previsaoCalculada = calcularPrevisaoVenda(out)
          if (previsaoCalculada) {
            out.previsao_pgto = previsaoCalculada
            console.log('✅ Previsão calculada:', {
              modalidade: out.modalidade,
              data_venda: out.data_venda,
              previsao_pgto: out.previsao_pgto
            })
          } else {
            console.warn('⚠️ Não foi possível calcular previsão para:', {
              modalidade: out.modalidade,
              data_venda: out.data_venda
            })
          }
        }
        
        return out
      })
      
      // Inserir dados no Supabase (tabela vendas_operadora_unica)
      const resultado = await insertData('vendas_operadora_unica', payload)
      
      if (!resultado) {
        throw new Error(supabaseError?.value || 'Falha ao inserir vendas no Supabase')
      }
      
      // ✅ Criar registros de previsão de pagamento usando a MESMA lógica
      await criarPrevisoesPagamento(resultado)
      
      console.log('Vendas enviadas com sucesso:', Array.isArray(resultado) ? resultado.length : payload.length)
      return { data: resultado }
      
    } catch (error) {
      console.error('Erro ao enviar vendas:', error)
      throw error
    } finally {
      enviando.value = false
    }
  }

  // ✅ Nova função para criar previsões de pagamento
  // ✅ Função para criar previsões de pagamento (usando a MESMA lógica)
  const criarPrevisoesPagamento = async (vendasInseridas) => {
    try {
      const previsoes = vendasInseridas.map(venda => {
        // ✅ Usar a MESMA função de cálculo da TabelaVendas
        const dataPrevisaoFormatada = calcularPrevisaoVenda(venda)
        
        if (!dataPrevisaoFormatada) {
          console.warn('Não foi possível calcular previsão para venda:', venda.id)
          return null
        }
        
        return {
          venda_id: venda.id,
          data_venda: venda.data_venda,
          data_previsao_pagamento: dataPrevisaoFormatada, // ✅ Mesma data da tabela
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
        console.warn('Nenhuma previsão válida para inserir')
        return
      }
      
      // Inserir previsões na tabela previsao_pgto
      const resultadoPrevisoes = await insertData('previsao_pgto', previsoes)
      
      if (!resultadoPrevisoes) {
        console.warn('Falha ao inserir previsões de pagamento')
      } else {
        console.log('✅ Previsões de pagamento criadas:', previsoes.length)
      }
      
    } catch (error) {
      console.error('Erro ao criar previsões de pagamento:', error)
      // Não falhar o processo principal se as previsões falharem
    }
  }

  // Função para ler arquivo Excel/CSV
  const lerArquivo = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // Função para mapear dados (placeholder para outras operadoras)
  const mapearDados = (dados, operadora) => {
    // Implementar mapeamento específico para cada operadora
    console.log(`Mapeamento para operadora ${operadora} ainda não implementado`)
    return []
  }

  // ✅ Função para criar data de forma segura (igual à TabelaVendas.vue)
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

  // ✅ Função para normalizar strings (igual à TabelaVendas.vue)
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

  // ✅ Função para encontrar taxa (igual à TabelaVendas.vue)
  const encontrarTaxa = (venda) => {
    if (!taxas.value || taxas.value.length === 0) return null

    const vModal = normalizarParaComparacao(venda.modalidade ?? venda.modalidade_descricao ?? '')

    const taxaEncontrada = taxas.value.find(taxa => {
      const tModal = normalizarParaComparacao(taxa.modalidade ?? '')
      return tModal && (tModal === vModal)
    })

    return taxaEncontrada || null
  }

  // ✅ Função para calcular data de pagamento (igual à TabelaVendas.vue)
  const calcularDataPagamento = (dataVenda, dataCorte) => {
    if (!dataVenda || dataCorte === null || dataCorte === undefined) return null

    // Converter dataVenda para objeto Date de forma segura
    let data = criarDataSegura(dataVenda)
    if (!data || isNaN(data.getTime())) {
      console.warn('Data inválida recebida:', dataVenda)
      return null
    }

    // Lógica baseada na data_corte (IGUAL à TabelaVendas.vue)
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

  // ✅ Função para calcular previsão de venda (igual à TabelaVendas.vue)
  const calcularPrevisaoVenda = (venda) => {
    try {
      const taxa = encontrarTaxa(venda)
      if (!taxa) {
        console.warn('Taxa não encontrada para modalidade:', venda.modalidade)
        return null // Retorna null em vez de string para não salvar no banco
      }

      const dataCorte = taxa.data_corte
      const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data

      const dataPrevisaoDate = calcularDataPagamento(dataVenda, dataCorte)
      if (!dataPrevisaoDate) return null

      // Formatar data para o banco (YYYY-MM-DD)
      const ano = dataPrevisaoDate.getFullYear()
      const mes = String(dataPrevisaoDate.getMonth() + 1).padStart(2, '0')
      const dia = String(dataPrevisaoDate.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    } catch (err) {
      console.error('Erro ao calcular previsão:', err)
      return null
    }
  }

  // ✅ Função para carregar taxas
  const carregarTaxas = async () => {
    try {
      console.log('🔄 Carregando taxas do Supabase para importação...')
      const taxasDoSupabase = await buscarTaxasDoSupabase()
      taxas.value = taxasDoSupabase
      console.log('✅ Taxas carregadas:', taxas.value.length, 'registros')
    } catch (err) {
      console.error('❌ Erro ao carregar taxas:', err)
      taxas.value = []
    }
  }
  
    return {
      // Estados
      importando,
      enviando,
      vendasProcessadas,
      progresso,
      operadoras,
      
      // Métodos
      processarArquivo,
      enviarVendasParaSupabase,
      lerArquivo
    }
  }
