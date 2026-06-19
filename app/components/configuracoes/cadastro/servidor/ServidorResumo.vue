<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-xl border border-[#DCE7F3] bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Host Publico</p>
        <p class="mt-2 break-all text-sm font-semibold text-[#102A43]">{{ meta.serverHost || 'Nao configurado no runtime' }}</p>
      </div>

      <div class="rounded-xl border border-[#DCE7F3] bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Base Local</p>
        <p class="mt-2 break-all text-sm font-semibold text-[#102A43]">{{ meta.basePath }}</p>
      </div>

      <div class="rounded-xl border border-[#DCE7F3] bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Chave SSH Publica</p>
        <p class="mt-2 break-all text-sm font-semibold text-[#102A43]">{{ meta.sshPublicKeyPath || 'Nao configurada no runtime' }}</p>
      </div>

      <div class="rounded-xl border border-[#DCE7F3] bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Resumo</p>
        <p class="mt-2 text-sm font-semibold text-[#102A43]">{{ meta.summary.totalAdquirentes }} adquirentes</p>
        <p class="text-sm text-[#486581]">{{ meta.summary.totalEmpresas }} empresas</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="rounded-xl border border-[#DCE7F3] bg-white p-4 shadow-sm xl:col-span-2">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[#102A43]">Pastas de apoio</p>
            <p class="text-xs text-[#7B8794]">Estas pastas ajudam a manter logs e backups fora das estruturas das adquirentes.</p>
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold"
            :class="meta.rootExists ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
          >
            {{ meta.rootExists ? 'Base pronta' : 'Base ainda nao criada' }}
          </span>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="dir in meta.supportDirs"
            :key="dir.name"
            class="rounded-full border px-3 py-1 text-xs font-semibold"
            :class="dir.exists ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'"
          >
            {{ dir.name }}
          </span>
        </div>
      </div>

      <div class="rounded-xl border border-[#DCE7F3] bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-[#102A43]">Pastas de status</p>
        <p class="mt-1 text-xs text-[#7B8794]">Toda empresa criada nesta tela recebe automaticamente a estrutura abaixo.</p>

        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="status in meta.statusDirs"
            :key="status"
            class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            {{ status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  meta: {
    type: Object,
    required: true
  }
})
</script>
