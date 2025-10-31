<template>
  <CadastroBancosContainer 
    v-model="bancos" 
    :empresa-selecionada="empresaSelecionada"
    :empresas="empresas"
  />
</template>

<script setup>
import CadastroBancosContainer from '~/components/cadastro/cadastro-bancos/CadastroBancosContainer.vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'

const bancos = ref([])
const empresaSelecionada = ref('')

// Usar composables
const { escutarEvento, filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas } = useEmpresas()

// Configurações da página
useHead({
  title: 'Cadastro de Bancos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Cadastro e gestão de bancos' }
  ]
})

// Função para registrar visita à aba de bancos
const registrarVisitaBancos = () => {
  if (process.client) {
    localStorage.setItem('cadastro_ultima_aba', 'bancos')
    console.log('📝 [CADASTRO] Registrada visita à aba: bancos')
  }
}

// Carregar empresas ao montar o componente
onMounted(async () => {
  // Registrar visita à aba de bancos
  registrarVisitaBancos()
  
  // Carregar empresas
  await fetchEmpresas()
  console.log('Empresas carregadas:', empresas.value)
  
  // Carregar dados salvos
  const bancosSalvos = localStorage.getItem('bancos-conciliacao')
  if (bancosSalvos) {
    bancos.value = JSON.parse(bancosSalvos)
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
escutarEvento('filtrar-bancos', (filtros) => {
  console.log('Filtros aplicados na página de bancos:', filtros)
  empresaSelecionada.value = filtros.empresaSelecionada || ''
})

// Salvar dados no localStorage
const salvarBancos = (novosBancos) => {
  bancos.value = novosBancos
  localStorage.setItem('bancos-conciliacao', JSON.stringify(novosBancos))
}
</script>