import { ref, readonly } from 'vue'
import { useBradescoPdf } from './Detectador_Adquirentes/Bradesco/useBradescoPdf'
import { useBradescoXlsx } from './Detectador_Adquirentes/Bradesco/useBradescoXlsx'

export const useBradesco = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])
  const { processarPDF } = useBradescoPdf()
  const { processarXLSX } = useBradescoXlsx()

  // Função para detectar se é formato Bradesco (sem tags de fechamento)
  const isBradescoFormat = (conteudo) => {
    // Verifica se há transações sem tags de fechamento
    const hasStmtTrn = conteudo.includes('<STMTTRN>')
    const hasClosingTags = conteudo.includes('</STMTTRN>')
    const hasCheckNum = conteudo.includes('<CHECKNUM>')
    
    // Se tem STMTTRN mas não tem tags de fechamento, é formato Bradesco
    return hasStmtTrn && !hasClosingTags && hasCheckNum
  }

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const conteudo = await lerArquivoTexto(arquivo)
      
      // Detecta automaticamente o formato
      let transacoesParseadas
      if (isBradescoFormat(conteudo)) {
        console.log('Detectado formato Bradesco OFX (sem tags de fechamento)')
        transacoesParseadas = parseOFXBradesco(conteudo)
      } else {
        console.log('Usando parser OFX padrão')
        // Fallback para o parser padrão se não for formato Bradesco
        transacoesParseadas = parseOFXPadrao(conteudo)
      }
      
      transacoes.value = transacoesParseadas
      
      return {
        sucesso: true,
        transacoes: transacoesParseadas,
        total: transacoesParseadas.length
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

  const parseOFXBradesco = (textoOFX) => {
    const transacoes = []
    
    try {
      // Regex específica para o formato Bradesco (sem tags de fechamento)
      // Captura desde <STMTTRN> até o próximo <STMTTRN> ou fim da lista
      const regexTransacao = /<STMTTRN>\s*([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/g
      let match
      
      while ((match = regexTransacao.exec(textoOFX)) !== null) {
        try {
          const transacao = parseTransacaoBradescoOFX(match[1], transacoes.length + 1)
          if (transacao) {
            transacoes.push(transacao)
          }
        } catch (error) {
          console.warn(`Erro ao processar transação ${transacoes.length + 1}:`, error)
        }
      }

      if (transacoes.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX do Bradesco')
      }

      return transacoes
    } catch (error) {
      throw new Error(`Erro ao processar OFX do Bradesco: ${error.message}`)
    }
  }

  const parseTransacaoBradescoOFX = (textoTransacao, indice) => {
    // Função para extrair campos do formato Bradesco (sem tags de fechamento)
    const extrairCampo = (campo) => {
      // Regex melhorada para capturar corretamente campos no formato Bradesco
      const regex = new RegExp(`<${campo}>([^<]*?)(?=\\s*<|$)`, 'i')
      const match = textoTransacao.match(regex)
      return match ? match[1].trim() : ''
    }

    const trnType = extrairCampo('TRNTYPE')
    const data = extrairCampo('DTPOSTED')
    const valor = extrairCampo('TRNAMT')
    const fitId = extrairCampo('FITID')
    const checkNum = extrairCampo('CHECKNUM')
    const memo = extrairCampo('MEMO')

    // Validação básica
    if (!data || !valor) {
      console.warn('Transação sem data ou valor:', textoTransacao)
      return null
    }

    // Formatação da data (YYYYMMDDHHMMSS -> DD/MM/YYYY)
    let dataFormatada = ''
    if (data && data.length >= 8) {
      const ano = data.substring(0, 4)
      const mes = data.substring(4, 6)
      const dia = data.substring(6, 8)
      dataFormatada = `${dia}/${mes}/${ano}`
    } else {
      dataFormatada = data // Fallback para o formato original
    }

    // Conversão do valor (formato brasileiro com vírgula)
    let valorNumerico = 0
    if (valor) {
      // Substitui vírgula por ponto para conversão
      const valorLimpo = valor.replace(',', '.')
      valorNumerico = parseFloat(valorLimpo) || 0
    }

    // Formatação do valor para exibição
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico)

    // Determinar tipo de transação
    let tipoTransacao = trnType === 'CREDIT' ? 'Crédito' : 'Débito'
    
    // Verificação adicional pelo valor (alguns OFX não têm TRNTYPE correto)
    if (!trnType && valorNumerico) {
      tipoTransacao = valorNumerico > 0 ? 'Crédito' : 'Débito'
    }

    // Formatação da descrição
    const descricaoFormatada = memo ? memo.trim() : 'Transação Bradesco'

    return {
      id: fitId || `BRADESCO-${indice}`,
      data: dataFormatada,
      descricao: descricaoFormatada,
      documento: checkNum || fitId || `BRADESCO-${indice}`,
      valor: valorFormatado,
      valorNumerico: valorNumerico,
      tipo: tipoTransacao,
      banco: 'Bradesco',
      origem: 'OFX'
    }
  }

  // Parser OFX padrão (com tags de fechamento) como fallback
  const parseOFXPadrao = (conteudo) => {
    const regexTransacao = /<STMTTRN>(.*?)<\/STMTTRN>/gs
    const matches = [...conteudo.matchAll(regexTransacao)]
    
    return matches.map(match => {
      const transacaoTexto = match[1]
      return parseTransacaoPadraoOFX(transacaoTexto)
    }).filter(transacao => transacao !== null)
  }

  const parseTransacaoPadraoOFX = (transacaoTexto) => {
    try {
      const extrairCampo = (campo) => {
        const regex = new RegExp(`<${campo}>([^<]+)`, 'i')
        const match = transacaoTexto.match(regex)
        return match ? match[1].trim() : ''
      }

      const trnType = extrairCampo('TRNTYPE')
      const dtPosted = extrairCampo('DTPOSTED')
      const trnAmt = extrairCampo('TRNAMT')
      const fitId = extrairCampo('FITID')
      const checkNum = extrairCampo('CHECKNUM')
      const memo = extrairCampo('MEMO')

      if (!dtPosted || !trnAmt) {
        return null
      }

      // Formatar data (YYYYMMDD para DD/MM/YYYY)
      const dataFormatada = dtPosted.length >= 8 
        ? `${dtPosted.substring(6, 8)}/${dtPosted.substring(4, 6)}/${dtPosted.substring(0, 4)}`
        : dtPosted

      // Converter valor (vírgula para ponto se necessário)
      const valorNumerico = parseFloat(trnAmt.replace(',', '.')) || 0

      // Formatação do valor para exibição
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorNumerico)

      return {
        id: fitId || checkNum || `OFX-${Date.now()}`,
        data: dataFormatada,
        descricao: memo || 'Transação bancária',
        documento: checkNum || fitId || '',
        valor: valorFormatado,
        valorNumerico: valorNumerico,
        tipo: trnType === 'CREDIT' ? 'Crédito' : 'Débito',
        banco: 'Bradesco',
        origem: 'OFX'
      }
    } catch (error) {
      console.error('Erro ao processar transação padrão:', error)
      return null
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX,
    isBradescoFormat,
    processarPDF,
    processarXLSX
  }
}
