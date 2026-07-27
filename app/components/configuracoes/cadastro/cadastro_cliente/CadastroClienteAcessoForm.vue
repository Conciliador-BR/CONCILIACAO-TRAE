<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <h3 class="text-2xl font-bold text-gray-900">Acesso do Cliente</h3>
      <p class="text-sm text-gray-600 mt-1">Crie o login do cliente e escolha quais CNPJs ele pode visualizar no filtro global.</p>
    </div>

    <form class="p-8 space-y-6" @submit.prevent="$emit('salvar')">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Login do cliente *</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="cliente@empresa.com"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
          <input
            v-model="form.password"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Minimo de 6 caracteres"
          />
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div class="flex items-center justify-between gap-3 mb-3">
          <div>
            <p class="text-sm font-semibold text-gray-900">CNPJs liberados</p>
            <p class="text-xs text-gray-500">Somente estes CNPJs aparecerao no Global Filters do cliente.</p>
          </div>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
            {{ form.cnpjs.length }} selecionado(s)
          </span>
        </div>

        <div class="mb-4">
          <input
            v-model="busca"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Buscar por empresa, filial, EC ou CNPJ"
          />
        </div>

        <div class="max-h-[360px] overflow-auto space-y-3 pr-1">
          <label
            v-for="empresa in empresasFiltradas"
            :key="empresa.id"
            class="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <input
              :checked="form.cnpjs.includes(empresa.cnpjNormalizado)"
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              @change="$emit('toggle-cnpj', empresa.cnpjNormalizado)"
            />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900">{{ empresa.nome }}</p>
              <p class="text-xs text-gray-500">
                {{ empresa.nomeMatriz || 'Unidade' }} • EC {{ empresa.matriz || 'Nao informado' }}
              </p>
              <p class="text-xs font-mono text-gray-600 mt-1">{{ empresa.cnpj }}</p>
            </div>
          </label>

          <div v-if="empresasFiltradas.length === 0" class="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500 text-center">
            Nenhum CNPJ encontrado com esse filtro.
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
          {{ salvando ? 'Salvando...' : 'Salvar Acesso' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  empresas: { type: Array, default: () => [] },
  erros: { type: Array, default: () => [] },
  salvando: { type: Boolean, default: false }
})

defineEmits(['salvar', 'toggle-cnpj'])

const busca = ref('')

const empresasFiltradas = computed(() => {
  const termo = String(busca.value || '').trim().toLowerCase()
  if (!termo) return props.empresas

  return (props.empresas || []).filter((empresa) => {
    const texto = [
      empresa?.nome,
      empresa?.nomeMatriz,
      empresa?.matriz,
      empresa?.cnpj
    ].map(value => String(value || '').toLowerCase()).join(' ')

    return texto.includes(termo)
  })
})
</script>
