<template>
  <ImportarBancos 
    @arquivo-processado="handleBancoProcessado"
    @erro-processamento="handleErroBanco"
  />
</template>

<script setup>
import ImportarBancos from '~/components/importacao/importacao_bancos/ImportarBancos.vue'

const handleBancoProcessado = (dados) => {
  console.log('Banco processado:', dados)
}

const handleErroBanco = (erro) => {
  console.error('Erro no processamento do banco:', erro)
}
</script>