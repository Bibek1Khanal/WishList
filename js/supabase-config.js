// Fill these in from your Supabase project's Connect dialog.
// Use the project URL and the publishable key (sb_publishable_...).
// Never put a secret/service_role key in this file.
const WISHLIST_SUPABASE_URL = "https://vaatxapwflgylhdrczsl.supabase.co";
const WISHLIST_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qd0gejUlgqNoqqzqmApjDw_Yg0ZEKEk";

if (window.supabase?.createClient && WISHLIST_SUPABASE_URL && WISHLIST_SUPABASE_PUBLISHABLE_KEY) {
  window.wishlistSupabase = window.supabase.createClient(
    WISHLIST_SUPABASE_URL,
    WISHLIST_SUPABASE_PUBLISHABLE_KEY
  );
}
