import { createClient } from "@supabase/supabase-js";

// Dormant. This site is static. If an admin area is added later, it joins the
// shared "personal platform" Supabase project as the `julie` tenant (its own
// schema), using NEXT_PUBLIC_SITE_KEY to scope its data.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SITE_KEY = process.env.NEXT_PUBLIC_SITE_KEY ?? "julie";
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
