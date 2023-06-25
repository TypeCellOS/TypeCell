import * as cp from "child_process";

export async function stopSupabase() {
  console.log("supabase stop");
  cp.execSync("./supabase.sh stop");
  console.log("end: supabase stop");
}

export async function startSupabase() {
  console.log("supabase start");
  cp.execSync("./supabase.sh start");
  console.log("end: supabase start");
}

export async function resetSupabaseDB() {
  console.log("reset db");
  // cp.execSync("npx --no supabase db reset");
  console.log("done reset db");
  // Wait for the database to be ready, in a not so nice way
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
