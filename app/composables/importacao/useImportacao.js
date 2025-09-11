import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useImportacao = () => {
  const { supabase, insertData, error: supabaseError } = useAPIsupabase()
  
  // Estados reativos
  const importando = ref(false)
  const enviando = ref(false)
  const vendasProcessadas = ref([])
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
        'adquirente'
      ]
      const payload = vendas.map(v => {
        const out = {}
        for (const k of allowedFields) {
          if (v[k] !== undefined) out[k] = v[k]
        }
        return out
      })
      
      // Inserir dados no Supabase (tabela correta)
      const resultado = await insertData('vendas_operadora_unica', payload)
      
      // insertData retorna array (sucesso) ou null (falha)
      if (!resultado) {
        throw new Error(supabaseError?.value || 'Falha ao inserir vendas no Supabase')
      }
      
      console.log('Vendas enviadas com sucesso:', Array.isArray(resultado) ? resultado.length : payload.length)
      return { data: resultado }
      
    } catch (error) {
      console.error('Erro ao enviar vendas:', error)
      throw error
    } finally {
      enviando.value = false
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
