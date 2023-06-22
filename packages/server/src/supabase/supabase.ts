import { createClient } from "@supabase/supabase-js";
import type { Database } from "../@types/schema";

const storage = {
  getItem: (_data: any) => {
    // console.error("getItem not expected to be called", data);
    // throw new Error("getItem not expected to be called");
    return null;
  },
  setItem: () => {
    console.error("setItem not expected to be called");
    throw new Error("setItem not expected to be called");
  },
  removeItem: () => {
    console.error("removeItem not expected to be called");
    throw new Error("removeItem not expected to be called");
  },
};

export async function createServiceClient() {
  const supabase = createClient(
    process.env.TYPECELL_SUPABASE_URL!,
    process.env.TYPECELL_SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storage,
      },
    }
  );
  return supabase;
}

export async function createAnonClient() {
  const supabase = createClient<Database>(
    process.env.TYPECELL_SUPABASE_URL!,
    process.env.TYPECELL_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storage,
      },
    }
  );
  return supabase;
}
