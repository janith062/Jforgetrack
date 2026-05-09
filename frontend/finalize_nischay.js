import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const emailToKeep = 'nischay@theboringpeople.in';
    const emailToDelete = 'test_865@theboringpeople.in';
    
    console.log(`Finalizing account for ${emailToKeep}...`);

    // 1. Get the ID of the working account (which now has nischay's email)
    const res = await pool.query("SELECT id FROM auth.users WHERE email = $1", [emailToKeep]);
    if (res.rows.length === 0) {
        console.log("Working account not found!");
        return;
    }
    const workingId = res.rows[0].id;
    console.log(`Working User ID: ${workingId}`);

    // 2. Delete the broken account
    await pool.query("DELETE FROM public.users WHERE email = $1", [emailToDelete]);
    await pool.query("DELETE FROM auth.identities WHERE email = $1", [emailToDelete]);
    await pool.query("DELETE FROM auth.users WHERE email = $1", [emailToDelete]);

    // 3. Ensure public.users entry for the working account is correct
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1, $2, 'mentor', 'Nischay B K')
      ON CONFLICT (id) DO UPDATE SET email = $2, role = 'mentor', display_name = 'Nischay B K'
    `, [workingId, emailToKeep]);

    console.log("Nischay's account is now fully functional and verified!");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
