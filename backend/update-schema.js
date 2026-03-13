require('dotenv').config();
const supabase = require('./db/client');

async function updateSchema() {
  console.log("🚀 Updating database schema...");
  try {
    // Note: Supabase JS client doesn't support ALTER TABLE directly.
    // We'll try to use an RPC or just warn the user if we can't do it.
    // However, for some projects, we can use the 'postgres' or similar if available,
    // but here we are limited to the Supabase client.
    
    // Check if column exists first by trying to select it
    const { error } = await supabase
      .from('prospects')
      .select('verified_email')
      .limit(1);

    if (error && error.message.includes('column "verified_email" does not exist')) {
      console.log("📝 Column 'verified_email' missing. PLEASE RUN THIS IN SUPABASE SQL EDITOR:");
      console.log("ALTER TABLE prospects ADD COLUMN IF NOT EXISTS verified_email text;");
      
      // Attempting to run via RPC if defined (common in some setups, but unlikely here)
      const { error: rpcErr } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE prospects ADD COLUMN IF NOT EXISTS verified_email text;' });
      if (rpcErr) {
        console.error("❌ Auto-update failed (likely permission issue):", rpcErr.message);
        console.log("⚠️ Please manually add the column in Supabase dashboard.");
      } else {
        console.log("✅ Schema updated via RPC!");
      }
    } else if (error) {
      console.error("❌ Error checking schema:", error.message);
    } else {
      console.log("✅ Column 'verified_email' already exists.");
    }
  } catch (err) {
    console.error("❌ Schema update script failed:", err.message);
  }
}

updateSchema();
