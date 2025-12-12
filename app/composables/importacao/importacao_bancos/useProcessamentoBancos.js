import { ref } from 'vue'
import { useItau } from './useItau'
import { useBradesco } from './useBradesco'
import { useSicoob } from './useSicoob'
import { useTribanco } from './useTribanco'
import { useSicredi } from './useSicredi'
import { useCaixa } from './useCaixa'
import { useBanco_do_brasil } from './useBanco_do_brasil'

export const useProcessamentoBancos = () => {
  const processando = ref(false)
  const statusProcessamento = ref(null)

  const obterProcessadorBanco = (codigoBanco) => {
    const processadores = {
      'ITAU': useItau(),
      'BRADESCO': useBradesco(),
      'SICOOB': useSicoob(),
      'TRIBANCO': useTribanco(),
      'SICREDI': useSicredi(),
      'CAIXA': useCaixa(),
      'BANCO_DO_BRASIL': useBanco_do_brasil()
    }
    
    return processadores[codigoBanco] || null
  }

  const processarArquivo = async (arquivo, banco, formato, nomeEmpresa) => {
    if (!arquivo || !banco || !formato) {
      throw new Error('Dados insuficientes para processamento')
    }
    
    processando.value = true
    statusProcessamento.value = {
      tipo: 'processando',
      mensagem: 'Processando arquivo...',
      detalhes: `Empresa: ${nomeEmpresa} | Banco: ${banco.nome} | Formato: ${formato.tipo}`
    }

    try {
      const processador = obterProcessadorBanco(banco.codigo)
      
      if (!processador) {
        throw new Error(`Processador para ${banco.nome} ainda não implementado`)
      }

      let resultado = null

      // Processar baseado no formato
      switch (formato.tipo) {
        case 'OFX':
          resultado = await processador.processarOFX(arquivo)
          break
        case 'XLSX':
          if (processador.processarXLSX) {
            resultado = await processador.processarXLSX(arquivo)
          } else {
            throw new Error(`Formato XLSX ainda não implementado para ${banco.nome}`)
          }
          break
        case 'CSV':
          if (processador.processarCSV) {
            resultado = await processador.processarCSV(arquivo)
          } else {
            throw new Error(`Formato CSV ainda não implementado para ${banco.nome}`)
          }
          break
        case 'PDF':
          if (processador.processarPDF) {
            resultado = await processador.processarPDF(arquivo)
          } else {
            throw new Error(`Formato PDF ainda não implementado para ${banco.nome}`)
          }
          break
        default:
          throw new Error(`Formato ${formato.tipo} não reconhecido`)
      }

      if (resultado.sucesso) {
        statusProcessamento.value = {
          tipo: 'sucesso',
          mensagem: 'Arquivo processado com sucesso!',
          detalhes: `${resultado.total} transações importadas para ${nomeEmpresa}`
        }

        return {
          sucesso: true,
          transacoes: resultado.transacoes,
          total: resultado.total
        }
      } else {
        throw new Error(resultado.erro)
      }
    } catch (error) {
      statusProcessamento.value = {
        tipo: 'erro',
        mensagem: 'Erro ao processar arquivo',
        detalhes: error.message
      }
      
      throw error
    } finally {
      processando.value = false
    }
  }

  const resetarStatus = () => {
    statusProcessamento.value = null
    processando.value = false
  }

  return {
    processando,
    statusProcessamento,
    processarArquivo,
    resetarStatus
  }
}
