import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jqrrlzwjrsytfmhboocc.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcnJsendqcnN5dGZtaGJvb2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDM1MzMsImV4cCI6MjA2ODE3OTUzM30.mU22q2jmRQtZfeIGw95NEyXVrgeZJnW4O7bV7YbHkfY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)