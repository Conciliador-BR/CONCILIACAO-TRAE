// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  compatibilityDate: '2025-11-12',
  
  // Configuração do servidor de desenvolvimento
  devServer: {
    host: '0.0.0.0', // Permite acesso de qualquer IP na rede
    port: 3000       // Porta padrão
  },
  
  runtimeConfig: {
    // Chaves privadas (apenas no servidor) - NUNCA exponha service_role no frontend
    // supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    adminConfigEmails: process.env.ADMIN_CONFIG_EMAILS || 'mateusribeiro.contabil@gmail.com',
    serverInfraBasePath: process.env.SERVER_INFRA_BASE_PATH || '/opt/conciliadora',
    serverInfraStatusDirs: process.env.SERVER_INFRA_STATUS_DIRS || 'inbox,processando,processados,erro',
    
    public: {
      // Chaves públicas (expostas ao cliente)
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV || 'development',
      adminConfigEmails: process.env.NUXT_PUBLIC_ADMIN_CONFIG_EMAILS || process.env.ADMIN_CONFIG_EMAILS || 'mateusribeiro.contabil@gmail.com',
      serverInfraHost: process.env.NUXT_PUBLIC_SERVER_INFRA_HOST || '',
      serverInfraSshPublicKeyPath: process.env.NUXT_PUBLIC_SERVER_INFRA_SSH_PUBLIC_KEY_PATH || ''
    }
  }
})
