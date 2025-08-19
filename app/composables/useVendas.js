import { ref, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jqrrlzwjrsytfmhboocc.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcnJsendqcnN5dGZtaGJvb2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDM1MzMsImV4cCI6MjA2ODE3OTUzM30.mU22q2jmRQtZfeIGw95NEyXVrgeZJnW4O7bV7YbHkfY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Estados globais compartilhados (singleton)
const vendas = ref([])
const vendasOriginais = ref([]) // Armazenar dados originais
const loading = ref(false)
const error = ref(null)
const filtroAtivo = ref({
  empresa: '',
  dataInicial: '',
  dataFinal: ''
})

export const useVendas = () => {
  // Mapeamento de colunas do VendasContainer para campos da tabela vendas_operadoras_unica
  const columnMapping = {
    dataVenda: 'data_venda',
    modalidade: 'modalidade',
    nsu: 'nsu',
    vendaBruta: 'valor_bruto',
    vendaLiquida: 'valor_liquido',
    taxaMdr: 'taxa_mdr',
    despesaMdr: 'despesa_mdr',
    numeroParcelas: 'numero_parcelas',
    bandeira: 'bandeira',
    valorAntecipado: 'valor_antecipacao',
    despesasAntecipacao: 'despesa_antecipacao',
    valorLiquidoAntec: 'valor_liquido_antecipacao',
    empresa: 'empresa',
    matriz: 'matriz'
  }

  // Mapeamento reverso (da tabela para o componente)
  const reverseMapping = Object.fromEntries(
    Object.entries(columnMapping).map(([key, value]) => [value, key])
  )

  // Converter dados da tabela para formato do componente
  // Converter dados da tabela para formato do componente
  const mapFromDatabase = (dbRecord) => {
    const mapped = { id: dbRecord.id }
    Object.entries(reverseMapping).forEach(([dbField, componentField]) => {
      let value = dbRecord[dbField] || (typeof dbRecord[dbField] === 'number' ? 0 : '')
      
      // Converter data do formato do banco (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
      if (componentField === 'dataVenda' && value && typeof value === 'string') {
        // Se a data está no formato YYYY-MM-DD, converter para DD/MM/YYYY
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [ano, mes, dia] = value.split('-')
          value = `${dia}/${mes}/${ano}`
        }
      }
      
      mapped[componentField] = value
    })
    return mapped
  }

  // Converter dados do componente para formato da tabela
  // Converter dados do componente para formato da tabela
  const mapToDatabase = (componentRecord) => {
    const mapped = {}
    Object.entries(columnMapping).forEach(([componentField, dbField]) => {
      if (componentRecord[componentField] !== undefined) {
        let value = componentRecord[componentField]
        
        // Converter data do formato brasileiro (DD/MM/YYYY) para formato do banco (YYYY-MM-DD)
        if (componentField === 'dataVenda' && value && typeof value === 'string') {
          // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
          if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [dia, mes, ano] = value.split('/')
            value = `${ano}-${mes}-${dia}`
          }
        }
        
        mapped[dbField] = value
      }
    })
    return mapped
  }

  const fetchVendas = async (forceReload = false) => {
    // Se já temos dados carregados e não é um reload forçado, não recarregar
    if (vendasOriginais.value.length > 0 && !forceReload) {
      console.log('Dados já carregados, mantendo estado atual')
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('vendas_operadora_unica')
        .select('*')
      
      if (supabaseError) {
        throw supabaseError
      }
      
      vendasOriginais.value = data.map(mapFromDatabase)
      
      // Só resetar vendas se não há filtros ativos
      if (!filtroAtivo.value.empresa && !filtroAtivo.value.dataInicial && !filtroAtivo.value.dataFinal) {
        vendas.value = [...vendasOriginais.value]
      } else {
        // Reaplicar filtros existentes
        aplicarFiltros(filtroAtivo.value)
      }
      
      console.log('Vendas carregadas:', vendas.value.length)
    } catch (err) {
      error.value = err.message
      console.error('Erro ao buscar vendas:', err)
    } finally {
      loading.value = false
    }
  }

  // Função para aplicar filtros
  const aplicarFiltros = (filtros = {}) => {
    console.log('Aplicando filtros:', filtros)
    console.log('Vendas originais disponíveis:', vendasOriginais.value.length)
    
    filtroAtivo.value = { ...filtroAtivo.value, ...filtros }
    
    let vendasFiltradas = [...vendasOriginais.value]
    
    // Filtro por empresa - normalizar nomes para comparação
    if (filtroAtivo.value.empresa) {
      const empresaNormalizada = filtroAtivo.value.empresa
        .toLowerCase()
        .replace(/\s+/g, '_') // Substituir espaços por underscore
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      
      console.log('Filtrando por empresa:', empresaNormalizada)
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.empresa) return false
        
        const empresaVendaNormalizada = venda.empresa
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        
        const match = empresaVendaNormalizada.includes(empresaNormalizada)
        if (match) {
          console.log('Empresa encontrada:', venda.empresa)
        }
        return match
      })
    }
    
    // Filtro por data
    if (filtroAtivo.value.dataInicial || filtroAtivo.value.dataFinal) {
      console.log('Filtrando por data:', filtroAtivo.value.dataInicial, 'até', filtroAtivo.value.dataFinal)
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.dataVenda) return false
        
        // Converter data da venda para formato de comparação
        let dataVendaStr = venda.dataVenda
        
        // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (dataVendaStr.includes('/')) {
          const [dia, mes, ano] = dataVendaStr.split('/')
          dataVendaStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
        }
        
        // Converter datas do filtro para formato de comparação
        let dataInicialStr = null
        let dataFinalStr = null
        
        if (filtroAtivo.value.dataInicial) {
          if (filtroAtivo.value.dataInicial.includes('/')) {
            const [dia, mes, ano] = filtroAtivo.value.dataInicial.split('/')
            dataInicialStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
          } else {
            dataInicialStr = filtroAtivo.value.dataInicial
          }
        }
        
        if (filtroAtivo.value.dataFinal) {
          if (filtroAtivo.value.dataFinal.includes('/')) {
            const [dia, mes, ano] = filtroAtivo.value.dataFinal.split('/')
            dataFinalStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
          } else {
            dataFinalStr = filtroAtivo.value.dataFinal
          }
        }
        
        console.log('Comparando strings:', {
          dataVenda: venda.dataVenda,
          dataVendaStr: dataVendaStr,
          dataInicialStr: dataInicialStr,
          dataFinalStr: dataFinalStr
        })
        
        // Comparação simples de strings no formato YYYY-MM-DD
        if (dataInicialStr && dataVendaStr < dataInicialStr) {
          console.log('Rejeitada: data anterior ao início')
          return false
        }
        if (dataFinalStr && dataVendaStr > dataFinalStr) {
          console.log('Rejeitada: data posterior ao fim')
          return false
        }
        
        console.log('Aceita: data dentro do intervalo')
        return true
      })
    }
    
    vendas.value = vendasFiltradas
    console.log(`Filtro aplicado: ${vendasFiltradas.length} vendas encontradas`)
  }

  // Função para limpar filtros
  const limparFiltros = () => {
    filtroAtivo.value = {
      empresa: '',
      dataInicial: '',
      dataFinal: ''
    }
    vendas.value = [...vendasOriginais.value]
  }

  // Criar nova venda
  const createVenda = async (vendaData) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: supabaseError } = await supabase
        .from('vendas_operadora_unica')
        .insert([mapToDatabase(vendaData)])
        .select()
      
      if (supabaseError) throw supabaseError
      
      const newVenda = mapFromDatabase(data[0])
      vendas.value.unshift(newVenda)
      vendasOriginais.value.unshift(newVenda)
      
      return newVenda
    } catch (err) {
      error.value = err.message
      console.error('Erro ao criar venda:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Atualizar venda existente
  const updateVenda = async (id, vendaData) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: updateError } = await supabase
        .from('vendas_operadora_unica')
        .update(mapToDatabase(vendaData))
        .eq('id', id)
        .select()
      
      if (updateError) throw updateError
      
      const updatedVenda = mapFromDatabase(data[0])
      const index = vendas.value.findIndex(v => v.id === id)
      const originalIndex = vendasOriginais.value.findIndex(v => v.id === id)
      
      if (index !== -1) vendas.value[index] = updatedVenda
      if (originalIndex !== -1) vendasOriginais.value[originalIndex] = updatedVenda
      
      return updatedVenda
    } catch (err) {
      error.value = err.message
      console.error('Erro ao atualizar venda:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Deletar venda
  const deleteVenda = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      const { error: deleteError } = await supabase
        .from('vendas_operadora_unica')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      vendas.value = vendas.value.filter(v => v.id !== id)
      vendasOriginais.value = vendasOriginais.value.filter(v => v.id !== id)
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Erro ao deletar venda:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed para totais
  const vendaBrutaTotal = computed(() => {
    return vendas.value.reduce((total, venda) => {
      const valor = parseFloat(venda.vendaBruta) || 0
      return total + valor
    }, 0)
  })

  const vendaLiquidaTotal = computed(() => {
    return vendas.value.reduce((total, venda) => {
      const valor = parseFloat(venda.vendaLiquida) || 0
      return total + valor
    }, 0)
  })

  return {
    vendas,
    vendasOriginais,
    loading,
    error,
    filtroAtivo,
    fetchVendas,
    aplicarFiltros,
    limparFiltros,
    createVenda,
    updateVenda,
    deleteVenda,
    vendaBrutaTotal,
    vendaLiquidaTotal
  }
}