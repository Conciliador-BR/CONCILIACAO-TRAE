import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jqrrlzwjrsytfmhboocc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcnJsendqcnN5dGZtaGJvb2NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjYwMzUzMywiZXhwIjoyMDY4MTc5NTMzfQ.GXGR4fkUQIdBuYXig-kgPMP2W07InIvWA4B7_N9zdt8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('recebimento_mp_dos_santos_azulzinha')
    .select('id, nsu, data_venda, data_recebimento, created_at')
    .eq('nsu', '242359')
  console.log('LENGTH:', data.length)
  console.log(JSON.stringify(data, null, 2))
}
run()