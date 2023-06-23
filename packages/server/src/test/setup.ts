import {
  resetSupabaseDB,
  startSupabase,
} from "../supabase/test/supabaseCLIUtil";

export default async function () {
  await startSupabase();
  await resetSupabaseDB();
}
