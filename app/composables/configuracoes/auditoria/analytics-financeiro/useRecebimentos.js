import { ref } from 'vue'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'

export const useRecebimentos = () => {
  const recebimentos = ref([])
  const { loading, error, fetchRecebimentos: fetchCRUD } = useRecebimentosCRUD()

  const fetchRecebimentos = async () => {
    const data = await fetchCRUD()
    recebimentos.value = (data || []).map(r => ({
      id: r.id,
      sourceTable: r.__source_table || null,
      empresa: r.empresa,
      matriz: r.matriz,
      adquirente: r.adquirente,
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
    return recebimentos.value
  }

  return {
    recebimentos,
    loading,
    error,
    fetchRecebimentos
  }
}
