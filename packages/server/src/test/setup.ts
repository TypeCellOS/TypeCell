import { resetSupabaseDB, startSupabase } from "./supabaseTestUtil";

export default async function () {
  console.log("setup");
  await startSupabase();
  await resetSupabaseDB();
}
