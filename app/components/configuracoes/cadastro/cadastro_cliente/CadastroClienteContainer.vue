<template>
  <div class="space-y-6">
    <CadastroClienteForm
      :form="form"
      :erros="erros"
      :salvando="salvando"
      @salvar="salvar"
    />

    <div v-if="mensagem" class="rounded-lg border px-4 py-3" :class="sucesso ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'">
      {{ mensagem }}
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useCadastroClienteSupabase } from '~/composables/configuracoes/cadastro/useCadastroClienteSupabase'
import CadastroClienteForm from './CadastroClienteForm.vue'

const { salvando, salvarCadastroCliente } = useCadastroClienteSupabase()

const form = reactive({
  nome_empresa: '',
  cnpj_empresa: '',
  matriz_ec: '',
  nome_matriz: '',
  autorizadoras: '',
  bancos: '',
  email: '',
  nome_cliente: '',
  contato_cliente: '',
  cpf: ''
})

const erros = ref([])
const mensagem = ref('')
const sucesso = ref(false)

const camposObrigatorios = [
  { key: 'nome_empresa', label: 'Nome da empresa' },
  { key: 'cnpj_empresa', label: 'CNPJ da empresa' },
  { key: 'matriz_ec', label: 'Cadastre a EC' },
  { key: 'nome_matriz', label: 'Esse CNPJ é matriz ou filial' },
  { key: 'autorizadoras', label: 'Quais autorizadoras tem na empresa' },
  { key: 'bancos', label: 'Quais bancos trabalham' }
]

const validar = () => {
  erros.value = camposObrigatorios
    .filter(c => !String(form[c.key] || '').trim())
    .map(c => `${c.label} é obrigatório.`)
  return erros.value.length === 0
}

const limparFormulario = () => {
  Object.keys(form).forEach((k) => { form[k] = '' })
}

const salvar = async () => {
  mensagem.value = ''
  sucesso.value = false

  if (!validar()) return

  try {
    await salvarCadastroCliente(form)
    sucesso.value = true
    mensagem.value = 'Cadastro do cliente salvo com sucesso na tabela empresas.'
    limparFormulario()
  } catch (error) {
    sucesso.value = false
    mensagem.value = `Erro ao salvar cadastro: ${error.message}`
  }
}
</script>
