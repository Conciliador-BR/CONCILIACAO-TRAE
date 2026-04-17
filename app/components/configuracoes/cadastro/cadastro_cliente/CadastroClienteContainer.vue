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

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
        <h3 class="text-xl font-bold text-gray-900">Prévia de Tabelas</h3>
        <p class="text-sm text-gray-600 mt-1">Atualiza automaticamente conforme você preenche o formulário.</p>
      </div>

      <div class="p-6 space-y-4">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Empresa normalizada</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ empresaNormalizada || 'empresa_nao_informada' }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
            <p class="text-sm font-semibold text-gray-900">Tabelas previstas</p>
            <p class="mt-1 text-xs text-gray-600">{{ tabelasPrevistas.length }} tabela(s)</p>
          </div>
          <div class="max-h-[380px] overflow-auto p-4">
            <div v-if="tabelasPrevistas.length" class="space-y-2">
              <div
                v-for="tabela in tabelasPrevistas"
                :key="tabela"
                class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <p class="text-xs font-mono text-gray-900 break-all">{{ tabela }}</p>
              </div>
            </div>
            <div v-else class="text-xs text-gray-500">
              Preencha `Nome da empresa` e informe `autorizadoras`/`bancos` para visualizar a prévia.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
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

const normalizeIdentifier = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const splitListInput = (raw) => {
  return Array.from(new Set(
    String(raw || '')
      .split(/[,\n;|/]+/g)
      .map(v => normalizeIdentifier(v))
      .filter(Boolean)
  ))
}

const empresaNormalizada = computed(() => normalizeIdentifier(form.nome_empresa))

const tabelasPrevistas = computed(() => {
  if (!empresaNormalizada.value) return []
  const emp = empresaNormalizada.value
  const providers = splitListInput(form.autorizadoras)
  const bancos = splitListInput(form.bancos)
  const out = []

  providers.forEach((prov) => {
    out.push(`vendas_${emp}_${prov}`)
    out.push(`recebimento_${emp}_${prov}`)
  })

  bancos.forEach((bank) => {
    out.push(`banco_${bank}_${emp}`)
  })

  return out
})

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
