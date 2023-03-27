import { createClient } from "@supabase/supabase-js";
import * as cp from "child_process";
import { Database } from "../types/schema";
import { getRandomUserData } from "./dataUtil";

// const SUPABASE_URL = "http://localhost:8000/";
// const ANON_KEY =
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
// const SERVICE_KEY =
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

const SUPABASE_URL = "http://localhost:54321/";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const storage = {
  getItem: (data: any) => {
    console.error("getItem not expected to be called", data);
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

export async function createRandomUser(name: string) {
  const userData = getRandomUserData(name);

  const supabase = await createAnonClient();
  const { data, error } = await supabase.auth.signUp(userData);
  if (error) {
    throw error;
  }
  return {
    user: data.user,
    session: data.session,
    supabase,
  };
}

export async function stopSupabase() {
  console.log("supabase stop");
  cp.execSync("npx --no supabase stop");
  console.log("end: supabase stop");
}

export async function startSupabase() {
  console.log("supabase start");
  cp.execSync("npx --no supabase start");
  console.log("end: supabase start");
}

export async function resetSupabaseDB() {
  console.log("reset db");
  cp.execSync("npx --no supabase db reset");
  console.log("done reset db");
  // Wait for the database to be ready, in a not so nice way
  // await new Promise((resolve) => setTimeout(resolve, 2000));
}
