<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <h3 class="text-2xl font-bold text-gray-900">Cadastro do Cliente</h3>
      <p class="text-sm text-gray-600 mt-1">Preencha os dados para cadastrar a empresa na tabela `empresas`.</p>
    </div>

    <form class="p-8 space-y-6" @submit.prevent="$emit('salvar')">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome da empresa *</label>
          <input v-model="form.nome_empresa" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">CNPJ da empresa *</label>
          <textarea v-model="form.cnpj_empresa" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          <p class="mt-1 text-xs text-gray-500">Pode informar mais de um CNPJ: separe por vírgula, ponto e vírgula ou quebra de linha.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Cadastre a EC *</label>
          <textarea v-model="form.matriz_ec" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          <p class="mt-1 text-xs text-gray-500">Pode informar mais de uma EC: separe por vírgula, ponto e vírgula ou quebra de linha.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Esse CNPJ é matriz ou filial *</label>
          <textarea v-model="form.nome_matriz" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          <p class="mt-1 text-xs text-gray-500">Pode informar múltiplos status (ex: MATRIZ, FILIAL 02, FILIAL 03). O 1o CNPJ sempre sera MATRIZ.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Quais autorizadoras tem na empresa *</label>
          <textarea v-model="form.autorizadoras" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          <p class="mt-1 text-xs text-gray-500">Pode informar mais de uma autorizadora: separe por vírgula, ponto e vírgula ou quebra de linha.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Quais bancos trabalham *</label>
          <textarea v-model="form.bancos" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          <p class="mt-1 text-xs text-gray-500">Pode informar mais de um banco: separe por vírgula, ponto e vírgula ou quebra de linha.</p>
        </div>
      </div>

      <div class="border-t border-gray-200 pt-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Informações Não Obrigatórias</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Qual email</label>
            <input v-model="form.email" type="email" class="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Qual nome do cliente</label>
            <input v-model="form.nome_cliente" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Qual número de contato</label>
            <input v-model="form.contato_cliente" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Qual CPF do cliente</label>
            <input v-model="form.cpf" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      <div v-if="erros.length" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-sm font-semibold text-red-700 mb-2">Corrija os campos obrigatórios:</p>
        <ul class="text-sm text-red-700 list-disc pl-5">
          <li v-for="erro in erros" :key="erro">{{ erro }}</li>
        </ul>
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="salvando"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ salvando ? 'Salvando...' : 'Salvar Cadastro' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true },
  erros: { type: Array, default: () => [] },
  salvando: { type: Boolean, default: false }
})

defineEmits(['salvar'])
</script>
