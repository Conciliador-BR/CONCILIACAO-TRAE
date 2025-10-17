<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-200">
    <!-- Header -->
    <div class="border-b border-gray-200 px-6 py-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Cadastro de Bancos</h2>
          <p class="text-gray-600 mt-1">Gerencie as informações bancárias das empresas</p>
        </div>
        <div class="flex space-x-3">
          <button 
            @click="adicionarBanco"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span>Adicionar Banco</span>
          </button>
          <button 
            @click="salvarBancos"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mensagem de sucesso/erro -->
    <div v-if="mensagem" class="mx-6 mt-4">
      <div 
        :class="[
          'p-4 rounded-lg',
          mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        ]"
      >
        {{ mensagem.texto }}
      </div>
    </div>

    <!-- Tabela -->
    <div class="p-6">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Banco
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agência
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conta
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(banco, index) in bancos" :key="banco.id || index" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900 font-medium">
                {{ index + 1 }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                <select 
                  v-model="banco.banco"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione o banco</option>
                  <option v-for="opcaoBanco in opcoesBancos" :key="opcaoBanco" :value="opcaoBanco">
                    {{ opcaoBanco }}
                  </option>
                </select>
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                <input 
                  v-model="banco.agencia"
                  type="text"
                  placeholder="Digite a agência"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                <input 
                  v-model="banco.conta"
                  type="text"
                  placeholder="Digite a conta"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </td>
              <td class="px-4 py-3 text-sm font-medium">
                <button 
                  @click="removerBanco(index)"
                  class="text-red-600 hover:text-red-900 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="bancos.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center">
                  <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  <p class="text-lg font-medium">Nenhum banco cadastrado</p>
                  <p class="text-sm">Clique em "Adicionar Banco" para começar</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer com estatísticas -->
    <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
      <div class="flex justify-between items-center text-sm text-gray-600">
        <span>Total de bancos cadastrados: {{ bancos.length }}</span>
        <span>Última atualização: {{ ultimaAtualizacao }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  empresaSelecionada: {
    type: String,
    default: ''
  },
  empresas: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// Estado reativo
const bancos = ref([...props.modelValue])
const mensagem = ref(null)
const ultimaAtualizacao = ref(new Date().toLocaleString('pt-BR'))

// Opções de bancos conforme solicitado
const opcoesBancos = [
  'TRIBANCO',
  'SICOOB', 
  'BRADESCO',
  'ITAU',
  'SICREDI',
  'SAFRA',
  'SANTANDER',
  'CAIXA'
]

// Função para adicionar novo banco
const adicionarBanco = () => {
  const novoBanco = {
    id: Date.now(),
    banco: '',
    agencia: '',
    conta: ''
  }
  bancos.value.push(novoBanco)
  emit('update:modelValue', bancos.value)
}

// Função para remover banco
const removerBanco = (index) => {
  bancos.value.splice(index, 1)
  emit('update:modelValue', bancos.value)
  mostrarMensagem('Banco removido com sucesso!', 'sucesso')
}

// Função para salvar bancos
const salvarBancos = () => {
  // Validar se todos os campos obrigatórios estão preenchidos
  const bancosIncompletos = bancos.value.filter(banco => 
    !banco.banco || !banco.agencia || !banco.conta
  )
  
  if (bancosIncompletos.length > 0) {
    mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'erro')
    return
  }
  
  // Salvar no localStorage
  localStorage.setItem('bancos-conciliacao', JSON.stringify(bancos.value))
  ultimaAtualizacao.value = new Date().toLocaleString('pt-BR')
  emit('update:modelValue', bancos.value)
  mostrarMensagem('Bancos salvos com sucesso!', 'sucesso')
}

// Função para mostrar mensagens
const mostrarMensagem = (texto, tipo) => {
  mensagem.value = { texto, tipo }
  setTimeout(() => {
    mensagem.value = null
  }, 3000)
}

// Observar mudanças no modelValue
watch(() => props.modelValue, (newValue) => {
  bancos.value = [...newValue]
}, { deep: true })

// Observar mudanças nos bancos
watch(bancos, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })
</script>