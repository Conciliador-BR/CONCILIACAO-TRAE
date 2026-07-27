<template>
  <div class="space-y-6">
    <CadastroClienteAcessoForm
      :form="form"
      :empresas="empresasComCnpj"
      :erros="erros"
      :salvando="salvando"
      @toggle-cnpj="toggleCnpj"
      @salvar="salvar"
    />

    <div v-if="erro" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {{ erro }}
    </div>

    <div v-if="sucesso" class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
      {{ sucesso }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useCadastroClienteAcesso } from '~/composables/configuracoes/cadastro/useCadastroClienteAcesso'
import CadastroClienteAcessoForm from './CadastroClienteAcessoForm.vue'

const { empresasComCnpj, salvando, erro, sucesso, carregarEmpresas, salvarAcesso } = useCadastroClienteAcesso()

const form = reactive({
  email: '',
  password: '',
  cnpjs: []
})

const erros = ref([])

const validar = () => {
  const lista = []

  if (!String(form.email || '').trim()) lista.push('Login do cliente é obrigatório.')
  if (!String(form.password || '').trim()) lista.push('Senha é obrigatória.')
  if (String(form.password || '').trim() && String(form.password || '').trim().length < 6) {
    lista.push('A senha deve ter pelo menos 6 caracteres.')
  }
  if (!Array.isArray(form.cnpjs) || form.cnpjs.length === 0) {
    lista.push('Selecione ao menos um CNPJ para liberar no filtro global.')
  }

  erros.value = lista
  return lista.length === 0
}

const toggleCnpj = (cnpj) => {
  const normalizado = String(cnpj || '').replace(/\D/g, '')
  if (!normalizado) return

  const index = form.cnpjs.indexOf(normalizado)
  if (index >= 0) {
    form.cnpjs.splice(index, 1)
    return
  }

  form.cnpjs.push(normalizado)
}

const limparFormulario = () => {
  form.email = ''
  form.password = ''
  form.cnpjs.splice(0, form.cnpjs.length)
  erros.value = []
}

const salvar = async () => {
  if (!validar()) return

  try {
    await salvarAcesso({
      email: form.email,
      password: form.password,
      cnpjs: form.cnpjs
    })
    limparFormulario()
    await carregarEmpresas()
  } catch {
    // feedback tratado no composable
  }
}

onMounted(async () => {
  await carregarEmpresas()
})
</script>
