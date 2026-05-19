<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-900">{{ form.id ? 'Editar Integracao' : 'Nova Integracao' }}</h3>
          <p class="text-sm text-gray-600 mt-1">Cadastre as credenciais por empresa, adquirente e ambiente.</p>
        </div>
        <div v-if="form.id" class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          Modo edicao
        </div>
      </div>
    </div>

    <form class="p-8 space-y-6" @submit.prevent="$emit('salvar')">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
          <select v-model="form.empresa_id" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <option value="">Selecione uma empresa cadastrada</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.displayName || empresa.nome }}
            </option>
          </select>
        </div>

        <div class="md:col-span-2">
          <CadastroApiSeletorOperadora
            v-model="form.adquirente"
            :adquirentes="adquirentes"
            :vouchers="vouchers"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ambiente *</label>
          <select v-model="form.ambiente" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <option value="sandbox">Sandbox</option>
            <option value="producao">Producao</option>
          </select>
        </div>

        <div class="md:col-span-2" v-if="adquirenteSuportada === 'rede'">
          <CadastroApiRedeFields :form="form" />
        </div>

        <div
          v-else
          class="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900"
        >
          A configuracao detalhada de `{{ labelAdquirenteAtual }}` ainda nao foi implementada.
          Por enquanto, o cadastro inteligente esta preparado para a REDE.
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status da integracao *</label>
          <select v-model="form.status_integracao" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <option value="pendente">Pendente</option>
            <option value="valida">Valida</option>
            <option value="erro">Erro</option>
          </select>
        </div>

        <div class="flex items-center">
          <label class="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <input v-model="form.ativo" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-200" />
            Integracao ativa
          </label>
        </div>
      </div>

      <div v-if="form.status_integracao === 'erro'">
        <label class="block text-sm font-medium text-gray-700 mb-1">Ultimo erro</label>
        <textarea
          v-model="form.ultimo_erro"
          rows="3"
          class="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Descreva o erro tecnico conhecido para esta integracao."
        />
      </div>

      <div v-if="erros.length" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-sm font-semibold text-red-700 mb-2">Corrija os campos abaixo:</p>
        <ul class="text-sm text-red-700 list-disc pl-5">
          <li v-for="erro in erros" :key="erro">{{ erro }}</li>
        </ul>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
          @click="$emit('limpar')"
        >
          Limpar
        </button>
        <button
          type="submit"
          :disabled="salvando"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ salvando ? 'Salvando...' : (form.id ? 'Atualizar Integracao' : 'Salvar Integracao') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CadastroApiRedeFields from './CadastroApiRedeFields.vue'
import CadastroApiSeletorOperadora from './CadastroApiSeletorOperadora.vue'

const props = defineProps({
  form: { type: Object, required: true },
  erros: { type: Array, default: () => [] },
  salvando: { type: Boolean, default: false },
  empresas: { type: Array, default: () => [] },
  adquirentes: { type: Array, default: () => [] },
  vouchers: { type: Array, default: () => [] }
})

defineEmits(['salvar', 'limpar'])

const adquirenteSuportada = computed(() => String(props.form.adquirente || '').trim().toLowerCase())

const labelAdquirenteAtual = computed(() => {
  const item = [...props.adquirentes, ...props.vouchers].find(opcao => opcao.id === props.form.adquirente)
  return item?.label || props.form.adquirente || 'Integracao'
})
</script>
