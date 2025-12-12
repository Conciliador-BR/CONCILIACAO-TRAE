import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useTribanco_xlsx = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  const processarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const dados = await lerArquivoExcel(arquivo)
      const transacoesProcessadas = parseXLSXTribanco(dados)
      transacoes.value = transacoesProcessadas
      
      return {
        sucesso: true,
        transacoes: transacoesProcessadas,
        total: transacoesProcessadas.length
      }
    } catch (error) {
      erro.value = error.message
      return {
        sucesso: false,
        erro: error.message
      }
    } finally {
      processando.value = false
    }
  }

  const lerArquivoExcel = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Pegar a primeira planilha
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Converter para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false
          })
          
          resolve(jsonData)
        } catch (error) {
          reject(new Error('Erro ao processar arquivo Excel: ' + error.message))
        }
      }
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsArrayBuffer(arquivo)
    })
  }

  const parseXLSXTribanco = (dados) => {
    const transacoes = []
    
    try {
      // Verificar se há dados
      if (!dados || dados.length < 2) {
        throw new Error('Arquivo Excel vazio ou sem dados válidos')
      }

      // Identificar o cabeçalho (primeira linha com dados)
      let indiceCabecalho = -1
      let colunas = {}
      
      for (let i = 0; i < dados.length; i++) {
        const linha = dados[i]
        if (linha && linha.length > 0) {
          // Procurar por colunas conhecidas do Tribanco
          const linhaNormalizada = linha.map(col => 
            typeof col === 'string' ? col.toUpperCase().trim() : ''
          )
          
          if (linhaNormalizada.includes('DATA') || 
              linhaNormalizada.includes('DESCRIÇÃO') || 
              linhaNormalizada.includes('VALOR')) {
            indiceCabecalho = i
            
            // Mapear as colunas
            linhaNormalizada.forEach((col, index) => {
              if (col.includes('DATA')) colunas.data = index
              if (col.includes('DESCRIÇÃO') || col.includes('DESCRICAO')) colunas.descricao = index
              if (col.includes('DOCUMENTO')) colunas.documento = index
              if (col.includes('VALOR')) colunas.valor = index
              if (col.includes('SALDO')) colunas.saldo = index
            })
            break
          }
        }
      }

      if (indiceCabecalho === -1) {
        throw new Error('Cabeçalho não encontrado no arquivo Excel')
      }

      // Processar as linhas de dados
      for (let i = indiceCabecalho + 1; i < dados.length; i++) {
        const linha = dados[i]
        
        if (!linha || linha.length === 0) continue
        
        try {
          const transacao = parseLinhaExcelTribanco(linha, colunas, i + 1)
          if (transacao) {
            transacoes.push(transacao)
          }
        } catch (error) {
          console.warn(`Erro ao processar linha ${i + 1}:`, error)
        }
      }

      if (transacoes.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo Excel')
      }

      return transacoes
    } catch (error) {
      throw new Error(`Erro ao processar Excel do Tribanco: ${error.message}`)
    }
  }

  const parseLinhaExcelTribanco = (linha, colunas, numeroLinha) => {
    // Extrair dados das colunas
    const data = linha[colunas.data] || ''
    const descricao = linha[colunas.descricao] || ''
    const documento = linha[colunas.documento] || `TRIBANCO-XLSX-${numeroLinha}`
    const valor = linha[colunas.valor] || '0'

    // Pular linhas vazias ou inválidas
    if (!data && !descricao && !valor) {
      return null
    }

    // Formatação da data
    let dataFormatada = ''
    if (data) {
      try {
        // Tentar diferentes formatos de data
        let dataObj = null
        
        if (typeof data === 'string') {
          // Formato DD/MM/YYYY
          if (data.includes('/')) {
            const partes = data.split('/')
            if (partes.length === 3) {
              dataObj = new Date(partes[2], partes[1] - 1, partes[0])
            }
          }
          // Formato YYYY-MM-DD
          else if (data.includes('-')) {
            dataObj = new Date(data)
          }
        } else if (typeof data === 'number') {
          // Data do Excel (número serial)
          dataObj = XLSX.SSF.parse_date_code(data)
          if (dataObj) {
            dataObj = new Date(dataObj.y, dataObj.m - 1, dataObj.d)
          }
        }

        if (dataObj && !isNaN(dataObj.getTime())) {
          const dia = String(dataObj.getDate()).padStart(2, '0')
          const mes = String(dataObj.getMonth() + 1).padStart(2, '0')
          const ano = dataObj.getFullYear()
          dataFormatada = `${dia}/${mes}/${ano}`
        } else {
          dataFormatada = String(data)
        }
      } catch (error) {
        dataFormatada = String(data)
      }
    }

    // Processamento do valor
    let valorNumerico = 0
    if (valor) {
      try {
        // Remover caracteres não numéricos exceto vírgula, ponto e sinal negativo
        let valorLimpo = String(valor).replace(/[^\d,.-]/g, '')
        
        // Converter vírgula para ponto se necessário
        if (valorLimpo.includes(',') && !valorLimpo.includes('.')) {
          valorLimpo = valorLimpo.replace(',', '.')
        } else if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
          // Se tem ambos, assumir que vírgula é separador de milhares
          valorLimpo = valorLimpo.replace(',', '')
        }
        
        valorNumerico = parseFloat(valorLimpo) || 0
      } catch (error) {
        valorNumerico = 0
      }
    }

    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(valorNumerico))

    return {
      id: documento,
      data: dataFormatada,
      descricao: String(descricao).trim(),
      documento: String(documento),
      valor: valorFormatado,
      valorNumerico: valorNumerico,
      banco: 'Tribanco',
      origem: 'XLSX'
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarXLSX
  }
}