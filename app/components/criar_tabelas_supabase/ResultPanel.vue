<template>
  <div v-if="erro || resultado" class="space-y-3">
    <div v-if="erro" class="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p class="text-sm font-semibold text-red-800">Falha ao criar tabelas</p>
      <p class="mt-1 text-xs text-red-700 break-words">{{ erro }}</p>
    </div>

    <div v-if="resultado" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p class="text-sm font-semibold text-emerald-800">Tabelas criadas</p>
      <p class="mt-1 text-xs text-emerald-700">{{ resultado.created_tables?.length || 0 }} tabela(s) retornadas pelo Supabase</p>
      <div v-if="resultado.created_tables?.length" class="mt-3 grid grid-cols-1 gap-2">
        <div
          v-for="t in resultado.created_tables"
          :key="t"
          class="rounded-xl border border-emerald-200 bg-white px-3 py-2"
        >
          <p class="text-xs font-mono text-emerald-900 break-all">{{ t }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  resultado: { type: Object, default: null },
  erro: { type: String, default: '' }
})
</script>

