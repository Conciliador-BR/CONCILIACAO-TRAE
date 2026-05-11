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

    <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <p class="text-sm font-semibold text-gray-900">Prévia das Colunas</p>
        <p class="mt-1 text-xs text-gray-600">Nomes das colunas das tabelas de PIX, banco, vendas e recebimentos.</p>
      </div>
      <div class="max-h-[520px] overflow-auto p-4 space-y-4">
        <div
          v-for="bloco in blocosColunas"
          :key="bloco.chave"
          class="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-gray-200 bg-white">
            <p class="text-sm font-semibold text-gray-900">{{ bloco.titulo }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ bloco.descricao }}</p>
          </div>

          <div v-if="bloco.colunas?.length" class="p-4 flex flex-wrap gap-2">
            <span
              v-for="coluna in bloco.colunas"
              :key="`${bloco.chave}-${coluna}`"
              class="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-mono text-gray-700"
            >
              {{ coluna }}
            </span>
          </div>

          <div v-else class="p-4 space-y-3">
            <div
              v-for="grupo in bloco.grupos"
              :key="`${bloco.chave}-${grupo.titulo}`"
              class="rounded-xl border border-gray-200 bg-white p-3"
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-600">{{ grupo.titulo }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="coluna in grupo.colunas"
                  :key="`${bloco.chave}-${grupo.titulo}-${coluna}`"
                  class="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-2.5 py-1 text-[11px] font-mono text-gray-700"
                >
                  {{ coluna }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCriarTabelasSupabase } from '~/composables/configuracoes/cadastro/criar_tabelas_supabase/useCriarTabelasSupabase.js'

const props = defineProps({
  empresa: { type: String, default: '' },
  adquirentes: { type: Array, default: () => [] },
  vouchers: { type: Array, default: () => [] },
  bancos: { type: Array, default: () => [] },
  pix: { type: Boolean, default: false }
})

const { normalizeIdentifier, buildTableNames, getTableColumnPreviews } = useCriarTabelasSupabase()

const empresaNorm = computed(() => normalizeIdentifier(props.empresa))

const tabelas = computed(() => {
  if (!empresaNorm.value) return []
  return buildTableNames({
    empresa: props.empresa,
    adquirentes: props.adquirentes,
    vouchers: props.vouchers,
    bancos: props.bancos,
    pix: props.pix
  })
})

const blocosColunas = computed(() => {
  const previews = getTableColumnPreviews()
  return [
    { chave: 'pix', ...previews.pix },
    { chave: 'banco', ...previews.banco },
    { chave: 'vendas', ...previews.vendas },
    { chave: 'recebimentos', ...previews.recebimentos }
  ]
})
</script>
