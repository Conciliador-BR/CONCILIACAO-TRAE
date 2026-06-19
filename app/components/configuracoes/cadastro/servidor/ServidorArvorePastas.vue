<template>
  <div class="rounded-xl border border-[#DCE7F3] bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-[#102A43]">Arvore de Pastas</h3>
        <p class="text-sm text-[#7B8794]">Selecione qualquer pasta para renomear ou remover pela area de acoes rapidas.</p>
      </div>

      <span class="rounded-full bg-[#F0F4F8] px-3 py-1 text-xs font-semibold text-[#486581]">
        {{ items.length }} adquirentes
      </span>
    </div>

    <div v-if="!items.length" class="mt-5 rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FBFF] px-4 py-6 text-sm text-[#627D98]">
      Nenhuma estrutura encontrada ainda. Crie a primeira empresa na area acima.
    </div>

    <div v-else class="mt-5 space-y-4">
      <div
        v-for="adquirente in items"
        :key="adquirente.key"
        class="rounded-xl border border-[#E3ECF5] bg-[#FBFDFF] p-4"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            class="text-left"
            @click="$emit('selecionar-node', buildAdquirenteNode(adquirente))"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Adquirente</p>
            <p class="mt-1 text-base font-semibold text-[#102A43]">{{ adquirente.label }}</p>
            <p class="mt-1 break-all text-xs text-[#627D98]">{{ adquirente.path }}</p>
          </button>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg border border-[#BCCCDC] px-3 py-2 text-xs font-medium text-[#334E68] transition hover:bg-white"
              @click="$emit('renomear-node', buildAdquirenteNode(adquirente))"
            >
              Renomear adquirente
            </button>
            <button
              type="button"
              class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
              @click="$emit('remover-node', buildAdquirenteNode(adquirente))"
            >
              Remover adquirente
            </button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div
            v-for="empresa in adquirente.empresas"
            :key="empresa.key"
            class="rounded-xl border p-4 transition"
            :class="selectedKey === empresa.key ? 'border-[#486581] bg-[#F7FAFC] shadow-sm' : 'border-[#DCE7F3] bg-white'"
          >
            <button
              type="button"
              class="w-full text-left"
              @click="$emit('selecionar-node', buildEmpresaNode(adquirente, empresa))"
            >
              <p class="text-sm font-semibold text-[#102A43]">{{ empresa.label }}</p>
              <p class="mt-1 break-all text-xs text-[#627D98]">{{ empresa.path }}</p>
            </button>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="status in empresa.statusDirs"
                :key="status.name"
                class="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                :class="status.exists ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'"
              >
                {{ status.name }}
              </span>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-lg border border-[#BCCCDC] px-3 py-2 text-xs font-medium text-[#334E68] transition hover:bg-[#F8FBFF]"
                @click="$emit('renomear-node', buildEmpresaNode(adquirente, empresa))"
              >
                Renomear empresa
              </button>
              <button
                type="button"
                class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                @click="$emit('remover-node', buildEmpresaNode(adquirente, empresa))"
              >
                Remover empresa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['selecionar-node', 'renomear-node', 'remover-node'])

defineProps({
  items: {
    type: Array,
    default: () => []
  },
  selectedKey: {
    type: String,
    default: ''
  }
})

const buildAdquirenteNode = (adquirente) => ({
  key: adquirente.key,
  tipo: 'adquirente',
  label: adquirente.label,
  adquirente: adquirente.label,
  path: adquirente.path
})

const buildEmpresaNode = (adquirente, empresa) => ({
  key: empresa.key,
  tipo: 'empresa',
  label: empresa.label,
  adquirente: adquirente.label,
  empresa: empresa.label,
  path: empresa.path
})
</script>
