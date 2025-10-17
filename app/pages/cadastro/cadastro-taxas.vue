<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <TaxasContainer 
        v-model="taxas" 
        :empresa-selecionada="empresaSelecionada"
        :empresas="empresas"
      />
    </div>
  </div>
</template>

<script setup>
import TaxasContainer from '~/components/cadastro/cadastro-taxas/TaxasContainer.vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'
import { useTaxasSupabase } from '~/composables/PageTaxas/useTaxasSupabase'

const taxas = ref([])
const empresaSelecionada = ref('')

// Usar composables
const { escutarEvento, filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas } = useEmpresas()
const { upsertTaxas, loading, error, resumo } = useTaxasSupabase()

// Configurações da página
useHead({
  title: 'Cadastro de Taxas - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Cadastro e gestão de taxas' }
  ]
})

// Carregar empresas ao montar o componente
onMounted(async () => {
  // Carregar empresas
  await fetchEmpresas()
  console.log('Empresas carregadas:', empresas.value)
  
  // Carregar dados salvos
  const taxasSalvas = localStorage.getItem('taxas-conciliacao')
  if (taxasSalvas) {
    taxas.value = JSON.parse(taxasSalvas)
  }
  
  // Usar empresa do filtro global se disponível
  if (filtrosGlobais.empresaSelecionada) {
    empresaSelecionada.value = filtrosGlobais.empresaSelecionada
  } else {
    const empresaSalva = localStorage.getItem('empresa-selecionada')
    if (empresaSalva) {
      empresaSelecionada.value = empresaSalva
    }
  }
})

// Escutar mudanças nos filtros globais
escutarEvento('filtrar-taxas', (filtros) => {
  console.log('Filtros aplicados na página de taxas:', filtros)
  empresaSelecionada.value = filtros.empresaSelecionada || ''
})

// Salvar dados no localStorage
const salvarTaxas = (novasTaxas) => {
  taxas.value = novasTaxas
  localStorage.setItem('taxas-conciliacao', JSON.stringify(novasTaxas))
}

// Exemplo de salvamento no Supabase usando upsert
const salvar = async () => {
  const r = await upsertTaxas(taxas.value, { onConflict: 'id_linhas' })
  if (!r.ok) {
    console.error('Falhas:', resumo.value?.erros || resumo.value)
  }
}
</script>