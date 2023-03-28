import * as cp from "child_process";
import { createAnonClient } from "../supabase/supabase";
import { getRandomUserData } from "./dataUtil";

// const SUPABASE_URL = "http://localhost:8000/";
// const ANON_KEY =
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
// const SERVICE_KEY =
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

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
