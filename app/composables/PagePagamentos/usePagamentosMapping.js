export const usePagamentosMapping = () => {
  // Mapear dados do banco para formato da aplicação
  const mapFromDatabase = (vendaDB) => {
    // 🔍 DEBUG: Investigar dados vindos do banco
    if (vendaDB.id && (vendaDB.id % 100 === 0 || Math.random() < 0.01)) { // Debug apenas para algumas vendas
      console.log('🔍 [MAPPING] DEBUG Dados do banco:', {
        id: vendaDB.id,
        data_venda: vendaDB.data_venda,
        previsao_pgto: vendaDB.previsao_pgto,
        empresa: vendaDB.empresa,
        data_venda_type: typeof vendaDB.data_venda,
        previsao_pgto_type: typeof vendaDB.previsao_pgto
      })
    }
    
    return {
      id: vendaDB.id,
      empresa: vendaDB.empresa,
      adquirente: vendaDB.adquirente,
      bandeira: vendaDB.bandeira,
      dataVenda: vendaDB.data_venda,
      data_venda: vendaDB.data_venda, // Manter ambos para compatibilidade
      previsaoPgto: vendaDB.previsao_pgto || null,
      previsao_pgto: vendaDB.previsao_pgto || null, // Manter ambos para compatibilidade
      modalidade: vendaDB.modalidade,
      nsu: vendaDB.nsu,
      vendaBruta: vendaDB.valor_bruto,
      valor_bruto: vendaDB.valor_bruto,
      vendaLiquida: vendaDB.valor_liquido,
      valor_liquido: vendaDB.valor_liquido,
      taxaMdr: vendaDB.taxa_mdr,
      taxa_mdr: vendaDB.taxa_mdr,
      despesaMdr: vendaDB.despesa_mdr,
      despesa_mdr: vendaDB.despesa_mdr,
      numeroParcelas: vendaDB.numero_parcelas,
      numero_parcelas: vendaDB.numero_parcelas,
      matriz: vendaDB.matriz,
      created_at: vendaDB.created_at,
      updated_at: vendaDB.updated_at
    }
  }

  // Mapear dados da aplicação para formato do banco
  const mapToDatabase = (vendaApp) => {
    return {
      empresa: vendaApp.empresa,
      adquirente: vendaApp.adquirente,
      bandeira: vendaApp.bandeira,
      data_venda: vendaApp.dataVenda || vendaApp.data_venda,
      previsao_pgto: vendaApp.previsaoPgto,
      modalidade: vendaApp.modalidade,
      nsu: vendaApp.nsu,
      valor_bruto: vendaApp.vendaBruta || vendaApp.valor_bruto,
      valor_liquido: vendaApp.vendaLiquida || vendaApp.valor_liquido,
      taxa_mdr: vendaApp.taxaMdr || vendaApp.taxa_mdr,
      despesa_mdr: vendaApp.despesaMdr || vendaApp.despesa_mdr,
      numero_parcelas: vendaApp.numeroParcelas || vendaApp.numero_parcelas,
      matriz: vendaApp.matriz
    }
  }

  return {
    mapFromDatabase,
    mapToDatabase
  }
}