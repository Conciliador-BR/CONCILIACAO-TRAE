// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  
  // Configuração do servidor de desenvolvimento
  devServer: {
    host: '0.0.0.0', // Permite acesso de qualquer IP na rede
    port: 3000       // Porta padrão
  },
  
  runtimeConfig: {
    // Chaves privadas (apenas no servidor) - NUNCA exponha service_role no frontend
    // supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    
    public: {
      // Chaves públicas (expostas ao cliente)
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  }
})
