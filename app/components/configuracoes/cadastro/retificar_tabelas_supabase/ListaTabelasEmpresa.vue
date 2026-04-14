<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-700">
        {{ tabelas.length }} tabela(s) encontrada(s).
      </p>
      <label class="inline-flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-200"
          :checked="todosSelecionados"
          @change="$emit('toggle-all', $event.target.checked)"
        />
        Selecionar todas
      </label>
    </div>

    <div class="max-h-72 overflow-auto border border-gray-200 rounded-xl">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 sticky top-0">
          <tr>
            <th class="px-3 py-2 text-left w-10"></th>
            <th class="px-3 py-2 text-left">Tabela</th>
            <th class="px-3 py-2 text-left">Categoria</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tabelas" :key="item.table_name" class="border-t border-gray-100">
            <td class="px-3 py-2">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-200"
                :checked="selecionadas.includes(item.table_name)"
                @change="$emit('toggle-item', item.table_name, $event.target.checked)"
              />
            </td>
            <td class="px-3 py-2 font-mono text-xs">{{ item.table_name }}</td>
            <td class="px-3 py-2 text-xs uppercase">{{ item.category || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tabelas: { type: Array, default: () => [] },
  selecionadas: { type: Array, default: () => [] },
  todosSelecionados: { type: Boolean, default: false }
})

defineEmits(['toggle-item', 'toggle-all'])
</script>
