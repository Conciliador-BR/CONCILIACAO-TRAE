<template>
  <SenhasContainer
    :key="containerKey"
    v-model="senhas"
    :empresa-selecionada="empresaAtual"
    :empresas="empresas"
    @salvou-senhas="carregarSenhas"
  />
</template>

<script setup>
import SenhasContainer from '~/components/cadastro/cadastro-senhas-bancos/SenhasContainer.vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useEmpresas } from '~/composables/useEmpresas'
import { useSenhasSupabase } from '~/composables/PageTaxas/cadastro-senhas-bancos/index.js'

const senhas = ref([])
const empresaSelecionada = ref('')

const { escutarEvento, filtrosGlobais } = useGlobalFilters()
const { empresas, fetchEmpresas } = useEmpresas()
const { buscarSenhas } = useSenhasSupabase()

const normalizarTexto = (valor) => String(valor ?? '').trim().toLowerCase()

const normalizarEc = (valor) => {
  const texto = String(valor ?? '').trim()
  if (!texto) return null

  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : texto
}

const resolveEmpresaSelecionada = (valorSelecionado) => {
  const valor = String(valorSelecionado ?? '').trim()

  if (!valor) return null

  const porId = empresas.value.find((empresa) => String(empresa.id) === valor)
  if (porId) return porId

  const porDisplay = empresas.value.filter((empresa) => normalizarTexto(empresa.displayName) === normalizarTexto(valor))
  if (porDisplay.length === 1) return porDisplay[0]

  const porNome = empresas.value.filter((empresa) => normalizarTexto(empresa.nome) === normalizarTexto(valor))
  if (porNome.length === 1) return porNome[0]

  return null
}

const empresaAtual = computed(() => resolveEmpresaSelecionada(empresaSelecionada.value))
const empresaAtualEc = computed(() => normalizarEc(empresaAtual.value?.matriz))
const containerKey = computed(() => String(empresaAtual.value?.id || 'sem-empresa'))

const carregarSenhas = async () => {
  try {
    if (!empresaAtual.value?.nome || empresaAtualEc.value === null) {
      senhas.value = []
      return
    }

    const resposta = await buscarSenhas({
      empresa: empresaAtual.value.nome,
      ec: empresaAtualEc.value
    })

    senhas.value = (resposta?.data || []).map((item, index) => ({
      id: item.id || `senha_${Date.now()}_${index}`,
      empresaId: empresaAtual.value.id,
      empresa: item.empresa || empresaAtual.value.nome,
      ec: item.ec ?? empresaAtualEc.value,
      adquirente: item.adquirente || '',
      portal: item.portal || '',
      banco: item.banco || '',
      agencia: item.agencia || '',
      conta: item.conta || '',
      login: item.login || '',
      senha: item.senha || '',
      temSenha: !!item.temSenha
    }))
  } catch (error) {
    console.error('Erro ao carregar senhas:', error)
    senhas.value = []
  }
}

const aplicarEmpresaInicial = () => {
  const candidatos = [
    filtrosGlobais.empresaSelecionada,
    process.client ? localStorage.getItem('empresa-selecionada') : ''
  ]

  for (const candidato of candidatos) {
    const empresa = resolveEmpresaSelecionada(candidato)
    if (empresa?.id) {
      empresaSelecionada.value = empresa.id
      return
    }
  }

  empresaSelecionada.value = ''
}

useHead({
  title: 'Cadastro de Senhas e Bancos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Cadastro e gestão de senhas e bancos' }
  ]
})

onMounted(async () => {
  if (process.client) {
    localStorage.setItem('cadastro_ultima_aba', 'senhas')
  }

  await fetchEmpresas()
  aplicarEmpresaInicial()
  await carregarSenhas()
})

const removerListenerFiltros = escutarEvento('filtrar-senhas', async (filtros) => {
  const empresa = resolveEmpresaSelecionada(filtros?.empresaSelecionada)
  empresaSelecionada.value = empresa?.id || ''
  senhas.value = []
  await carregarSenhas()
})

onUnmounted(() => {
  if (typeof removerListenerFiltros === 'function') {
    removerListenerFiltros()
  }
})
</script>
