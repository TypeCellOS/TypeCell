import { startSupabase } from "../supabase/test/supabaseCLIUtil";

export default async function () {
  // in CI, supabase is already started
  if (!process.env.CI) {
    await startSupabase();
  }
  // await resetSupabaseDB();
}
