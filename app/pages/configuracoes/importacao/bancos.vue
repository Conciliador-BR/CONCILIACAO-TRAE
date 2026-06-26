<template>
  <div class="page-fluid w-full">
    <ImportarBancos
      @arquivo-processado="handleBancoProcessado"
      @erro-processamento="handleErroBanco"
    />
  </div>
</template>

<script setup>
import ImportarBancos from '~/components/configuracoes/importacao/importacao_bancos/ImportarBancos.vue'

const handleBancoProcessado = (dados) => {
  console.log('Banco processado:', dados)
}

const handleErroBanco = (erro) => {
  console.error('Erro no processamento do banco:', erro)
}
</script>
