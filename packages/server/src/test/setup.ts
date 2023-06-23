import { startSupabase } from "../supabase/test/supabaseCLIUtil";

export default async function () {
  if (!process.env.CI) {
    await startSupabase();
  }
  // await resetSupabaseDB();
}
