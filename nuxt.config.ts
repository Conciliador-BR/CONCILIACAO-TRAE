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
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE,
    adminConfigEmails: process.env.ADMIN_CONFIG_EMAILS || 'mateusribeiro.contabil@gmail.com',
    credentialsEncryptionKey: process.env.CREDENTIALS_ENCRYPTION_KEY || '',
    serverInfraBasePath: process.env.SERVER_INFRA_BASE_PATH || '/opt/conciliadora',
    serverInfraStatusDirs: process.env.SERVER_INFRA_STATUS_DIRS || 'inbox,processando,processados,erro',
    serverInfraSshUser: process.env.SERVER_INFRA_SSH_USER || 'ubuntu',
    serverInfraSshPrivateKeyPath: process.env.SERVER_INFRA_SSH_PRIVATE_KEY_PATH || 'C:\\Users\\mateu\\.ssh\\vr_sftp_rsa',
    vrOracleSshUser: process.env.VR_ORACLE_SSH_USER || process.env.SERVER_INFRA_SSH_USER || 'ubuntu',
    vrOracleSshPrivateKeyPath: process.env.VR_ORACLE_SSH_PRIVATE_KEY_PATH || process.env.SERVER_INFRA_SSH_PRIVATE_KEY_PATH || 'C:\\Users\\mateu\\.ssh\\vr_sftp_rsa',
    vrBasePath: process.env.VR_BASE_PATH || '/opt/conciliadora/vr',
    vrSftpHost: process.env.VR_SFTP_HOST || 'sftp.vr.com.br',
    vrSftpPort: process.env.VR_SFTP_PORT || '22',
    vrSftpUser: process.env.VR_SFTP_USER || 'ftpeconomiccard',
    vrSftpRemoteDir: process.env.VR_SFTP_REMOTE_DIR || '/down',
    vrSftpPrivateKeyPath: process.env.VR_SFTP_PRIVATE_KEY_PATH || '/home/ubuntu/.ssh/vr_sftp_rsa',
    vrSftpFixedRemoteName: process.env.VR_SFTP_FIXED_REMOTE_NAME || 'VR_ECONOMICCARD_10478994000100.txt',
    
    public: {
      // Chaves públicas (expostas ao cliente)
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV || 'development',
      adminConfigEmails: process.env.NUXT_PUBLIC_ADMIN_CONFIG_EMAILS || process.env.ADMIN_CONFIG_EMAILS || 'mateusribeiro.contabil@gmail.com',
      serverInfraHost: process.env.NUXT_PUBLIC_SERVER_INFRA_HOST || '136.248.74.31',
      serverInfraSshPublicKeyPath: process.env.NUXT_PUBLIC_SERVER_INFRA_SSH_PUBLIC_KEY_PATH || 'C:\\Users\\mateu\\.ssh\\vr_sftp_rsa.pub',
      vrOracleHost: process.env.NUXT_PUBLIC_VR_ORACLE_HOST || process.env.NUXT_PUBLIC_SERVER_INFRA_HOST || '136.248.74.31'
    }
  }
})
