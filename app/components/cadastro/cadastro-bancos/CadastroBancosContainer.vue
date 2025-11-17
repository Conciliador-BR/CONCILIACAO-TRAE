<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Cadastro de Bancos</h2>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Gerencie as informações bancárias das empresas</p>
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
    <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                EC
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
                Adquirente
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
                {{ selectedEmpresaNome }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                {{ selectedEmpresaEC }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                <select 
                  v-model="banco.banco"
                  :disabled="isEditing !== index"
                  :class="[
                    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    isEditing !== index ? 'bg-gray-100 cursor-not-allowed' : ''
                  ]"
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
                  :disabled="isEditing !== index"
                  :class="[
                    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    isEditing !== index ? 'bg-gray-100 cursor-not-allowed' : ''
                  ]"
                />
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                <input 
                  v-model="banco.conta"
                  type="text"
                  placeholder="Digite a conta"
                  :disabled="isEditing !== index"
                  :class="[
                    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    isEditing !== index ? 'bg-gray-100 cursor-not-allowed' : ''
                  ]"
                />
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                <select 
                  v-model="banco.adquirente"
                  :disabled="isEditing !== index"
                  :class="[
                    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    isEditing !== index ? 'bg-gray-100 cursor-not-allowed' : ''
                  ]"
                >
                  <option value="">Selecione o adquirente</option>
                  <option v-for="adquirente in opcoesAdquirentes" :key="adquirente" :value="adquirente">
                    {{ adquirente }}
                  </option>
                </select>
              </td>
              <td class="px-4 py-3 text-sm font-medium">
                <div class="flex space-x-2">
                  <button 
                    @click="editarBanco(index)"
                    class="text-indigo-600 hover:text-indigo-900 transition-colors"
                    title="Editar banco"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button 
                    @click="removerBanco(index)"
                    class="text-red-600 hover:text-red-900 transition-colors"
                    title="Remover banco"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="bancos.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
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
    type: [String, Number],
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
const isEditing = ref(-1) // -1: nenhuma linha editável, ou o índice da linha em edição

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

// Opções de adquirentes conforme solicitado
const opcoesAdquirentes = [
  'REDE',
  'CIELO',
  'STONE',
  'SAFRA',
  'PAGSEGURO',
  'SICREDI',
  'AZULZINHA',
  'SIPAG',
  'BIN',
  'UNICA'
]

// Função para adicionar novo banco
const adicionarBanco = () => {
  const novoBanco = {
    id: Date.now(),
    empresa: selectedEmpresaNome.value || '',
    banco: '',
    agencia: '',
    conta: '',
    adquirente: ''
  }
  bancos.value.push(novoBanco)
  // Automaticamente habilitar edição para o novo banco
  isEditing.value = bancos.value.length - 1
  emit('update:modelValue', bancos.value)
}

// Função para editar banco
const editarBanco = (index) => {
  isEditing.value = index // Libera apenas esta linha para edição
}

// Função para remover banco
const removerBanco = (index) => {
  bancos.value.splice(index, 1)
  // Se estava editando a linha removida, desabilitar edição
  if (isEditing.value === index) {
    isEditing.value = -1
  } else if (isEditing.value > index) {
    // Ajustar índice se estava editando uma linha posterior
    isEditing.value = isEditing.value - 1
  }
  emit('update:modelValue', bancos.value)
  mostrarMensagem('Banco removido com sucesso!', 'sucesso')
}

// Função para salvar bancos
const salvarBancos = () => {
  // Validar se todos os campos obrigatórios estão preenchidos
  const bancosIncompletos = bancos.value.filter(banco => 
    !banco.empresa || !banco.banco || !banco.agencia || !banco.conta || !banco.adquirente
  )
  
  if (bancosIncompletos.length > 0) {
    mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'erro')
    return
  }
  
  // Desabilitar edição após salvar
  isEditing.value = -1
  
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

const selectedEmpresa = computed(() => {
  const val = props.empresaSelecionada
  if (!val) return null
  const byId = props.empresas.find(e => e.id == val)
  if (byId) return byId
  const valStr = String(val).trim().toLowerCase()
  return props.empresas.find(e => (e.nome && e.nome.trim().toLowerCase() === valStr) || (e.displayName && e.displayName.trim().toLowerCase() === valStr)) || null
})
const selectedEmpresaNome = computed(() => (selectedEmpresa.value && selectedEmpresa.value.nome) ? selectedEmpresa.value.nome : '')
const selectedEmpresaEC = computed(() => (selectedEmpresa.value && selectedEmpresa.value.matriz) ? selectedEmpresa.value.matriz : '')
watch(selectedEmpresaNome, (nome) => {
  bancos.value.forEach(b => { b.empresa = nome || '' })
}, { immediate: true })
</script>