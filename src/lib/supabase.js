import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.\n' +
    'Revisa tu archivo .env (ver README.md, paso "Conectar con Supabase").'
  )
}

export const supabase = createClient(url, key)
