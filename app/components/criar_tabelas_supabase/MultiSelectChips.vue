<template>
  <div class="rounded-2xl border border-gray-200 bg-white">
    <div class="px-4 sm:px-5 py-4 border-b border-gray-100">
      <p class="text-sm font-semibold text-gray-900">{{ titulo }}</p>
      <p class="mt-1 text-xs text-gray-600">{{ descricao }}</p>
    </div>

    <div class="p-4 sm:p-5 space-y-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in opcoes"
          :key="opt.id"
          type="button"
          @click="toggle(opt.label)"
          :class="[
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            isSelected(opt.label)
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          ]"
        >
          <span class="truncate">{{ opt.label }}</span>
        </button>
      </div>

      <div class="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-if="permitirPersonalizado"
            v-model.trim="novo"
            type="text"
            placeholder="Adicionar outro..."
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            @keydown.enter.prevent="adicionarNovo"
          />
          <button
            v-if="permitirPersonalizado"
            type="button"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!novo"
            @click="adicionarNovo"
          >
            Adicionar
          </button>
        </div>

        <div v-if="modelValue.length" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="item in modelValue"
            :key="item"
            class="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800"
          >
            <span class="truncate">{{ item }}</span>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-700"
              @click="remove(item)"
              aria-label="Remover"
            >
              ×
            </button>
          </span>
        </div>

        <div v-else class="mt-3 text-xs text-gray-500">Nenhum selecionado.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  titulo: { type: String, required: true },
  descricao: { type: String, default: '' },
  opcoes: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  permitirPersonalizado: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const novo = ref('')
const current = computed(() => props.modelValue || [])

const normalize = (v) => String(v || '').trim()

const isSelected = (label) => current.value.some((x) => x.toLowerCase() === String(label).toLowerCase())

const toggle = (label) => {
  const val = normalize(label)
  if (!val) return
  if (isSelected(val)) {
    emit('update:modelValue', current.value.filter((x) => x.toLowerCase() !== val.toLowerCase()))
    return
  }
  emit('update:modelValue', [...current.value, val])
}

const remove = (label) => {
  const val = normalize(label)
  emit('update:modelValue', current.value.filter((x) => x.toLowerCase() !== val.toLowerCase()))
}

const adicionarNovo = () => {
  const val = normalize(novo.value)
  if (!val) return
  if (!isSelected(val)) emit('update:modelValue', [...current.value, val])
  novo.value = ''
}
</script>

