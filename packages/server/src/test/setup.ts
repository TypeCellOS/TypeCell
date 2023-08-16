import { startSupabase } from "../supabase/test/supabaseCLIUtil";

// eslint-disable-next-line import/no-anonymous-default-export
export default async function () {
  // in CI, supabase is already started
  if (!process.env.CI) {
    await startSupabase();
  }
  // await resetSupabaseDB();
}
