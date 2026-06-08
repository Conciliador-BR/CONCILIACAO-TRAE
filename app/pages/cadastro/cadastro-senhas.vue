<template>
  <SenhasContainer 
    v-model="senhas" 
    :empresa-selecionada="empresaSelecionada"
    :empresas="empresas"
    @salvou-senhas="refreshSupabaseSenhas"
  />
</template>

<script setup>
import SenhasContainer from '~/components/cadastro/cadastro-senhas-bancos/SenhasContainer.vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'
import { useSenhasSupabase } from '~/composables/PageTaxas/cadastro-senhas-bancos/index.js'

const senhas = ref([])
const empresaSelecionada = ref('')

// Usar composables
const { escutarEvento, filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas, getValorMatrizPorEmpresa } = useEmpresas()
const { upsertSenhas, loading, error, resumo, buscarSenhas } = useSenhasSupabase()

const refreshSupabaseSenhas = async () => {
  try {
    const empresaObj = empresas.value.find(e => e.id == empresaSelecionada.value) || empresas.value.find(e => e.nome === empresaSelecionada.value)
    const nomeEmpresa = empresaObj ? empresaObj.nome : ''
    const ecValor = empresaObj ? empresaObj.matriz : (nomeEmpresa ? getValorMatrizPorEmpresa(nomeEmpresa) : '')
    const ecFiltro = (() => { const n = Number(ecValor); return isNaN(n) ? ecValor : n })()
    const filtros = {}
    if (nomeEmpresa) filtros.empresa = nomeEmpresa
    if (ecFiltro !== '' && ecFiltro !== null && ecFiltro !== undefined) filtros.ec = ecFiltro
    const dados = await buscarSenhas(filtros)
    senhas.value = (dados?.data || []).map(s => ({
      id: s.id || `senha_${Date.now()}`,
      empresa: s.empresa || nomeEmpresa || '',
      ec: s.ec ?? ecValor ?? '',
      adquirente: s.adquirente || '',
      portal: s.portal || '',
      banco: s.banco || '',
      agencia: s.agencia || '',
      conta: s.conta || '',
      login: s.login || '',
      senha: '',
      temSenha: !!s.temSenha
    }))
  } catch (e) {
    console.error('Erro ao atualizar senhas do Supabase:', e)
  }
}

// Configurações da página
useHead({
  title: 'Cadastro de Senhas e Bancos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Cadastro e gestão de senhas e bancos' }
  ]
})

// Função para registrar visita à aba de senhas
const registrarVisitaSenhas = () => {
  if (process.client) {
    localStorage.setItem('cadastro_ultima_aba', 'senhas')
    console.log('📝 [CADASTRO] Registrada visita à aba: senhas')
  }
}

// Carregar empresas ao montar o componente
onMounted(async () => {
  // Registrar visita à aba de senhas e bancos
  registrarVisitaSenhas()
  
  // Carregar empresas
  await fetchEmpresas()
  console.log('Empresas carregadas:', empresas.value)

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
  await refreshSupabaseSenhas()
})

// Escutar mudanças nos filtros globais
const removerListenerFiltros = escutarEvento('filtrar-senhas', async (filtros) => {
  console.log('Filtros aplicados na página de senhas:', filtros)
  empresaSelecionada.value = filtros.empresaSelecionada || ''
  await refreshSupabaseSenhas()
})

const salvarSenhas = (novasSenhas) => {
  senhas.value = novasSenhas
}

// Exemplo de salvamento no Supabase usando upsert
const salvar = async () => {
  const r = await upsertSenhas(senhas.value, { onConflict: 'chave_composta' })
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
