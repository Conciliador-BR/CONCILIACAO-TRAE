import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { supabase } from '../useSupabaseConfig'
import { useScopedTableRead } from '~/composables/useScopedTableRead'
import { getOperadorasParaTabela } from '~/composables/PageControladoria/controladoria-vendas/tabela_voucher_manual/constants'
import { normalizarSegmentoTabelaPix } from '~/composables/PageControladoria/pix_manual_shared/common'

const tabelaExisteCacheGlobal = new Map()

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()
  const { shouldUseScopedRead, checkTableExists } = useScopedTableRead()
  const normalizarToken = (value) => String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const normalizarListaUnica = (lista = []) => Array.from(new Set((lista || []).map(normalizarToken).filter(Boolean)))
  const normalizarEc = (valor) => String(valor ?? '').replace(/[^\d]/g, '')
  const quebrarLista = (valor) => String(valor || '')
    .split(/[;,\n|/]+/)
    .map(item => String(item || '').trim())
    .filter(Boolean)

  const operadorasPermitidas = new Set(['unica', 'stone', 'cielo', 'rede', 'getnet', 'safra', 'sipag', 'azulzinha', 'sicredi', 'pagseguro'])
  const mapaOperadoras = {
    pagbank: 'pagseguro',
    pagseguro: 'pagseguro',
    safra: 'safra',
    safrapay: 'safra'
  }

  // Função para verificar se uma tabela existe sem gerar erros de "public."
  const verificarTabelaExiste = async (nomeTabela) => {
    if (shouldUseScopedRead.value) {
      return await checkTableExists(nomeTabela)
    }

    if (tabelaExisteCacheGlobal.has(nomeTabela)) {
      return tabelaExisteCacheGlobal.get(nomeTabela)
    }
    try {
      // Fazer uma consulta muito específica e limitada
      const { error } = await supabase
        .from(nomeTabela)
        .select('id', { head: true })
        .limit(1)
      
      // Se não há erro, a tabela existe
      if (!error) {
        tabelaExisteCacheGlobal.set(nomeTabela, true)
        return true
      }
      
      // Verificar se o erro é especificamente de tabela não encontrada
      if (error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('relation') ||
        error.code === 'PGRST116'
      )) {
        tabelaExisteCacheGlobal.set(nomeTabela, false)
        return false
      }
      
      // Para outros tipos de erro, assumir que a tabela não existe
      tabelaExisteCacheGlobal.set(nomeTabela, false)
      return false
      
    } catch (err) {
      tabelaExisteCacheGlobal.set(nomeTabela, false)
      return false
    }
  }

  const criarNomeTabelaPix = (empresa) => `vendas_pix_${normalizarSegmentoTabelaPix(empresa)}`

  const mapearPixManualParaVenda = (registro = {}, nomeTabela = '') => {
    const brutoSeparado = Number(registro?.valor_bruto ?? 0) || 0
    const mdr = Number(registro?.despesa_mdr ?? 0) || 0
    const liquidoCombinado = Number(registro?.valor_bruto_despesa_mdr ?? 0) || 0
    const usaSchemaCombinado = registro?.valor_bruto == null && registro?.valor_bruto_despesa_mdr != null
    const valorBruto = usaSchemaCombinado ? liquidoCombinado : brutoSeparado
    const valorLiquido = usaSchemaCombinado ? liquidoCombinado : (Number(registro?.valor_liquido ?? NaN) || (valorBruto - mdr))

    return {
      ...registro,
      modalidade: 'Pix',
      bandeira: registro?.bandeira || 'PIX',
      nsu: registro?.nsu || '',
      numero_parcelas: Number(registro?.numero_parcelas || 1) || 1,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      taxa_mdr: Number(registro?.taxa_mdr ?? 0) || 0,
      despesa_mdr: usaSchemaCombinado ? 0 : mdr,
      valor_antecipacao: Number(registro?.valor_antecipacao ?? 0) || 0,
      despesa_antecipacao: Number(registro?.despesa_antecipacao ?? 0) || 0,
      valor_liquido_antecipacao: Number(registro?.valor_liquido_antecipacao ?? 0) || 0,
      auditoria: registro?.auditoria || null,
      __source_table: nomeTabela
    }
  }

  const buscarPixManual = async (empresaSel, filtrosBusca = {}) => {
    const nomeTabela = criarNomeTabelaPix(empresaSel.nome)
    const tabelaExiste = await verificarTabelaExiste(nomeTabela)
    if (!tabelaExiste) return []

    const filtrosPix = {
      empresa: empresaSel.nome,
      matriz: empresaSel.matriz,
      dataInicial: filtrosBusca?.dataInicial,
      dataFinal: filtrosBusca?.dataFinal,
      dateColumn: filtrosBusca?.dateColumn || 'data_venda'
    }

    try {
      const dados = await buscarDadosTabela(nomeTabela, {
        ...filtrosPix,
        columns: 'id, data_venda, modalidade, empresa, matriz, adquirente, observacoes, valor_bruto, despesa_mdr'
      })
      return (dados || []).map(item => mapearPixManualParaVenda(item, nomeTabela))
    } catch (erro) {
      if (!String(erro?.message || '').includes('despesa_mdr')) {
        throw erro
      }
    }

    const dadosCombinados = await buscarDadosTabela(nomeTabela, {
      ...filtrosPix,
      columns: 'id, data_venda, modalidade, empresa, matriz, adquirente, observacoes, valor_bruto_despesa_mdr'
    })

    return (dadosCombinados || []).map(item => mapearPixManualParaVenda(item, nomeTabela))
  }

  const listarTabelasVoucher = async (empresaSel, operadoraFiltro = '') => {
    const nomesTabelas = []
    const tabelasAdicionadas = new Set()
    const filtroNormalizado = normalizarToken(operadoraFiltro)
    const vouchersConfigurados = quebrarLista(empresaSel?.vouchersCadastrados || '')

    for (const voucher of vouchersConfigurados) {
      const candidatos = normalizarListaUnica(getOperadorasParaTabela(voucher))
      for (const candidato of candidatos) {
        if (filtroNormalizado && candidato !== filtroNormalizado) continue
        const nomeTabela = construirNomeTabela(empresaSel.nome, candidato)
        if (tabelasAdicionadas.has(nomeTabela)) continue
        if (!(await verificarTabelaExiste(nomeTabela))) continue
        tabelasAdicionadas.add(nomeTabela)
        nomesTabelas.push(nomeTabela)
      }
    }

    return nomesTabelas
  }

  const buscarEmpresaEspecifica = async (filtros = {}) => {
    const empresaSelGlobal = await obterEmpresaSelecionadaCompleta()
    const empresaOverride = filtros?.empresaOverride
    const empresaSel = empresaOverride?.nome
      ? { nome: empresaOverride.nome, matriz: empresaOverride.matriz, autorizadoras: empresaOverride.autorizadoras || '' }
      : empresaSelGlobal
    
    if (!empresaSel?.nome) {
      return []
    }
    // Reforço: Page Vendas deve sempre filtrar por empresa + EC
    if (!String(empresaSel?.matriz || '').trim()) {
      return []
    }
    
    // Obter operadoras específicas da empresa (dinâmico por empresa filtrada)
    const operadorasEmpresa = normalizarListaUnica(
      String(empresaSel.autorizadoras || '')
        .split(/[;,]/)
        .map(op => op.trim())
        .filter(Boolean)
    ).map(op => mapaOperadoras[op] || op).filter(op => operadorasPermitidas.has(op))
    const operadoraFiltroNormalizada = filtros?.operadora ? (mapaOperadoras[normalizarToken(filtros.operadora)] || normalizarToken(filtros.operadora)) : null
    const operadoraFiltro = operadoraFiltroNormalizada && operadorasPermitidas.has(operadoraFiltroNormalizada)
      ? operadoraFiltroNormalizada
      : null
    const operadorasParaBuscarBase = operadoraFiltro
      ? [operadoraFiltro]
      : normalizarListaUnica([...operadorasEmpresa, 'azulzinha'])
    
    const tabelasConsultadas = new Set()
    const nomesTabelas = []
    for (const operadora of operadorasParaBuscarBase) {
      const nomeTabela = construirNomeTabela(empresaSel.nome, operadora)
      if (tabelasConsultadas.has(nomeTabela)) continue
      tabelasConsultadas.add(nomeTabela)
      nomesTabelas.push(nomeTabela)
    }

    const filtrosBusca = {
      empresa: empresaSel.nome,
      matriz: empresaSel.matriz,
      ...(filtros && {
        dataInicial: filtros.dataInicial,
        dataFinal: filtros.dataFinal,
        nsu: filtros.nsu,
        nsus: filtros.nsus,
        dateColumn: filtros.dateColumn,
        columns: filtros.columns
      })
    }
    const ecSelecionada = normalizarEc(empresaSel.matriz)
    const filtroEhPix = operadoraFiltroNormalizada === 'pix'
    const tabelasVoucher = filtroEhPix ? [] : await listarTabelasVoucher(empresaSel, operadoraFiltroNormalizada)

    const consultas = []

    if (!filtroEhPix) {
      consultas.push(...nomesTabelas.map((nomeTabela) => ({
        nomeTabela,
        executar: async () => {
          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBusca)
          if (!ecSelecionada) return dadosTabela || []
          return (dadosTabela || []).filter(item => normalizarEc(item?.matriz) === ecSelecionada)
        }
      })))
      consultas.push(...tabelasVoucher.map((nomeTabela) => ({
        nomeTabela,
        executar: async () => {
          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBusca)
          if (!ecSelecionada) return dadosTabela || []
          return (dadosTabela || []).filter(item => normalizarEc(item?.matriz) === ecSelecionada)
        }
      })))
    }

    if (!operadoraFiltro || filtroEhPix) {
      consultas.push({
        nomeTabela: criarNomeTabelaPix(empresaSel.nome),
        executar: async () => {
          const dadosPix = await buscarPixManual(empresaSel, filtrosBusca)
          if (!ecSelecionada) return dadosPix || []
          return (dadosPix || []).filter(item => normalizarEc(item?.matriz) === ecSelecionada)
        }
      })
    }

    if (consultas.length === 0) {
      return []
    }

    const resultados = await Promise.allSettled(
      consultas.map(async ({ executar }) => {
        return await executar()
      })
    )

    const falhas = resultados
      .map((resultado, index) => ({ resultado, nomeTabela: consultas[index].nomeTabela }))
      .filter(item => item.resultado.status === 'rejected')

    if (falhas.length > 0) {
      const falhasReais = falhas.filter(item => !String(item.resultado.reason?.message || '').includes('não existe'))
      if (falhasReais.length > 0) {
        const detalhes = falhasReais
          .slice(0, 3)
          .map(item => `${item.nomeTabela}: ${item.resultado.reason?.message || item.resultado.reason}`)
          .join(' | ')

        throw new Error(`Falha ao consultar vendas no Supabase. ${detalhes}`)
      }
    }

    return resultados
      .filter(resultado => resultado.status === 'fulfilled')
      .flatMap(resultado => resultado.value || [])
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}
