<template>
  <div class="rounded-xl border border-[#DCE7F3] bg-white p-5 shadow-sm">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-[#102A43]">Criar Estrutura</h3>
        <p class="text-sm text-[#7B8794]">Gera a pasta da adquirente, empresa e as subpastas de status em um unico passo.</p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-[#BCCCDC] px-3 py-2 text-sm font-medium text-[#334E68] transition hover:bg-[#F7FAFC]"
        @click="$emit('atualizar')"
      >
        Atualizar arvore
      </button>
    </div>

    <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#243B53]">Adquirente</span>
        <select
          v-model="form.adquirente"
          class="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#102A43] outline-none transition focus:border-[#486581]"
        >
          <option v-for="item in adquirentes" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </select>
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-[#243B53]">Empresa cadastrada</span>
        <select
          v-model="form.empresaId"
          class="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#102A43] outline-none transition focus:border-[#486581]"
        >
          <option value="">Selecionar do cadastro</option>
          <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
            {{ empresa.displayName || empresa.nome }}
          </option>
        </select>
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-[#243B53]">Empresa manual</span>
        <input
          v-model="form.empresaManual"
          type="text"
          class="w-full rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm text-[#102A43] outline-none transition focus:border-[#486581]"
          placeholder="Digite somente se quiser sobrescrever a empresa cadastrada"
        >
      </label>
    </div>

    <div class="mt-5 rounded-xl border border-dashed border-[#BCCCDC] bg-[#F8FBFF] p-4">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Preview</p>
      <p class="mt-2 text-sm text-[#334E68]">Empresa efetiva: <span class="font-semibold text-[#102A43]">{{ empresaEfetivaNome || 'Aguardando preenchimento' }}</span></p>
      <p class="mt-1 break-all text-sm text-[#334E68]">Pasta principal: <span class="font-semibold text-[#102A43]">{{ previewPath }}</span></p>
    </div>

    <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-xs text-[#7B8794]">
        Esta acao cria automaticamente <span class="font-semibold">inbox</span>, <span class="font-semibold">processando</span>, <span class="font-semibold">processados</span> e <span class="font-semibold">erro</span>.
      </p>

      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg bg-[#102A43] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#163a5a] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="processando || !form.adquirente || !empresaEfetivaNome"
        @click="$emit('criar')"
      >
        {{ processando ? 'Processando...' : 'Criar estrutura' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['criar', 'atualizar'])

defineProps({
  form: {
    type: Object,
    required: true
  },
  empresas: {
    type: Array,
    default: () => []
  },
  adquirentes: {
    type: Array,
    default: () => []
  },
  empresaEfetivaNome: {
    type: String,
    default: ''
  },
  previewPath: {
    type: String,
    default: ''
  },
  processando: {
    type: Boolean,
    default: false
  }
})
</script>
