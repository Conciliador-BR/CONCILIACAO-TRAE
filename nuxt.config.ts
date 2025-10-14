// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  
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
