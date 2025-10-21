// Composable principal que mantém compatibilidade com a versão anterior
// mas utiliza os novos composables componentizados

import { useValidacaoTabelas } from './useValidacaoTabelas.js'
import { useFormatacaoDados } from './useFormatacaoDados.js'
import { useMapeamentoDados } from './useMapeamentoDados.js'
import { useGerenciamentoTabelas } from './useGerenciamentoTabelas.js'
import { useEnvioExtratos } from './useEnvioExtratos.js'

export const useBancosSupabase = () => {
  // Importar funcionalidades dos composables especializados
  const validacaoTabelas = useValidacaoTabelas()
  const formatacaoDados = useFormatacaoDados()
  const mapeamentoDados = useMapeamentoDados()
  const gerenciamentoTabelas = useGerenciamentoTabelas()
  const envioExtratos = useEnvioExtratos()

  // Retornar todas as funcionalidades para manter compatibilidade
  return {
    // Estados do envio de extratos
    enviando: envioExtratos.enviando,
    mensagemStatus: envioExtratos.mensagemStatus,
    tipoStatus: envioExtratos.tipoStatus,
    loading: envioExtratos.loading,
    error: envioExtratos.error,
    
    // Métodos principais
    enviarExtratoBancario: envioExtratos.enviarExtratoBancario,
    
    // Métodos de mapeamento
    mapearDadosBancarios: mapeamentoDados.mapearDadosBancarios,
    validarDadosMapeados: mapeamentoDados.validarDadosMapeados,
    
    // Métodos de gerenciamento de tabelas
    obterNomeTabela: gerenciamentoTabelas.obterNomeTabela,
    procurarArquivoSQL: gerenciamentoTabelas.procurarArquivoSQL,
    executarArquivoSQL: gerenciamentoTabelas.executarArquivoSQL,
    criarTabelaPadrao: gerenciamentoTabelas.criarTabelaPadrao,
    
    // Métodos de validação
    testarTabela: validacaoTabelas.testarTabela,
    verificarTabelaFormatos: validacaoTabelas.verificarTabelaFormatos,
    
    // Métodos de formatação
    formatarData: formatacaoDados.formatarData,
    formatarValor: formatacaoDados.formatarValor,
    normalizarString: formatacaoDados.normalizarString,
    truncarTexto: formatacaoDados.truncarTexto,
    
    // Métodos de envio
    enviarEmLotes: envioExtratos.enviarEmLotes
  }
}