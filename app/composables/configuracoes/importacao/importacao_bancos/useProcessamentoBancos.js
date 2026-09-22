import { ref } from 'vue'

export const useProcessamentoBancos = () => {
  const processando = ref(false)
  const statusProcessamento = ref(null)
  const processadoresCache = new Map()

  const processadoresLoaders = {
    ITAU: async () => (await import('./useItau')).useItau,
    BRADESCO: async () => (await import('./useBradesco')).useBradesco,
    SICOOB: async () => (await import('./useSicoob')).useSicoob,
    TRIBANCO: async () => (await import('./useTribanco')).useTribanco,
    SICREDI: async () => (await import('./useSicredi')).useSicredi,
    CAIXA: async () => (await import('./useCaixa')).useCaixa,
    BANCO_DO_BRASIL: async () => (await import('./useBanco_do_brasil')).useBanco_do_brasil,
    SAFRA: async () => (await import('./useSafra')).useSafra,
    BANCO_DO_NORDESTE: async () => (await import('./useBanco_do_nordeste')).useBanco_do_nordeste,
    BANESTES: async () => (await import('./useBanestes')).useBanestes,
    SANTANDER: async () => (await import('./useSantander')).useSantander,
    STONE: async () => (await import('./useStone')).useStone,
    BANRISUL: async () => (await import('./useBanrisul')).useBanrisul
  }

  const obterProcessadorBanco = async (codigoBanco) => {
    const loader = processadoresLoaders[codigoBanco]

    if (!loader) {
      return null
    }
    
    if (!processadoresCache.has(codigoBanco)) {
      const factory = await loader()
      processadoresCache.set(codigoBanco, factory())
    }

    return processadoresCache.get(codigoBanco)
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
      const processador = await obterProcessadorBanco(banco.codigo)
      
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
        case 'TXT':
          if (processador.processarTXT) {
            resultado = await processador.processarTXT(arquivo)
          } else {
            throw new Error(`Formato TXT ainda não implementado para ${banco.nome}`)
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
