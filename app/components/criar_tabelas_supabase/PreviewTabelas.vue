<template>
  <div class="space-y-4">
    <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p class="text-xs font-medium text-gray-700">Empresa normalizada</p>
      <p class="mt-1 text-sm font-semibold text-gray-900">{{ empresaNorm || 'empresa_nao_informada' }}</p>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <p class="text-sm font-semibold text-gray-900">Tabelas</p>
        <p class="mt-1 text-xs text-gray-600">{{ tabelas.length }} tabela(s) serão criadas</p>
      </div>
      <div class="max-h-[420px] overflow-auto p-4">
        <div v-if="tabelas.length" class="space-y-2">
          <div
            v-for="t in tabelas"
            :key="t"
            class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
          >
            <p class="text-xs font-mono text-gray-900 break-all">{{ t }}</p>
          </div>
        </div>
        <div v-else class="text-xs text-gray-500">Preencha empresa e selecione itens para ver a prévia.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCriarTabelasSupabase } from '~/composables/criar_tabelas_supabase/useCriarTabelasSupabase.js'

const props = defineProps({
  empresa: { type: String, default: '' },
  adquirentes: { type: Array, default: () => [] },
  vouchers: { type: Array, default: () => [] },
  bancos: { type: Array, default: () => [] }
})

const { normalizeIdentifier, buildTableNames } = useCriarTabelasSupabase()

const empresaNorm = computed(() => normalizeIdentifier(props.empresa))

const tabelas = computed(() => {
  if (!empresaNorm.value) return []
  return buildTableNames({
    empresa: props.empresa,
    adquirentes: props.adquirentes,
    vouchers: props.vouchers,
    bancos: props.bancos
  })
})
</script>

