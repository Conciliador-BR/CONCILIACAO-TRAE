import { useAPIsupabase } from '../../useAPIsupabase'

export const useBatchDataFetcher = () => {
  const { supabase } = useAPIsupabase()
  const batchSize = 1000

  const debugKMCData = async (nomeTabela) => {
    console.log(`🔍 [KMC DEBUG] Verificando dados KMC na tabela: ${nomeTabela}`)
    
    try {
      const { data, error } = await supabase
        .from(nomeTabela)
        .select('empresa')
        .limit(10)
      
      if (error) {
        console.warn(`⚠️ [KMC DEBUG] Erro ao verificar dados KMC:`, error.message)
        return
      }
      
      const empresasUnicas = [...new Set(data?.map(item => item.empresa) || [])]
      console.log(`🔍 [KMC DEBUG] Empresas encontradas:`, empresasUnicas)
      
      const kmcEmpresas = empresasUnicas.filter(empresa => 
        empresa && empresa.toLowerCase().includes('kmc')
      )
      console.log(`🔍 [KMC DEBUG] Empresas KMC encontradas:`, kmcEmpresas)
    } catch (error) {
      console.warn(`⚠️ [KMC DEBUG] Erro na verificação KMC:`, error.message)
    }
  }

  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
    console.log(`🔍 [PAGAMENTOS] Buscando dados da tabela: ${nomeTabela}`)
    
    // Se há filtros de empresa ou matriz, fazer verificação de debug primeiro
    if (filtros && (filtros.empresa || filtros.matriz)) {
      // Debug removido
    }
    
    try {
      let allData = []
      let from = 0
      let hasMore = true
      
      while (hasMore) {
        let query = supabase
          .from(nomeTabela)
          .select('*')
          .range(from, from + batchSize - 1)
        
        // Aplicar filtros se fornecidos
        if (filtros) {
          if (filtros.empresa) {
            console.log(`🔍 [PAGAMENTOS] Filtrando por empresa exata: "${filtros.empresa}"`)
            console.log(`🔍 [PAGAMENTOS] Tipo da empresa: ${typeof filtros.empresa}`)
            query = query.eq('empresa', filtros.empresa)
          }
          if (filtros.matriz) {
            const matrizNumero = Number(filtros.matriz)
            console.log(`🔍 [PAGAMENTOS] Filtrando por matriz: ${filtros.matriz} (convertido: ${matrizNumero})`)
            console.log(`🔍 [PAGAMENTOS] Tipo da matriz original: ${typeof filtros.matriz}`)
            console.log(`🔍 [PAGAMENTOS] Matriz é NaN?: ${isNaN(matrizNumero)}`)
            console.log(`🔍 [PAGAMENTOS] Valor final usado no filtro: ${isNaN(matrizNumero) ? filtros.matriz : matrizNumero}`)
            console.log(`🔍 [PAGAMENTOS] Tipo do valor final: ${typeof (isNaN(matrizNumero) ? filtros.matriz : matrizNumero)}`)
            
            // Tentar filtro exato primeiro
            query = query.eq('matriz', isNaN(matrizNumero) ? filtros.matriz : matrizNumero)
          }
          if (filtros.dataInicial) {
            query = query.gte('data_venda', filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            query = query.lte('data_venda', filtros.dataFinal)
          }
        }
        
        const { data, error: supabaseError } = await query
        
        if (supabaseError) {
          console.warn(`⚠️ [PAGAMENTOS] Erro ao buscar tabela ${nomeTabela}:`, supabaseError.message)
          break
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data]
          from += batchSize
          hasMore = data.length === batchSize
        } else {
          hasMore = false
        }
      }
      
      console.log(`✅ [PAGAMENTOS] Tabela ${nomeTabela}: ${allData.length} registros encontrados`)
      return allData
    } catch (tableError) {
      console.warn(`⚠️ [PAGAMENTOS] Tabela ${nomeTabela} não encontrada ou erro:`, tableError.message)
      return []
    }
  }

  // Função alternativa que tenta diferentes estratégias de busca
  const buscarDadosTabelaAlternativo = async (nomeTabela, filtros = null) => {
    console.log(`🔄 [PAGAMENTOS] Tentativa alternativa para tabela: ${nomeTabela}`)
    
    try {
      let allData = []
      let from = 0
      let hasMore = true
      
      while (hasMore) {
        let query = supabase
          .from(nomeTabela)
          .select('*')
          .range(from, from + batchSize - 1)
        
        // Aplicar filtros alternativos se fornecidos
        if (filtros) {
          if (filtros.empresa) {
            console.log(`🔄 [PAGAMENTOS] Filtro alternativo - empresa like: "%${filtros.empresa}%"`)
            query = query.ilike('empresa', `%${filtros.empresa}%`)
          }
          if (filtros.matriz) {
            // Tentar tanto como string quanto como número
            const matrizStr = String(filtros.matriz)
            const matrizNum = Number(filtros.matriz)
            
            console.log(`🔄 [PAGAMENTOS] Filtro alternativo - matriz string: "${matrizStr}" ou número: ${matrizNum}`)
            
            if (!isNaN(matrizNum)) {
              // Se é um número válido, buscar por ambos os tipos
              query = query.or(`matriz.eq.${matrizStr},matriz.eq.${matrizNum}`)
            } else {
              // Se não é número, buscar apenas como string
              query = query.eq('matriz', matrizStr)
            }
          }
          if (filtros.dataInicial) {
            query = query.gte('data_venda', filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            query = query.lte('data_venda', filtros.dataFinal)
          }
        }
        
        const { data, error: supabaseError } = await query
        
        if (supabaseError) {
          console.warn(`⚠️ [PAGAMENTOS] Erro na busca alternativa da tabela ${nomeTabela}:`, supabaseError.message)
          break
        }
        
        if (data && data.length > 0) {
          console.log(`📊 [PAGAMENTOS] Busca alternativa encontrou ${data.length} registros neste lote`)
          allData = [...allData, ...data]
          from += batchSize
          hasMore = data.length === batchSize
        } else {
          hasMore = false
        }
      }
      
      console.log(`✅ [PAGAMENTOS] Busca alternativa - Tabela ${nomeTabela}: ${allData.length} registros encontrados`)
      return allData
    } catch (tableError) {
      console.warn(`⚠️ [PAGAMENTOS] Busca alternativa - Tabela ${nomeTabela} erro:`, tableError.message)
      return []
    }
  }



  return {
    buscarDadosTabela,
    buscarDadosTabelaAlternativo,
    batchSize
  }
}