<template>
  <TaxasContainer 
    v-model="taxas" 
    :empresa-selecionada="empresaSelecionada"
    :empresas="empresas"
    @salvou-taxas="refreshSupabaseTaxas"
  />
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
const { empresas, fetchEmpresas, getValorMatrizPorEmpresa } = useEmpresas()
const { upsertTaxas, loading, error, resumo, buscarTaxasDoSupabase } = useTaxasSupabase()

const refreshSupabaseTaxas = async () => {
  try {
    const empresaObj = empresas.value.find(e => e.id == empresaSelecionada.value) || empresas.value.find(e => e.nome === empresaSelecionada.value)
    const nomeEmpresa = empresaObj ? empresaObj.nome : ''
    const ecValor = empresaObj ? empresaObj.matriz : (nomeEmpresa ? getValorMatrizPorEmpresa(nomeEmpresa) : '')
    const ecFiltro = (() => { const n = Number(ecValor); return isNaN(n) ? ecValor : n })()
    const filtros = {}
    if (nomeEmpresa) filtros.empresa = nomeEmpresa
    if (ecFiltro !== '' && ecFiltro !== null && ecFiltro !== undefined) filtros.EC = ecFiltro
    const dados = await buscarTaxasDoSupabase(filtros)
    taxas.value = (dados || []).map(t => ({
      id: t.id || `taxa_${Date.now()}`,
      empresa: t.empresa || nomeEmpresa || '',
      ec: t.EC ?? t.ec ?? ecValor ?? '',
      adquirente: t.adquirente || '',
      bandeira: t.bandeira || '',
      modalidade: t.modalidade || '',
      vouchers: t.vouchers || '',
      parcelas: t.parcelas ?? 1,
      percentualTaxa: t.taxa ?? t.percentual_taxa ?? t.percentualTaxa ?? 0,
      dataCorte: t.data_corte ?? t.dataCorte ?? 1
    }))
    localStorage.setItem('taxas-conciliacao', JSON.stringify(taxas.value))
  } catch (e) {
    console.error('Erro ao atualizar taxas do Supabase:', e)
  }
}

// Configurações da página
useHead({
  title: 'Cadastro de Taxas - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Cadastro e gestão de taxas' }
  ]
})

// Função para registrar visita à aba de taxas
const registrarVisitaTaxas = () => {
  if (process.client) {
    localStorage.setItem('cadastro_ultima_aba', 'taxas')
    console.log('📝 [CADASTRO] Registrada visita à aba: taxas')
  }
}

// Carregar empresas ao montar o componente
onMounted(async () => {
  // Registrar visita à aba de taxas
  registrarVisitaTaxas()
  
  // Carregar empresas
  await fetchEmpresas()
  console.log('Empresas carregadas:', empresas.value)
  
  // Carregar dados salvos (opcional)
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

  // Sempre buscar do Supabase para garantir sincronização entre máquinas
  await refreshSupabaseTaxas()
})

// Escutar mudanças nos filtros globais
const removerListenerFiltros = escutarEvento('filtrar-taxas', async (filtros) => {
  console.log('Filtros aplicados na página de taxas:', filtros)
  empresaSelecionada.value = filtros.empresaSelecionada || ''
  await refreshSupabaseTaxas()
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

onUnmounted(() => {
  if (typeof removerListenerFiltros === 'function') {
    removerListenerFiltros()
  }
})
</script>
