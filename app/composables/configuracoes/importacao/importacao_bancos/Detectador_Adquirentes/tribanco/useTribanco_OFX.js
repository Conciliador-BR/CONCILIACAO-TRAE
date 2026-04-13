import { ref } from 'vue'

export const useTribanco_OFX = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const texto = await lerArquivoTexto(arquivo)
      const transacoesProcessadas = parseOFXTribanco(texto)
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

  const lerArquivoTexto = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsText(arquivo, 'UTF-8')
    })
  }

  const parseOFXTribanco = (textoOFX) => {
    const transacoes = []
    
    try {
      // Regex para capturar blocos STMTTRN do Tribanco (sem tags de fechamento)
      const regexTransacao = /<STMTTRN>\s*([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/g
      let match
      
      while ((match = regexTransacao.exec(textoOFX)) !== null) {
        try {
          const transacao = parseTransacaoTribancoOFX(match[1], transacoes.length + 1)
          if (transacao) {
            transacoes.push(transacao)
          }
        } catch (error) {
          console.warn(`Erro ao processar transação ${transacoes.length + 1}:`, error)
        }
      }

      if (transacoes.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX do Tribanco')
      }

      return transacoes
    } catch (error) {
      throw new Error(`Erro ao processar OFX do Tribanco: ${error.message}`)
    }
  }

  const parseTransacaoTribancoOFX = (textoTransacao, indice) => {
    // Função para extrair campos do formato Tribanco (sem tags de fechamento)
    const extrairCampoTribanco = (campo) => {
      const regex = new RegExp(`<${campo}>([^<]*?)(?=\\s*<|$)`, 'i')
      const match = textoTransacao.match(regex)
      return match ? match[1].trim() : ''
    }

    const tipo = extrairCampoTribanco('TRNTYPE')
    const data = extrairCampoTribanco('DTPOSTED')
    const valor = extrairCampoTribanco('TRNAMT')
    const fitid = extrairCampoTribanco('FITID')
    const checknum = extrairCampoTribanco('CHECKNUM')
    const memo = extrairCampoTribanco('MEMO')
    
    // Formatação da data (20250801030000.000 -> 01/08/2025)
    let dataFormatada = ''
    if (data && data.length >= 8) {
      const ano = data.substring(0, 4)
      const mes = data.substring(4, 6)
      const dia = data.substring(6, 8)
      dataFormatada = `${dia}/${mes}/${ano}`
    }

    // Processamento do valor
    const valorNumerico = parseFloat(valor) || 0
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(valorNumerico))

    // Documento: usar FITID ou CHECKNUM como identificador
    const documento = fitid || checknum || `TRIBANCO-${indice}`
    
    // Descrição: usar MEMO ou criar descrição baseada no tipo
    let descricao = memo || 'Transação bancária'
    if (!memo) {
      descricao = tipo === 'CREDIT' ? 'Crédito' : 'Débito'
    }

    return {
      id: documento,
      data: dataFormatada,
      descricao: descricao,
      documento: documento,
      valor: valorFormatado,
      valorNumerico: valorNumerico,
      tipo: tipo,
      banco: 'Tribanco',
      origem: 'OFX'
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX
  }
}