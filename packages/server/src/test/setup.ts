import {
  resetSupabaseDB,
  startSupabase,
} from "../supabase/test/supabaseCLIUtil";

export default async function () {
  console.log("setup");
  await startSupabase();
  await resetSupabaseDB();
}
