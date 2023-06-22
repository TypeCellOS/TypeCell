import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/schema";

const SUPABASE_URL = "http://localhost:54321/";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

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
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storage,
    },
  });
  return supabase;
}

export async function createAnonClient() {
  const supabase = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storage,
    },
  });
  return supabase;
}
