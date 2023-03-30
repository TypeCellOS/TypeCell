import {
  resetSupabaseDB,
  startSupabase,
} from "../supabase/test/supabaseTestUtil";

export default async function () {
  console.log("setup");
  await startSupabase();
  await resetSupabaseDB();
}
