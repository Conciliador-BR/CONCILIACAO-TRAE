<template>
  <div class="bg-white rounded-lg shadow-md p-6" v-if="recebimentos.length > 0">
    <h2 class="text-xl font-semibold mb-4">5. Finalizar Importação</h2>
    <div class="flex justify-between items-center">
      <div>
        <p class="text-gray-600">Confirme o envio dos recebimentos para o sistema</p>
        <p class="text-sm text-gray-500">{{ recebimentos.length }} recebimentos serão salvos no banco de dados</p>
      </div>
      <button 
        @click="$emit('enviar-recebimentos')"
        :disabled="enviando"
        class="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="enviando">Enviando...</span>
        <span v-else>Confirmar e Enviar</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  recebimentos: {
    type: Array,
    default: () => []
  },
  enviando: {
    type: Boolean,
    default: false
  }
})

defineEmits(['enviar-recebimentos'])
</script>