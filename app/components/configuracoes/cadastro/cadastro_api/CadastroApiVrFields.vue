<template>
  <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h4 class="text-base font-semibold text-emerald-900">Configuracao da {{ metadata.titulo }}</h4>
        <p class="mt-1 text-xs text-emerald-800">
          {{ metadata.descricao }}
        </p>
      </div>
      <div class="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
        Suportado agora
      </div>
    </div>

    <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ metadata.rotuloCampo }} *</label>
        <input
          v-model="form.client_id"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
          :placeholder="metadata.placeholder"
          autocomplete="off"
        />
        <p class="mt-1 text-xs text-gray-500">
          {{ metadata.ajudaCampo }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
        <input
          :value="form.empresas || form.nome_empresa || ''"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
          readonly
        />
        <p class="mt-1 text-xs text-gray-500">Valor enviado para a coluna <span class="font-mono">empresas</span>.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">EC</label>
        <input
          :value="form.ec || form.ec_adquirente || ''"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
          readonly
        />
        <p class="mt-1 text-xs text-gray-500">Valor enviado para a coluna <span class="font-mono">ec</span>.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  operadora: { type: String, default: 'vr' }
})

const configuracoes = {
  vr: {
    titulo: 'VR',
    descricao: 'Para a VR, o nome do arquivo remoto sera salvo na coluna `client_id` da tabela de credenciais.',
    rotuloCampo: 'Nome do arquivo VR',
    placeholder: 'Ex: VR_ECONOMICCARD_10478994000100.txt',
    ajudaCampo: 'Esse valor sera usado pelo download da VR e gravado na coluna `client_id`.'
  },
  lecard: {
    titulo: 'Lecard',
    descricao: 'Para a Lecard, o nome do arquivo remoto sera salvo na coluna `client_id` da tabela de credenciais.',
    rotuloCampo: 'Nome do arquivo Lecard',
    placeholder: 'Ex: Lecard_super_gianizeli',
    ajudaCampo: 'Esse valor sera gravado na coluna `client_id` para identificar o arquivo remoto da Lecard.'
  },
  upbrasil: {
    titulo: 'Up Brasil',
    descricao: 'Para a Up Brasil, o nome do arquivo remoto sera salvo na coluna `client_id` da tabela de credenciais.',
    rotuloCampo: 'Nome do arquivo Up Brasil',
    placeholder: 'Ex: UPBRASIL_SUPERMERCADOGIANIZELI',
    ajudaCampo: 'Esse valor sera gravado na coluna `client_id` para identificar o arquivo remoto da Up Brasil.'
  },
  comprocard: {
    titulo: 'Comprocard',
    descricao: 'Para a Comprocard, o codigo sera salvo na coluna `client_id` da tabela de credenciais.',
    rotuloCampo: 'Codigo Comprocard',
    placeholder: 'Ex: 123456',
    ajudaCampo: 'Esse valor sera gravado na coluna `client_id` como codigo da Comprocard.'
  }
}

const metadata = computed(() => {
  return configuracoes[String(props.operadora || '').trim().toLowerCase()] || configuracoes.vr
})
</script>
