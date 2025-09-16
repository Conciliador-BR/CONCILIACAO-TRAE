<template>
  <div class="pagamentos-container">
    <div class="pagamentos-header">
      <h1>Pagamentos</h1>
    </div>
    
    <div class="pagamentos-navigation">
      <NuxtLink to="/Pagamentos/Recebimentos" class="nav-link">
        <div class="nav-card">
          <h3>Recebimentos</h3>
          <p>Visualizar recebimentos</p>
        </div>
      </NuxtLink>
      
      <NuxtLink to="/Pagamentos/Previsao-de-Pagamentos" class="nav-link">
        <div class="nav-card">
          <h3>Previsão de Pagamentos</h3>
          <p>Consultar previsões</p>
        </div>
      </NuxtLink>
      
      <NuxtLink to="/Pagamentos/bancos" class="nav-link">
        <div class="nav-card">
          <h3>Bancos</h3>
          <p>Gerenciar informações bancárias</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
// Configurações da página
useHead({
  title: 'Pagamentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de recebimentos e previsão de pagamentos' }
  ]
})
</script>