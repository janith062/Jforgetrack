import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(
  supabaseUrl || 'http://placeholder-url.com',
  supabaseAnonKey || 'placeholder-anon-key'
);

// #region agent log
fetch('http://127.0.0.1:7662/ingest/ff34898f-315f-4614-860e-a1a3f01603a4', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Debug-Session-Id': '5347d3'
  },
  body: JSON.stringify({
    sessionId: '5347d3',
    runId: 'initial',
    hypothesisId: 'H1',
    location: 'src/lib/supabase.js:createClient',
    message: 'Supabase client initialized',
    data: {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
      usesPlaceholderUrl: !supabaseUrl,
      usesPlaceholderKey: !supabaseAnonKey
    },
    timestamp: Date.now()
  })
}).catch(() => {});
// #endregion
