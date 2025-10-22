<template>
  <div class="p-4 bg-blue-50 border-b border-blue-200">
    <div class="flex justify-end items-center">
      <BotaoAtualizarVendas 
        @atualizado="handleDadosAtualizados"
        @erro="handleErroAtualizacao"
      />
    </div>
  </div>
</template>

<script setup>
import BotaoAtualizarVendas from './BotaoAtualizarVendas.vue'

const emit = defineEmits(['dados-atualizados', 'erro-atualizacao'])

const handleDadosAtualizados = () => {
  emit('dados-atualizados')
}

const handleErroAtualizacao = (erro) => {
  emit('erro-atualizacao', erro)
}
</script>