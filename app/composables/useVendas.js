import { ref, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jqrrlzwjrsytfmhboocc.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcnJsendqcnN5dGZtaGJvb2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDM1MzMsImV4cCI6MjA2ODE3OTUzM30.mU22q2jmRQtZfeIGw95NEyXVrgeZJnW4O7bV7YbHkfY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const useVendas = () => {
  const vendas = ref([])
  const loading = ref(false)
  const error = ref(null)

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
  const mapFromDatabase = (dbRecord) => {
    const mapped = { id: dbRecord.id }
    Object.entries(reverseMapping).forEach(([dbField, componentField]) => {
      mapped[componentField] = dbRecord[dbField] || (typeof dbRecord[dbField] === 'number' ? 0 : '')
    })
    return mapped
  }

  // Converter dados do componente para formato da tabela
  const mapToDatabase = (componentRecord) => {
    const mapped = {}
    Object.entries(columnMapping).forEach(([componentField, dbField]) => {
      if (componentRecord[componentField] !== undefined) {
        mapped[dbField] = componentRecord[componentField]
      }
    })
    return mapped
  }

  // Buscar todas as vendas
  // Função para buscar vendas
  const fetchVendas = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('vendas_operadora_unica')  // Corrigido: removido o 's' do final
        .select('*')
      
      if (supabaseError) {
        throw supabaseError
      }
      
      vendas.value = data.map(mapFromDatabase)
    } catch (err) {
      error.value = err.message
      console.error('Erro ao buscar vendas:', err)
    } finally {
      loading.value = false
    }
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
      
      const dbData = mapToDatabase(vendaData)
      
      const { data, error: updateError } = await supabase
        .from('vendas_operadora_unica')  // Corrigido aqui também
        .update(mapToDatabase(vendaData))
        .eq('id', id)
        .select()
      
      if (updateError) throw updateError
      
      const updatedVenda = mapFromDatabase(data[0])
      const index = vendas.value.findIndex(v => v.id === id)
      if (index !== -1) {
        vendas.value[index] = updatedVenda
      }
      
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
      
      const { error: supabaseError } = await supabase
        .from('vendas_operadora_unica')  // Corrigido aqui também
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      vendas.value = vendas.value.filter(v => v.id !== id)
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
    return vendas.value.reduce((total, venda) => total + (parseFloat(venda.vendaBruta) || 0), 0)
  })

  const vendaLiquidaTotal = computed(() => {
    return vendas.value.reduce((total, venda) => total + (parseFloat(venda.vendaLiquida) || 0), 0)
  })

  return {
    vendas,
    loading,
    error,
    fetchVendas,
    createVenda,
    updateVenda,
    deleteVenda,
    vendaBrutaTotal,
    vendaLiquidaTotal,
    columnMapping,
    mapFromDatabase,
    mapToDatabase
  }
}