import { computed } from 'vue'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'

export const useRecebimentos = () => {
  const { dadosRecebimentos, loading, error, fetchRecebimentos: fetchCRUD } = useRecebimentosCRUD()

  const inferirAdquirentePorTabela = (sourceTable = '') => {
    const tabela = String(sourceTable || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    if (!tabela) return ''

    if (tabela.includes('_sipag')) return 'SIPAG'
    if (tabela.includes('_stone')) return 'STONE'
    if (tabela.includes('_cielo')) return 'CIELO'
    if (tabela.includes('_rede')) return 'REDE'
    if (tabela.includes('_getnet')) return 'GETNET'
    if (tabela.includes('_safra')) return 'SAFRA'
    if (tabela.includes('_unica') || tabela.includes('_tripag')) return 'UNICA'

    return ''
  }

  const recebimentos = computed(() => {
    return (dadosRecebimentos.value || []).map(r => ({
      id: r.id,
      sourceTable: r.__source_table || null,
      empresa: r.empresa,
      matriz: r.matriz,
      adquirente: r.adquirente || inferirAdquirentePorTabela(r.__source_table),
      modalidade: r.modalidade,
      bandeira: r.bandeira,
      nsu: r.nsu,
      dataVenda: r.data_venda || r.data_venda?.toString?.() || r.data || '',
      dataRecebimento: r.data_recebimento || '',
      dataPgto: r.data_pgto || '',
      valorRecebido: r.valor_bruto ?? r.valor_liquido ?? 0,
      valorBruto: r.valor_bruto ?? 0,
      valorLiquido: r.valor_liquido ?? 0,
      valorPrevisto: r.valor_previsto ?? 0,
      valorDepositado: r.valor_depositado ?? 0,
      valorPago: r.valor_liquido_antecipacao ?? 0,
      numeroParcelas: r.numero_parcelas ?? 1,
      taxaMdr: r.taxa_mdr ?? null,
      despesaMdr: r.despesa_mdr ?? null,
      despesaExtra: r.despesa_extra ?? 0,
      despesaAntecipacao: r.despesa_antecipacao ?? 0,
      observacoes: r.observacoes || ''
    }))
  })

  const fetchRecebimentos = async () => {
    await fetchCRUD()
    return recebimentos.value
  }

  return {
    recebimentos,
    loading,
    error,
    fetchRecebimentos
  }
}
