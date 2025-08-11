'use strict';

const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function uploadImage(buffer, filename, contentType) {
  const supabase = getSupabase();
  const bucket = 'uploads';
  // Ensure bucket exists (will no-op if exists)
  try { await supabase.storage.createBucket(bucket, { public: true }); } catch (_) {}
  const path = `${Date.now()}-${filename}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType, upsert: false });
  if (error) throw error;
  // Public URL
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return pub.publicUrl;
}

module.exports = { uploadImage };

