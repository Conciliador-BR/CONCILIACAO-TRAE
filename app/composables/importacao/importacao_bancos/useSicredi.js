import { ref } from 'vue'

export const useSicredi = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const texto = await lerArquivoTexto(arquivo)
      const transacoesProcessadas = parseOFXSicredi(texto)
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

  const parseOFXSicredi = (textoOFX) => {
    const transacoes = []
    
    try {
      const regexTransacao = /<STMTTRN>(.*?)<\/STMTTRN>/gs
      const matches = textoOFX.match(regexTransacao)
      
      if (!matches) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX')
      }

      matches.forEach((match, index) => {
        try {
          const transacao = parseTransacaoOFX(match, index + 1)
          if (transacao) {
            transacoes.push(transacao)
          }
        } catch (error) {
          console.warn(`Erro ao processar transação ${index + 1}:`, error)
        }
      })

      return transacoes
    } catch (error) {
      throw new Error(`Erro ao processar OFX do Sicredi: ${error.message}`)
    }
  }

  const parseTransacaoOFX = (textoTransacao, indice) => {
    const extrairCampo = (campo) => {
      const regex = new RegExp(`<${campo}>(.*?)</${campo}>`, 'i')
      const match = textoTransacao.match(regex)
      return match ? match[1].trim() : ''
    }

    const data = extrairCampo('DTPOSTED')
    const valor = extrairCampo('TRNAMT')
    const descricao = extrairCampo('MEMO') || extrairCampo('NAME') || 'Sem descrição'
    const documento = extrairCampo('FITID') || extrairCampo('REFNUM') || `SICREDI-${indice}`

    let dataFormatada = ''
    if (data && data.length >= 8) {
      const ano = data.substring(0, 4)
      const mes = data.substring(4, 6)
      const dia = data.substring(6, 8)
      dataFormatada = `${dia}/${mes}/${ano}`
    }

    const valorNumerico = parseFloat(valor) || 0
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico)

    return {
      id: documento,
      data: dataFormatada,
      descricao: descricao,
      documento: documento,
      valor: valorFormatado,
      valorNumerico: valorNumerico,
      banco: 'Sicredi'
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX
  }
}