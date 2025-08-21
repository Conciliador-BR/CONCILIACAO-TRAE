import * as XLSX from 'xlsx'

export const useVendasOperadoraUnica = () => {
  const processarArquivoComPython = async (arquivo, operadora) => {
    try {
      console.log('Processando arquivo:', arquivo.name)
      
      // Ler arquivo Excel/CSV
      const dados = await lerArquivo(arquivo)
      
      if (operadora === 'unica') {
        const resultado = processarVendasUnica(dados)
        return {
          sucesso: true,
          registros: resultado.dados || [],
          total: resultado.total || 0,
          erros: resultado.erros || []
        }
      }
      
      throw new Error(`Operadora ${operadora} não suportada`)
      
    } catch (error) {
      console.error('Erro no processamento:', error)
      return {
        sucesso: false,
        erro: error.message,
        registros: []
      }
    }
  }
  
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
  
  const processarVendasUnica = (dados) => {
    try {
      console.log('=== INICIANDO ANÁLISE DO ARQUIVO ===')
      console.log('Total de linhas:', dados.length)
      
      // Mostrar as primeiras 10 linhas para debug
      for (let i = 0; i < Math.min(10, dados.length); i++) {
        console.log(`Linha ${i + 1}:`, dados[i])
      }
      
      // Verificar linha 8 especificamente
      if (dados.length < 8) {
        throw new Error('Arquivo não possui linha 8 para cabeçalhos')
      }
      
      const headers = dados[7] || []
      console.log('=== CABEÇALHOS NA LINHA 8 ===')
      console.log('Headers encontrados:', headers)
      
      // Índices fixos baseados na estrutura da planilha
      const indices = {
        data_venda: 0,        // Coluna A - Data Venda
        modalidade: 3,        // Coluna D - Modalidade
        nsu: 4,              // Coluna E - NSU
        numero_parcelas: 5,   // Coluna F - Número Parcelas
        bandeira: 7,         // Coluna H - Bandeira
        valor_bruto: 8,      // Coluna I - Valor da Venda
        taxa_mdr: 9,         // Coluna J - Valor da Taxa
        despesa_mdr: 10,     // Coluna K - Valor do Desconto
        valor_liquido: 11,   // Coluna L - Valor a Receber
        valor_antecipacao: 12 // Coluna M - Valor Antecipado
      }
      
      console.log('=== MAPEAMENTO FIXO ===')
      console.log('Índices utilizados:', indices)
      
      const dadosProcessados = []
      const erros = []
      
      // Processar dados a partir da linha 9 (índice 8)
      for (let i = 8; i < dados.length; i++) {
        const linha = dados[i]
        if (!linha || linha.length === 0 || linha.every(cell => !cell && cell !== 0)) {
          continue
        }
        
        console.log(`\n=== PROCESSANDO LINHA ${i + 1} ===`)
        console.log('Dados da linha:', linha)
        
        try {
          const registro = {}
          
          // Extrair dados usando os índices fixos
          for (const [campo, indice] of Object.entries(indices)) {
            if (linha[indice] !== undefined && linha[indice] !== null && linha[indice] !== '') {
              let valor = linha[indice]
              console.log(`${campo} (índice ${indice}): '${valor}'`)
              
              // Formatação específica por campo
              if (campo === 'data_venda') {
                registro[campo] = formatarData(valor)
              } else if (['valor_bruto', 'valor_liquido', 'taxa_mdr', 'despesa_mdr', 'valor_antecipacao'].includes(campo)) {
                registro[campo] = formatarValor(valor)
              } else if (campo === 'numero_parcelas') {
                registro[campo] = formatarInteiro(valor)
              } else {
                registro[campo] = valor ? valor.toString().trim() : ''
              }
              
              console.log(`  -> Formatado: ${registro[campo]}`)
            } else {
              // Valor padrão
              if (['valor_bruto', 'valor_liquido', 'taxa_mdr', 'despesa_mdr', 'valor_antecipacao'].includes(campo)) {
                registro[campo] = 0.0
              } else if (campo === 'numero_parcelas') {
                registro[campo] = 0
              } else {
                registro[campo] = ''
              }
            }
          }
          
          // Calcular campos derivados
          registro.despesa_antecipacao = registro.valor_antecipacao > 0 ? 
            (registro.valor_bruto - registro.valor_antecipacao) : 0.0
          
          registro.valor_liquido_antecipacao = registro.valor_antecipacao > 0 ? 
            (registro.valor_antecipacao - registro.despesa_antecipacao) : 0.0
          
          // Adicionar campos obrigatórios
          registro.operadora = 'unica'
          registro.created_at = new Date().toISOString()
          
          // Verificar se o registro tem dados válidos
          // Linha 144 - Modificar a validação
          const temDadosValidos = registro.valor_bruto > 0 || registro.valor_liquido > 0 || registro.nsu || (i === 7) // Força linha 9
          
          if (temDadosValidos) {
            dadosProcessados.push(registro)
            console.log('✅ Registro adicionado:', registro)
          } else {
            console.log('⚠️ Registro ignorado (sem dados válidos)')
          }
          
        } catch (error) {
          console.error(`Erro ao processar linha ${i + 1}:`, error)
          erros.push(`Linha ${i + 1}: ${error.message}`)
        }
      }
      
      console.log('=== RESULTADO FINAL ===')
      console.log(`Total de registros processados: ${dadosProcessados.length}`)
      console.log(`Total de erros: ${erros.length}`)
      
      return {
        dados: dadosProcessados,
        total: dadosProcessados.length,
        erros: erros
      }
      
    } catch (error) {
      console.error('Erro no processamento:', error)
      return {
        dados: [],
        total: 0,
        erros: [error.message]
      }
    }
  }
  
  const formatarData = (valor) => {
    if (!valor) return null
    
    try {
      if (typeof valor === 'string') {
        // Tentar diferentes formatos
        const formatos = [
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/mm/yyyy
          /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-mm-dd
          /^(\d{1,2})-(\d{1,2})-(\d{4})$/ // dd-mm-yyyy
        ]
        
        for (const formato of formatos) {
          const match = valor.match(formato)
          if (match) {
            if (formato === formatos[0] || formato === formatos[2]) {
              // dd/mm/yyyy ou dd-mm-yyyy
              const [, dia, mes, ano] = match
              return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
            } else {
              // yyyy-mm-dd
              return valor
            }
          }
        }
      } else if (valor instanceof Date) {
        return valor.toISOString().split('T')[0]
      }
      
      return valor.toString()
    } catch {
      return valor ? valor.toString() : null
    }
  }
  
  const formatarValor = (valor) => {
    if (!valor && valor !== 0) return 0.0
    
    try {
      if (typeof valor === 'string') {
        const valorLimpo = valor.replace(/[R$\s]/g, '').replace(',', '.')
        return parseFloat(valorLimpo) || 0.0
      }
      return parseFloat(valor) || 0.0
    } catch {
      return 0.0
    }
  }
  
  const formatarInteiro = (valor) => {
    if (!valor && valor !== 0) return 0
    
    try {
      return parseInt(valor) || 0
    } catch {
      return 0
    }
  }
  
  return {
    processarArquivoComPython
  }
}