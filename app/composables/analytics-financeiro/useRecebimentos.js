import { ref } from 'vue'
import { useRecebimentosCRUD } from '../PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'

export const useRecebimentos = () => {
  const recebimentos = ref([])
  const { loading, error, fetchRecebimentos: fetchCRUD } = useRecebimentosCRUD()

  const fetchRecebimentos = async () => {
    const data = await fetchCRUD()
    recebimentos.value = (data || []).map(r => ({
      id: r.id,
      empresa: r.empresa,
      matriz: r.matriz,
      adquirente: r.adquirente,
      modalidade: r.modalidade,
      bandeira: r.bandeira,
      nsu: r.nsu,
      dataVenda: r.data_venda || r.data_venda?.toString?.() || r.data || '',
      dataRecebimento: r.data_recebimento || '',
      valorRecebido: r.valor_bruto ?? r.valor_liquido ?? 0,
      valorBruto: r.valor_bruto ?? 0,
      valorLiquido: r.valor_liquido ?? 0,
      numeroParcelas: r.numero_parcelas ?? 1,
      taxaMdr: r.taxa_mdr ?? null,
      despesaMdr: r.despesa_mdr ?? null
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
