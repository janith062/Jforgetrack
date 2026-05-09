import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const email = 'fresh_1778317997433@theboringpeople.in';
const password = 'password123';
const userId = '770510ee-5842-43c8-9750-02f2fa4831b1';

const supabase = createClient(
  'https://pvgcmrjgzzccfkvetnbh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NtcmpnenpjY2ZrdmV0bmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDk5MDUsImV4cCI6MjA5MzcyNTkwNX0.4kvVTeGx1rS2CL7_wP3pvY64LXUQ4Qm8uKM5fN9481k'
);
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres'
});

async function run() {
  let inserted = false;
  try {
    const existing = await pool.query('select id from public.users where id = $1', [userId]);
    if (existing.rows.length === 0) {
      await pool.query(
        "insert into public.users (id, email, role, display_name) values ($1, $2, 'mentor', 'Diag Mentor')",
        [userId, email]
      );
      inserted = true;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('login_error_status', error?.status ?? null);
    console.log('login_error_code', error?.code ?? null);
    console.log('login_error_message', error?.message ?? null);
    console.log('login_user_id', data?.user?.id ?? null);
  } finally {
    if (inserted) {
      await pool.query('delete from public.users where id = $1', [userId]);
    }
    await pool.end();
  }
}

run().catch(async (e) => {
  console.error('run_error', e);
  await pool.end();
});
